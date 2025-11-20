import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc,
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Servicio de Gestión de Proyectos
 * Maneja CRUD de proyectos y asignaciones
 */

// Crear nuevo proyecto
export const createProject = async (projectData) => {
  try {
    const { title, description, teamMembers, advisorId, milestones } = projectData;

    // Validaciones básicas
    if (!title || title.trim().length < 10) {
      throw new Error('El título debe tener al menos 10 caracteres');
    }

    if (!teamMembers || teamMembers.length === 0) {
      throw new Error('Debe asignar al menos un estudiante');
    }

    if (!advisorId) {
      throw new Error('Debe asignar un asesor');
    }

    // Crear proyecto
    const newProject = {
      title: title.trim(),
      description: description?.trim() || '',
      teamMembers: teamMembers, // Array de UIDs de estudiantes
      advisorId: advisorId,
      status: 'pending', // pending, in_progress, completed, rejected
      currentMilestone: milestones && milestones.length > 0 ? milestones[0].name : 'Inicio',
      milestones: milestones || [
        { name: 'Capítulo 1', completed: false, dueDate: null },
        { name: 'Capítulo 2', completed: false, dueDate: null },
        { name: 'Capítulo 3', completed: false, dueDate: null }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Guardar en Firestore
    const docRef = await addDoc(collection(db, 'projects'), newProject);

    // Actualizar asesor: agregar proyecto a su lista
    const advisorRef = doc(db, 'users', advisorId);
    await updateDoc(advisorRef, {
      assignedProjects: arrayUnion(docRef.id)
    });

    // Actualizar estudiantes: asignar teamId
    for (const studentId of teamMembers) {
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        teamId: docRef.id
      });
    }

    return {
      id: docRef.id,
      ...newProject
    };
  } catch (error) {
    console.error('Error creando proyecto:', error);
    throw new Error(error.message || 'Error al crear proyecto');
  }
};

// Obtener proyecto por ID
export const getProjectById = async (projectId) => {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    
    if (!projectDoc.exists()) {
      throw new Error('Proyecto no encontrado');
    }

    return {
      id: projectDoc.id,
      ...projectDoc.data()
    };
  } catch (error) {
    console.error('Error obteniendo proyecto:', error);
    throw new Error('Error al obtener proyecto');
  }
};

// Obtener todos los proyectos
export const getAllProjects = async () => {
  try {
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return projects;
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    throw new Error('Error al obtener proyectos');
  }
};

// Obtener proyectos de un estudiante
export const getProjectsByStudent = async (studentId) => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('teamMembers', 'array-contains', studentId)
    );

    const querySnapshot = await getDocs(q);
    
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return projects;
  } catch (error) {
    console.error('Error obteniendo proyectos del estudiante:', error);
    throw new Error('Error al obtener proyectos');
  }
};

// Obtener proyectos de un asesor
export const getProjectsByAdvisor = async (advisorId) => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('advisorId', '==', advisorId)
    );

    const querySnapshot = await getDocs(q);
    
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return projects;
  } catch (error) {
    console.error('Error obteniendo proyectos del asesor:', error);
    throw new Error('Error al obtener proyectos');
  }
};

// Actualizar proyecto
export const updateProject = async (projectId, updates) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    
    // Verificar que existe
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) {
      throw new Error('Proyecto no encontrado');
    }

    // Actualizar
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });

    // Obtener datos actualizados
    const updatedDoc = await getDoc(projectRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error actualizando proyecto:', error);
    throw new Error('Error al actualizar proyecto');
  }
};

// Cambiar estado del proyecto
export const updateProjectStatus = async (projectId, newStatus) => {
  const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Estado inválido');
  }

  return await updateProject(projectId, { status: newStatus });
};

