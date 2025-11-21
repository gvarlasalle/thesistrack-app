import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../config/firebase';

/**
 * Servicio de Gestión de Usuarios
 * Maneja CRUD de usuarios en Firestore
 */

// Obtener usuario por ID
export const getUserById = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }

    return {
      uid: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    throw new Error('Error al obtener usuario');
  }
};

// Obtener todos los usuarios
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data()
    }));
    
    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    throw error;
  }
};

// Obtener usuarios por rol
export const getUsersByRole = async (role) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role)
      // Removemos orderBy para evitar necesitar índice compuesto
    );

    const querySnapshot = await getDocs(q);
    
    let users = querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    // Ordenamos en el cliente en lugar de en Firestore
    users.sort((a, b) => a.name.localeCompare(b.name));

    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios por rol:', error);
    throw new Error('Error al obtener usuarios por rol');
  }
};

// Obtener todos los asesores
export const getAllAdvisors = async () => {
  return await getUsersByRole('advisor');
};

// Obtener todos los estudiantes
export const getAllStudents = async () => {
  return await getUsersByRole('student');
};

// Obtener todos los administradores
export const getAllAdmins = async () => {
  return await getUsersByRole('admin');
};

// Crear nuevo usuario (solo datos en Firestore, Auth se maneja en authService)
export const createUser = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    const newUser = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      createdAt: Timestamp.now(),
      ...(userData.role === 'advisor' && { assignedProjects: [] }),
      ...(userData.role === 'student' && { teamId: null })
    };

    await setDoc(userRef, newUser);

    return {
      uid,
      ...newUser
    };
  } catch (error) {
    console.error('Error creando usuario:', error);
    throw new Error('Error al crear usuario');
  }
};

// Actualizar usuario
export const updateUser = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Verificar que el usuario existe
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }

    // Actualizar
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });

    // Obtener datos actualizados
    const updatedDoc = await getDoc(userRef);
    return {
      uid: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    throw new Error('Error al actualizar usuario');
  }
};

// Eliminar usuario (solo de Firestore)
export const deleteUser = async (uid) => {
  try {
    await deleteDoc(doc(db, 'users', uid));
    return { success: true };
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    throw new Error('Error al eliminar usuario');
  }
};

// Verificar si un email ya existe
export const emailExists = async (email) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error verificando email:', error);
    return false;
  }
};

// Obtener estudiantes sin equipo
export const getStudentsWithoutTeam = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('teamId', '==', null)
    );

    const querySnapshot = await getDocs(q);
    
    const students = querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    return students;
  } catch (error) {
    console.error('Error obteniendo estudiantes sin equipo:', error);
    throw new Error('Error al obtener estudiantes disponibles');
  }
};

// Obtener asesores disponibles (con menos de X proyectos)
export const getAvailableAdvisors = async (maxProjects = 5) => {
  try {
    const advisors = await getAllAdvisors();
    
    // Filtrar asesores con menos de maxProjects proyectos
    const available = advisors.filter(advisor => {
      const projectCount = advisor.assignedProjects ? advisor.assignedProjects.length : 0;
      return projectCount < maxProjects;
    });

    return available;
  } catch (error) {
    console.error('Error obteniendo asesores disponibles:', error);
    throw new Error('Error al obtener asesores disponibles');
  }
};

// Obtener conteo de usuarios por rol
export const getUserCountByRole = async () => {
  try {
    const users = await getAllUsers();
    
    const counts = {
      admin: 0,
      advisor: 0,
      student: 0,
      total: users.length
    };

    users.forEach(user => {
      if (counts.hasOwnProperty(user.role)) {
        counts[user.role]++;
      }
    });

    return counts;
  } catch (error) {
    console.error('Error obteniendo conteo de usuarios:', error);
    throw new Error('Error al obtener estadísticas de usuarios');
  }
};

// Registro de nuevo usuario (con soporte para aprobación de asesores)
export const registerUser = async ({ email, password, name, role, approved = false }) => {
  try {
    console.log('Creando usuario con:', { email, name, role, approved });
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    console.log('Usuario creado en Auth:', newUser.uid);

    // Crear documento en Firestore
    const userData = {
      uid: newUser.uid,
      email,
      name,
      role,
      approved,
      createdAt: Timestamp.now(),
      teamId: null,
      assignedProjects: role === 'advisor' ? [] : null
    };

    console.log('Guardando en Firestore:', userData);

    await setDoc(doc(db, 'users', newUser.uid), userData);

    console.log('Usuario guardado en Firestore');

    // Cerrar sesión del nuevo usuario
    await signOut(auth);

    console.log('Sesión cerrada');

    return { 
      uid: newUser.uid, 
      email, 
      name, 
      role, 
      approved 
    };
  } catch (error) {
    console.error('Error completo en registerUser:', error);
    
    // Mensajes de error más claros
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('El correo electrónico ya está registrado');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('El correo electrónico no es válido');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('La contraseña es muy débil');
    }
    
    throw new Error(error.message || 'Error al registrar usuario');
  }
};

// Aprobar usuario (asesor pendiente)
export const approveUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      status: 'active',
      approvedAt: Timestamp.now()
    });

    const updatedDoc = await getDoc(userRef);
    return {
      uid: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error aprobando usuario:', error);
    throw new Error('Error al aprobar usuario');
  }
};

// Rechazar usuario (asesor pendiente)
export const rejectUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      status: 'rejected',
      rejectedAt: Timestamp.now()
    });

    const updatedDoc = await getDoc(userRef);
    return {
      uid: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error rechazando usuario:', error);
    throw new Error('Error al rechazar usuario');
  }
};

// Obtener usuarios pendientes de aprobación
export const getPendingUsers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    
    const users = querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios pendientes:', error);
    return [];
  }
};

