import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { supabase } from '../config/supabase';

console.log('deliveryService cargado, supabase:', supabase ? 'OK' : 'ERROR');

export const createDelivery = async (deliveryData) => {
  try {
    const { projectId, milestone, description, file } = deliveryData;

    console.log('=== createDelivery - NUEVA VERSION ===');
    console.log('Supabase disponible:', !!supabase);

    if (!projectId || !milestone) {
      throw new Error('Datos de entrega incompletos');
    }

    if (!file) {
      throw new Error('Debe proporcionar un archivo');
    }

    const existingDeliveries = await getDeliveriesByMilestone(projectId, milestone);
    const version = existingDeliveries.length + 1;

    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    
    // Limpiar el nombre: reemplazar espacios y caracteres especiales
    const cleanMilestone = milestone.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    
    const uniqueFileName = `${projectId}/${cleanMilestone}/v${version}_${timestamp}.${fileExtension}`;

    console.log('>>> Subiendo a Supabase Storage:', uniqueFileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('deliveries')
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('>>> ERROR Supabase:', uploadError);
      throw new Error('Error subiendo a Supabase: ' + uploadError.message);
    }

    console.log('>>> Archivo subido a Supabase:', uploadData);

    const { data: urlData } = supabase.storage
      .from('deliveries')
      .getPublicUrl(uniqueFileName);

    console.log('>>> URL Supabase:', urlData.publicUrl);

    const newDelivery = {
      projectId,
      milestone,
      version,
      fileName: file.name,
      fileSize: file.size,
      fileUrl: urlData.publicUrl,
      filePath: uniqueFileName,
      description: description || '',
      status: 'pending',
      uploadedAt: Timestamp.now(),
      reviewedAt: null,
      advisorComments: ''
    };

    console.log('>>> Guardando en Firestore...');
    const docRef = await addDoc(collection(db, 'deliveries'), newDelivery);

    console.log('>>> EXITO TOTAL');
    
    return {
      id: docRef.id,
      ...newDelivery
    };
  } catch (error) {
    console.error('>>> ERROR TOTAL:', error);
    throw error;
  }
};

export const getDeliveryById = async (deliveryId) => {
  try {
    const deliveryDoc = await getDoc(doc(db, 'deliveries', deliveryId));
    
    if (!deliveryDoc.exists()) {
      throw new Error('Entrega no encontrada');
    }

    return {
      id: deliveryDoc.id,
      ...deliveryDoc.data()
    };
  } catch (error) {
    console.error('Error obteniendo entrega:', error);
    throw new Error('Error al obtener entrega');
  }
};

export const getDeliveriesByProject = async (projectId) => {
  try {
    const q = query(
      collection(db, 'deliveries'),
      where('projectId', '==', projectId)
    );

    const querySnapshot = await getDocs(q);
    
    let deliveries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    deliveries.sort((a, b) => {
      const dateA = a.uploadedAt?.toMillis() || 0;
      const dateB = b.uploadedAt?.toMillis() || 0;
      return dateB - dateA;
    });

    return deliveries;
  } catch (error) {
    console.error('Error obteniendo entregas:', error);
    throw new Error('Error al obtener entregas');
  }
};

export const getDeliveriesByMilestone = async (projectId, milestone) => {
  try {
    const q = query(
      collection(db, 'deliveries'),
      where('projectId', '==', projectId),
      where('milestone', '==', milestone)
    );

    const querySnapshot = await getDocs(q);
    
    let deliveries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    deliveries.sort((a, b) => (a.version || 0) - (b.version || 0));

    return deliveries;
  } catch (error) {
    console.error('Error obteniendo entregas por milestone:', error);
    return [];
  }
};