// Asignar o cambiar asesor
export const assignAdvisor = async (projectId, newAdvisorId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Proyecto no encontrado');
    }

    const projectData = projectDoc.data();
    const oldAdvisorId = projectData.advisorId;

    // Actualizar proyecto
    await updateDoc(projectRef, {
      advisorId: newAdvisorId,
      updatedAt: Timestamp.now()
    });

    // Remover proyecto del asesor anterior
    if (oldAdvisorId) {
      const oldAdvisorRef = doc(db, 'users', oldAdvisorId);
      await updateDoc(oldAdvisorRef, {
        assignedProjects: arrayRemove(projectId)
      });
    }

    // Agregar proyecto al nuevo asesor
    const newAdvisorRef = doc(db, 'users', newAdvisorId);
    await updateDoc(newAdvisorRef, {
      assignedProjects: arrayUnion(projectId)
    });

    return { success: true };
  } catch (error) {
    console.error('Error asignando asesor:', error);
    throw new Error('Error al asignar asesor');
  }
};

// Marcar hito como completado
export const completeMilestone = async (projectId, milestoneName) => {
  try {
    const project = await getProjectById(projectId);
    
    // Buscar y actualizar el hito
    const updatedMilestones = project.milestones.map(milestone => {
      if (milestone.name === milestoneName) {
        return { ...milestone, completed: true, completedAt: new Date() };
      }
      return milestone;
    });

    // Verificar si todos los hitos están completos
    const allCompleted = updatedMilestones.every(m => m.completed);
    
    await updateDoc(doc(db, 'projects', projectId), {
      milestones: updatedMilestones,
      ...(allCompleted && { status: 'completed' }),
      updatedAt: Timestamp.now()
    });

    return { success: true, allCompleted };
  } catch (error) {
    console.error('Error completando hito:', error);
    throw new Error('Error al completar hito');
  }
};

// Calcular progreso del proyecto
export const calculateProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0;
  
  const completed = milestones.filter(m => m.completed).length;
  return Math.round((completed / milestones.length) * 100);
};

// Obtener proyectos con información adicional (incluye datos de asesor y estudiantes)
export const getProjectsWithDetails = async () => {
  try {
    const projects = await getAllProjects();
    
    // Obtener todos los usuarios para mapear
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersMap = {};
    usersSnapshot.docs.forEach(doc => {
      usersMap[doc.id] = { uid: doc.id, ...doc.data() };
    });

    // Enriquecer proyectos con datos de usuarios
    const projectsWithDetails = projects.map(project => {
      const advisor = usersMap[project.advisorId];
      const team = project.teamMembers.map(memberId => usersMap[memberId]).filter(Boolean);
      const progress = calculateProgress(project.milestones);

      return {
        ...project,
        advisorName: advisor?.name || 'Sin asesor',
        advisorEmail: advisor?.email || '',
        teamNames: team.map(t => t.name),
        progress
      };
    });

    return projectsWithDetails;
  } catch (error) {
    console.error('Error obteniendo proyectos con detalles:', error);
    throw new Error('Error al obtener proyectos');
  }
};

// Eliminar proyecto
export const deleteProject = async (projectId) => {
  try {
    const project = await getProjectById(projectId);

    // Remover proyecto de asesor
    if (project.advisorId) {
      const advisorRef = doc(db, 'users', project.advisorId);
      await updateDoc(advisorRef, {
        assignedProjects: arrayRemove(projectId)
      });
    }

    // Remover teamId de estudiantes
    for (const studentId of project.teamMembers) {
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        teamId: null
      });
    }

    // Eliminar proyecto
    await deleteDoc(doc(db, 'projects', projectId));

    return { success: true };
  } catch (error) {
    console.error('Error eliminando proyecto:', error);
    throw new Error('Error al eliminar proyecto');
  }
};

// Obtener estadísticas de proyectos
export const getProjectStats = async () => {
  try {
    const projects = await getAllProjects();
    
    const stats = {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      in_progress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      rejected: projects.filter(p => p.status === 'rejected').length
    };

    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw new Error('Error al obtener estadísticas');
  }
};

// Obtener proyecto de un estudiante
export const getProjectByStudent = async (studentUid) => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('teamMembers', 'array-contains', studentUid)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const projectDoc = querySnapshot.docs[0];
    return {
      id: projectDoc.id,
      ...projectDoc.data()
    };
  } catch (error) {
    console.error('Error obteniendo proyecto del estudiante:', error);
    return null;
  }
};