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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Servicio de Solicitudes de Reunión
 * Maneja solicitudes de reunión entre estudiantes y asesores
 */

// Crear solicitud de reunión
export const createMeetingRequest = async (meetingData) => {
  try {
    const { projectId, requestedBy, topic, proposedDates, message } = meetingData;

    // Validaciones
    if (!topic || topic.trim().length === 0) {
      throw new Error('El tema de la reunión es obligatorio');
    }

    if (!proposedDates || proposedDates.length === 0) {
      throw new Error('Debe proponer al menos una fecha');
    }

    // Crear solicitud
    const newRequest = {
      projectId,
      requestedBy,
      topic: topic.trim(),
      proposedDates,
      message: message?.trim() || '',
      status: 'pending', // pending, accepted, rejected
      acceptedDate: null,
      advisorResponse: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'meetingRequests'), newRequest);

    return {
      id: docRef.id,
      ...newRequest
    };
  } catch (error) {
    console.error('Error creando solicitud de reunión:', error);
    throw new Error(error.message || 'Error al crear solicitud');
  }
};

// Obtener solicitud por ID
export const getMeetingRequestById = async (requestId) => {
  try {
    const requestDoc = await getDoc(doc(db, 'meetingRequests', requestId));
    
    if (!requestDoc.exists()) {
      throw new Error('Solicitud no encontrada');
    }

    return {
      id: requestDoc.id,
      ...requestDoc.data()
    };
  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    throw new Error('Error al obtener solicitud');
  }
};

// Obtener solicitudes de un proyecto
export const getMeetingRequestsByProject = async (projectId) => {
  try {
    const q = query(
      collection(db, 'meetingRequests'),
      where('projectId', '==', projectId)
    );

    const querySnapshot = await getDocs(q);
    
    let requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por fecha (más recientes primero)
    requests.sort((a, b) => {
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      return dateB - dateA;
    });

    return requests;
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    throw new Error('Error al obtener solicitudes');
  }
};

// Actualizar estado de solicitud (asesor)
export const updateMeetingStatus = async (requestId, status, acceptedDate = null, advisorResponse = '') => {
  const validStatuses = ['pending', 'accepted', 'rejected'];
  
  if (!validStatuses.includes(status)) {
    throw new Error('Estado inválido');
  }

  try {
    const requestRef = doc(db, 'meetingRequests', requestId);
    
    const updates = {
      status,
      advisorResponse: advisorResponse.trim(),
      updatedAt: Timestamp.now()
    };

    if (status === 'accepted' && acceptedDate) {
      updates.acceptedDate = acceptedDate;
    }

    await updateDoc(requestRef, updates);

    const updatedDoc = await getDoc(requestRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    throw new Error('Error al actualizar solicitud');
  }
};

// Aceptar solicitud de reunión
export const acceptMeetingRequest = async (requestId, acceptedDate, response = '') => {
  if (!acceptedDate) {
    throw new Error('Debe seleccionar una fecha');
  }

  return await updateMeetingStatus(requestId, 'accepted', acceptedDate, response);
};

// Rechazar solicitud de reunión
export const rejectMeetingRequest = async (requestId, response) => {
  if (!response || response.trim().length === 0) {
    throw new Error('Debe proporcionar una razón para rechazar');
  }

  return await updateMeetingStatus(requestId, 'rejected', null, response);
};

// Eliminar solicitud
export const deleteMeetingRequest = async (requestId) => {
  try {
    await deleteDoc(doc(db, 'meetingRequests', requestId));
    return { success: true };
  } catch (error) {
    console.error('Error eliminando solicitud:', error);
    throw new Error('Error al eliminar solicitud');
  }
};

// Obtener solicitudes pendientes de un proyecto
export const getPendingMeetingRequests = async (projectId) => {
  try {
    const q = query(
      collection(db, 'meetingRequests'),
      where('projectId', '==', projectId),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return requests;
  } catch (error) {
    console.error('Error obteniendo solicitudes pendientes:', error);
    throw new Error('Error al obtener solicitudes pendientes');
  }
};

// Obtener reuniones aceptadas (programadas)
export const getScheduledMeetings = async (projectId) => {
  try {
    const q = query(
      collection(db, 'meetingRequests'),
      where('projectId', '==', projectId),
      where('status', '==', 'accepted')
    );

    const querySnapshot = await getDocs(q);
    
    let meetings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por fecha aceptada
    meetings.sort((a, b) => {
      const dateA = new Date(a.acceptedDate || 0).getTime();
      const dateB = new Date(b.acceptedDate || 0).getTime();
      return dateA - dateB;
    });

    return meetings;
  } catch (error) {
    console.error('Error obteniendo reuniones programadas:', error);
    throw new Error('Error al obtener reuniones');
  }
};