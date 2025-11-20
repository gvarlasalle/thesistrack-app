import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    throw new Error('Error al obtener usuarios');
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
export const registerUser = async (email, password, userData) => {
  try {
    const { name, role } = userData;

    // Validaciones
    if (!email || !password || !name || !role) {
      throw new Error('Todos los campos son obligatorios');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // 1. Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Crear documento en Firestore
    const userDocData = {
      email: email,
      name: name,
      role: role,
      status: role === 'advisor' ? 'pending' : 'active', // Asesores pendientes de aprobación
      createdAt: Timestamp.now(),
      ...(role === 'advisor' && { assignedProjects: [] }),
      ...(role === 'student' && { teamId: null })
    };

    await setDoc(doc(db, 'users', user.uid), userDocData);

    return {
      uid: user.uid,
      email: email,
      ...userDocData
    };
  } catch (error) {
    console.error('Error en registro:', error);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('El email ya está registrado');
      case 'auth/invalid-email':
        throw new Error('Email inválido');
      case 'auth/weak-password':
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      default:
        throw new Error(error.message || 'Error al registrar usuario');
    }
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