// Activar/Desactivar usuario
export const toggleUserStatus = async (userId, isActive) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('Usuario no existe');
    }

    const userData = userSnap.data();
    
    // Proteger último admin
    if (!isActive && userData.role === 'admin') {
      const admins = await getAllAdmins();
      const activeAdmins = admins.filter(a => a.isActive !== false);
      
      if (activeAdmins.length <= 1) {
        throw new Error('No se puede desactivar el último administrador activo del sistema');
      }
    }

    await updateDoc(userRef, {
      isActive: isActive
    });

    // Si se desactiva un estudiante, revisar sus proyectos
    if (!isActive && userData.role === 'student' && userData.teamId) {
      await updateProjectStatusAfterStudentChange(userData.teamId);
    }

    // Si se activa un estudiante, revisar sus proyectos
    if (isActive && userData.role === 'student' && userData.teamId) {
      await updateProjectStatusAfterStudentChange(userData.teamId);
    }

    // Si se desactiva un asesor, sus proyectos pasan a pendiente
    if (!isActive && userData.role === 'advisor' && userData.assignedProjects) {
      await handleAdvisorDeactivation(userData.assignedProjects);
    }

    // Si se activa un asesor, revisar sus proyectos
    if (isActive && userData.role === 'advisor' && userData.assignedProjects) {
      await handleAdvisorActivation(userData.assignedProjects);
    }

    return { success: true };
  } catch (error) {
    console.error('Error cambiando estado de usuario:', error);
    throw error;
  }
};

// Actualizar estado de proyecto después de cambio de estudiante
const updateProjectStatusAfterStudentChange = async (projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) return;

    const projectData = projectSnap.data();
    
    // Verificar cuántos estudiantes activos hay
    let activeStudentsCount = 0;
    if (projectData.teamMembers && projectData.teamMembers.length > 0) {
      for (const studentId of projectData.teamMembers) {
        const studentRef = doc(db, 'users', studentId);
        const studentSnap = await getDoc(studentRef);
        
        if (studentSnap.exists() && studentSnap.data().isActive !== false) {
          activeStudentsCount++;
        }
      }
    }

    // Determinar nuevo estado según reglas
    let newStatus;
    let reason = '';

    if (projectData.advisorId && activeStudentsCount > 0) {
      // Tiene asesor y al menos 1 estudiante activo -> En Progreso
      newStatus = 'in_progress';
    } else if (!projectData.advisorId || activeStudentsCount === 0) {
      // Sin asesor O sin estudiantes activos
      if (projectData.advisorId && activeStudentsCount === 0) {
        // Tiene asesor pero todos los estudiantes inactivos -> Suspendido
        newStatus = 'suspended';
        reason = 'Todos los estudiantes están inactivos';
      } else {
        // Sin asesor -> Pendiente
        newStatus = 'pending';
        reason = projectData.advisorId ? 'Sin estudiantes activos' : 'Sin asesor asignado';
      }
    }

    await updateDoc(projectRef, {
      status: newStatus,
      ...(reason && { suspendedReason: reason, pendingReason: reason })
    });

  } catch (error) {
    console.error('Error actualizando estado de proyecto:', error);
  }
};

// Manejar desactivación de asesor
const handleAdvisorDeactivation = async (projectIds) => {
  try {
    for (const projectId of projectIds) {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        await updateDoc(projectRef, {
          status: 'pending',
          advisorId: null,
          pendingReason: 'Asesor desactivado - requiere reasignación'
        });
      }
    }
  } catch (error) {
    console.error('Error manejando desactivación de asesor:', error);
  }
};

// Manejar activación de asesor
const handleAdvisorActivation = async (projectIds) => {
  try {
    for (const projectId of projectIds) {
      await updateProjectStatusAfterStudentChange(projectId);
    }
  } catch (error) {
    console.error('Error manejando activación de asesor:', error);
  }
};

// Crear usuario POR EL ADMIN (SIN inicio de sesión)
export const createUserByAdmin = async ({ email, password, name, role, approved = true }) => {
  let tempUser = null;
  
  try {
    console.log('🔹 Admin creando usuario:', { email, name, role });
    
    // Verificar que hay un admin autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay sesión de administrador activa');
    }

    console.log('🔹 Admin actual:', currentUser.uid);

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    tempUser = userCredential.user;

    console.log('✅ Usuario creado en Auth:', tempUser.uid);

    // Crear documento en Firestore
    const userData = {
      uid: tempUser.uid,
      email,
      name,
      role,
      approved,
      isActive: true,
      createdAt: Timestamp.now(),
      teamId: null,
      assignedProjects: role === 'advisor' ? [] : null
    };

    await setDoc(doc(db, 'users', tempUser.uid), userData);

    console.log('✅ Documento creado en Firestore');

    // CRÍTICO: Cerrar sesión del nuevo usuario
    console.log('🔹 Cerrando sesión del nuevo usuario...');
    await signOut(auth);
    
    console.log('✅ Sesión cerrada, restaurando admin...');

    // Pequeña pausa para que Firebase restaure la sesión del admin
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { 
      uid: tempUser.uid, 
      email, 
      name, 
      role, 
      approved 
    };
  } catch (error) {
    console.error('❌ Error en createUserByAdmin:', error);
    
    // Si el usuario fue creado en Auth pero falló Firestore, eliminarlo
    if (tempUser) {
      try {
        await tempUser.delete();
        console.log('⚠️ Usuario eliminado de Auth por error');
      } catch (deleteError) {
        console.error('❌ No se pudo eliminar usuario:', deleteError);
      }
    }
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('El correo electrónico ya está registrado');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('El correo electrónico no es válido');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    throw new Error(error.message || 'Error al crear usuario');
  }
};