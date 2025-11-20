import { 
  collection, 
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Servicio de Mensajería Interna
 * Maneja chat en tiempo real entre estudiantes y asesores
 */

// Enviar mensaje
export const sendMessage = async (projectId, messageData) => {
  try {
    const { senderId, senderName, senderRole, message } = messageData;

    // Validaciones
    if (!message || message.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    if (message.length > 1000) {
      throw new Error('El mensaje no puede exceder 1000 caracteres');
    }

    // Crear mensaje
    const newMessage = {
      projectId,
      senderId,
      senderName,
      senderRole,
      message: message.trim(),
      readBy: [senderId], // El remitente ya lo "leyó"
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'messages'), newMessage);

    return {
      id: docRef.id,
      ...newMessage
    };
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    throw new Error(error.message || 'Error al enviar mensaje');
  }
};

// Obtener mensajes de un proyecto
export const getMessagesByProject = async (projectId) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('projectId', '==', projectId)
    );

    const querySnapshot = await getDocs(q);
    
    let messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por fecha (más antiguos primero)
    messages.sort((a, b) => {
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      return dateA - dateB;
    });

    return messages;
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    throw new Error('Error al obtener mensajes');
  }
};

// Suscribirse a mensajes en tiempo real
export const subscribeToMessages = (projectId, callback) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('projectId', '==', projectId)
    );

    // Retorna la función unsubscribe
    return onSnapshot(q, (snapshot) => {
      let messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por fecha
      messages.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateA - dateB;
      });

      callback(messages);
    }, (error) => {
      console.error('Error en suscripción de mensajes:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Error suscribiéndose a mensajes:', error);
    return () => {}; // Retorna función vacía si falla
  }
};

// Marcar mensaje como leído
export const markAsRead = async (messageId, userId) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    
    await updateDoc(messageRef, {
      readBy: arrayUnion(userId)
    });

    return { success: true };
  } catch (error) {
    console.error('Error marcando mensaje como leído:', error);
    throw new Error('Error al marcar mensaje como leído');
  }
};

// Marcar todos los mensajes como leídos
export const markAllAsRead = async (projectId, userId) => {
  try {
    const messages = await getMessagesByProject(projectId);
    
    const updatePromises = messages
      .filter(msg => !msg.readBy?.includes(userId))
      .map(msg => markAsRead(msg.id, userId));

    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    console.error('Error marcando todos como leídos:', error);
    throw new Error('Error al marcar mensajes como leídos');
  }
};

// Obtener cantidad de mensajes no leídos
export const getUnreadCount = async (projectId, userId) => {
  try {
    const messages = await getMessagesByProject(projectId);
    
    const unreadCount = messages.filter(msg => 
      !msg.readBy?.includes(userId) && msg.senderId !== userId
    ).length;

    return unreadCount;
  } catch (error) {
    console.error('Error obteniendo mensajes no leídos:', error);
    return 0;
  }
};

// Eliminar mensaje (solo admin)
export const deleteMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, 'messages', messageId));
    return { success: true };
  } catch (error) {
    console.error('Error eliminando mensaje:', error);
    throw new Error('Error al eliminar mensaje');
  }
};

// Obtener último mensaje de un proyecto
export const getLastMessage = async (projectId) => {
  try {
    const messages = await getMessagesByProject(projectId);
    
    if (messages.length === 0) {
      return null;
    }

    return messages[messages.length - 1];
  } catch (error) {
    console.error('Error obteniendo último mensaje:', error);
    return null;
  }
};