// Aprobar entrega y marcar hito como completado automáticamente
export const approveDelivery = async (deliveryId, comments = '') => {
  try {
    const deliveryRef = doc(db, 'deliveries', deliveryId);
    
    // Obtener la entrega
    const deliveryDoc = await getDoc(deliveryRef);
    if (!deliveryDoc.exists()) {
      throw new Error('Entrega no encontrada');
    }
    
    const deliveryData = deliveryDoc.data();
    
    // Actualizar estado de la entrega
    await updateDoc(deliveryRef, {
      status: 'approved',
      advisorComments: comments,
      reviewedAt: Timestamp.now()
    });

    // Marcar el hito como completado en el proyecto AUTOMÁTICAMENTE
    try {
      const projectRef = doc(db, 'projects', deliveryData.projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (projectDoc.exists()) {
        const project = projectDoc.data();
        
        const updatedMilestones = project.milestones.map(milestone => {
          if (milestone.name === deliveryData.milestone) {
            return { 
              ...milestone, 
              completed: true,
              completedAt: new Date()
            };
          }
          return milestone;
        });
        
        await updateDoc(projectRef, {
          milestones: updatedMilestones
        });
      }
    } catch (projectError) {
      console.error('Error marcando hito como completado:', projectError);
      // No lanzar error, la entrega ya fue aprobada
    }

    const updatedDoc = await getDoc(deliveryRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error aprobando entrega:', error);
    throw new Error('Error al aprobar entrega');
  }
};

export const rejectDelivery = async (deliveryId, comments) => {
  if (!comments || comments.trim().length === 0) {
    throw new Error('Debe proporcionar comentarios al rechazar');
  }

  try {
    const deliveryRef = doc(db, 'deliveries', deliveryId);
    
    await updateDoc(deliveryRef, {
      status: 'rejected',
      advisorComments: comments,
      reviewedAt: Timestamp.now()
    });

    const updatedDoc = await getDoc(deliveryRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error rechazando entrega:', error);
    throw new Error('Error al rechazar entrega');
  }
};

export const getPendingDeliveries = async (projectId) => {
  try {
    const q = query(
      collection(db, 'deliveries'),
      where('projectId', '==', projectId),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    
    const deliveries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return deliveries;
  } catch (error) {
    console.error('Error obteniendo entregas pendientes:', error);
    throw new Error('Error al obtener entregas pendientes');
  }
};

// Obtener todas las entregas de un proyecto específico
export const getProjectDeliveries = async (projectId) => {
  try {
    const deliveriesRef = collection(db, 'deliveries');
    const q = query(deliveriesRef, where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    
    const deliveries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Ordenar por fecha de subida descendente (más reciente primero)
    deliveries.sort((a, b) => {
      const dateA = a.submittedAt || a.uploadedAt;
      const dateB = b.submittedAt || b.uploadedAt;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.toDate() - dateA.toDate();
    });
    
    return deliveries;
  } catch (error) {
    console.error('Error obteniendo entregas del proyecto:', error);
    throw error;
  }
};

// Verificar si se puede subir una nueva versión para un hito específico
export const canUploadToMilestone = async (projectId, milestone) => {
  try {
    // Obtener todas las entregas de este hito
    const deliveries = await getDeliveriesByMilestone(projectId, milestone);
    
    // Si no hay entregas, se puede subir
    if (deliveries.length === 0) {
      return { canUpload: true, reason: 'no_deliveries' };
    }
    
    // Obtener la última versión
    const lastDelivery = deliveries[deliveries.length - 1];
    
    // Si la última está pendiente, NO se puede subir
    if (lastDelivery.status === 'pending') {
      return { 
        canUpload: false, 
        reason: 'pending_review',
        message: 'Hay una versión pendiente de revisión'
      };
    }
    
    // Si la última fue rechazada, SÍ se puede subir nueva versión
    if (lastDelivery.status === 'rejected') {
      return { 
        canUpload: true, 
        reason: 'rejected',
        message: 'Puede subir una nueva versión'
      };
    }
    
    // Si la última fue aprobada, NO se puede subir más
    if (lastDelivery.status === 'approved') {
      return { 
        canUpload: false, 
        reason: 'approved',
        message: 'Este hito ya fue aprobado'
      };
    }
    
    return { canUpload: true, reason: 'unknown' };
  } catch (error) {
    console.error('Error verificando posibilidad de subida:', error);
    return { canUpload: false, reason: 'error', message: error.message };
  }
};

// Obtener el estado del hito actual del estudiante
export const getCurrentMilestoneStatus = async (projectId, milestones) => {
  try {
    const allDeliveries = await getDeliveriesByProject(projectId);
    
    // Crear un mapa de estados por hito
    const milestoneStatus = {};
    
    for (const milestone of milestones) {
      const milestoneName = milestone.name || milestone;
      const deliveries = allDeliveries.filter(d => d.milestone === milestoneName);
      
      if (deliveries.length === 0) {
        milestoneStatus[milestoneName] = {
          status: 'not_started',
          canUpload: true,
          deliveries: [],
          message: ''
        };
      } else {
        // Ordenar entregas por versión (la más reciente al final)
        deliveries.sort((a, b) => (a.version || 0) - (b.version || 0));
        
        // Obtener la ÚLTIMA entrega (versión más reciente)
        const lastDelivery = deliveries[deliveries.length - 1];
        
        // El estado del hito es el estado de la ÚLTIMA versión
        const uploadPermission = await canUploadToMilestone(projectId, milestoneName);
        
        let message = '';
        if (lastDelivery.status === 'pending') {
          message = 'Hay una versión pendiente de revisión';
        } else if (lastDelivery.status === 'rejected') {
          message = 'La última versión fue rechazada. Puede subir una nueva versión';
        } else if (lastDelivery.status === 'approved') {
          message = 'Este hito ya fue aprobado';
        }
        
        milestoneStatus[milestoneName] = {
          status: lastDelivery.status, // ← ESTADO DE LA ÚLTIMA VERSIÓN
          canUpload: uploadPermission.canUpload,
          reason: uploadPermission.reason,
          message: message,
          deliveries: deliveries // Todas las entregas ordenadas
        };
      }
    }
    
    return milestoneStatus;
  } catch (error) {
    console.error('Error obteniendo estado de hitos:', error);
    throw error;
  }
};

// Determinar qué hito puede recibir entregas (lógica secuencial)
export const getNextAvailableMilestone = async (projectId, milestones) => {
  try {
    // Para cada hito en orden
    for (let i = 0; i < milestones.length; i++) {
      const milestoneName = milestones[i].name;
      const deliveries = await getDeliveriesByMilestone(projectId, milestoneName);
      
      // Si no hay entregas, este es el hito disponible
      if (deliveries.length === 0) {
        return milestoneName;
      }
      
      // Si hay entregas, revisar la última
      const lastDelivery = deliveries[deliveries.length - 1];
      
      // Si está pendiente, no se puede avanzar
      if (lastDelivery.status === 'pending') {
        return null; // Ningún hito disponible
      }
      
      // Si fue rechazada, este mismo hito sigue disponible
      if (lastDelivery.status === 'rejected') {
        return milestoneName;
      }
      
      // Si fue aprobada, continuar al siguiente hito
      if (lastDelivery.status === 'approved') {
        continue;
      }
    }
    
    // Todos los hitos completados
    return null;
  } catch (error) {
    console.error('Error determinando hito disponible:', error);
    return null;
  }
};