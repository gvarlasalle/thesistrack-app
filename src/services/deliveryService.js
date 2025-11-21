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

export const approveDelivery = async (deliveryId, comments = '') => {
  try {
    const deliveryRef = doc(db, 'deliveries', deliveryId);
    
    await updateDoc(deliveryRef, {
      status: 'approved',
      advisorComments: comments,
      reviewedAt: Timestamp.now()
    });

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