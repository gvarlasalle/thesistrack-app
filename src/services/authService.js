import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Servicio de Autenticación
 * Maneja login, logout, registro y sesión de usuarios
 */

// Login con email y password
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error('Usuario no encontrado en la base de datos');
    }

    const userData = userDoc.data();

    // Verificar si el usuario está aprobado
    if (userData.approved === false) {
      await signOut(auth);
      throw new Error('Tu cuenta está pendiente de aprobación por un administrador');
    }

    // Verificar si el usuario está activo
    if (userData.isActive === false) {
      await signOut(auth);
      throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador');
    }

    console.log('Login exitoso, rol:', userData.role);

    return {
      uid: user.uid,
      email: user.email,
      ...userData
    };
  } catch (error) {
    console.error('Error en login:', error);
    throw new Error(error.message);
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error en logout:', error);
    throw new Error('Error al cerrar sesión');
  }
};

// Obtener usuario actual
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Observar cambios en el estado de autenticación
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Usuario autenticado - obtener datos completos
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          callback({
            uid: user.uid,
            email: user.email,
            ...userDoc.data()
          });
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error obteniendo datos del usuario:', error);
        callback(null);
      }
    } else {
      // Usuario no autenticado
      callback(null);
    }
  });
};

// Registro de nuevo usuario público (CON inicio de sesión automático)
export const registerUser = async (email, password, userData) => {
  try {
    console.log('🔹 Registro público - Iniciando...', { email, role: userData.role });
    
    const { name, role } = userData;

    // Validaciones
    if (!email || !password || !name || !role) {
      throw new Error('Todos los campos son obligatorios');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    console.log('🔹 Creando usuario en Firebase Auth...');
    
    // 1. Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Usuario creado en Auth:', user.uid);

    // 2. Crear documento en Firestore
    const userDocData = {
      uid: user.uid,
      email: email,
      name: name,
      role: role,
      approved: false,  // Requiere aprobación del admin
      isActive: true,
      createdAt: Timestamp.now()
    };

    // Agregar campos específicos según el rol
    if (role === 'student') {
      userDocData.teamId = null;
    }

    if (role === 'advisor') {
      userDocData.assignedProjects = [];
    }

    console.log('🔹 Guardando en Firestore...');

    console.log('🔹 Guardando en Firestore...');

    await setDoc(doc(db, 'users', user.uid), userDocData);

    console.log('✅ Usuario registrado exitosamente');

    // IMPORTANTE: NO cerrar sesión, el usuario queda autenticado
    return {
      uid: user.uid,
      email: email,
      ...userDocData
    };
  } catch (error) {
    console.error('❌ Error en registro:', error);
    console.error('❌ Código:', error.code);
    
    switch (error.code) {
      case 'auth/admin-restricted-operation':
        throw new Error('El registro está deshabilitado en Firebase Console. Verifica que Email/Password esté habilitado.');
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

// Verificar si hay un usuario autenticado
export const isAuthenticated = () => {
  return auth.currentUser !== null;
};

// Obtener token del usuario actual (para futuras integraciones)
export const getUserToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};