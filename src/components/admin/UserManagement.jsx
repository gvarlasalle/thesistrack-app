import { useState, useEffect } from 'react';
import { getAllUsers, deleteUser, getAllAdmins } from '../../services/userService';
import { CreateUserForm } from './CreateUserForm';
import { EditUserForm } from './EditUserForm';
import { toggleUserStatus } from '../../services/userService';
import { ConfirmModal } from '../common/ConfirmModal';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      
      console.log('Usuarios cargados:', usersData);
      
      // NO filtrar por approved - mostrar TODOS los usuarios
      setUsers(usersData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'desactivar';
    const actionPast = newStatus ? 'activado' : 'desactivado';

    // Abrir modal de confirmación
    setConfirmModal({
      isOpen: true,
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} usuario?`,
      message: `¿Estás seguro de ${action} este usuario? ${
        !newStatus 
          ? 'Si es estudiante con proyecto asignado o asesor con proyectos, estos se verán afectados.' 
          : 'El usuario podrá acceder al sistema nuevamente.'
      }`,
      type: newStatus ? 'success' : 'warning',
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      onConfirm: async () => {
        try {
          setDeletingUserId(userId);
          await toggleUserStatus(userId, newStatus);
          await loadUsers();
          
          // Mostrar mensaje de éxito
          setConfirmModal({
            isOpen: true,
            title: '¡Éxito!',
            message: `Usuario ${actionPast} exitosamente`,
            type: 'success',
            confirmText: 'Entendido',
            onConfirm: () => {
              setConfirmModal({ ...confirmModal, isOpen: false });
              if (onRefresh) onRefresh();
            }
          });
        } catch (error) {
          console.error(`Error ${action}ndo usuario:`, error);
          
          // Mostrar mensaje de error
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: error.message || `Error al ${action} el usuario`,
            type: 'danger',
            confirmText: 'Entendido',
            onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false })
          });
        } finally {
          setDeletingUserId(null);
        }
      }
    });
  };

  const handleDeleteUser = async (userId) => {
    // Verificar que no sea el último admin
    try {
      const admins = await getAllAdmins();
      const userToDelete = users.find(u => u.uid === userId || u.id === userId);
      
      if (userToDelete?.role === 'admin' && admins.length === 1) {
        alert('No se puede eliminar el último administrador del sistema');
        return;
      }

      if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
        return;
      }

      setDeletingUserId(userId);
      await deleteUser(userId);
      await loadUsers();
      alert('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error al eliminar el usuario: ' + error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadUsers();
  };

  const handleEditSuccess = () => {
    setEditingUser(null);
    loadUsers();
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { bg: '#fef3c7', color: '#92400e', label: 'Administrador' },
      advisor: { bg: '#dbeafe', color: '#1e40af', label: 'Asesor' },
      student: { bg: '#d1fae5', color: '#065f46', label: 'Estudiante' }
    };
    const style = config[role] || config.student;
    
    return (
      <span style={{
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '40px',
        textAlign: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #8b5cf6',
          borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{color: '#6b7280'}}>Cargando usuarios...</p>
      </div>
    );
  }

  // Modal de creación
  if (showCreateForm) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'auto'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <CreateUserForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      </div>
    );
  }

  // Modal de edición
  if (editingUser) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'auto'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <EditUserForm
            user={editingUser}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingUser(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '28px',
      marginBottom: '32px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{fontSize: '22px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0'}}>
            Gestión de Usuarios
          </h2>
          <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
            Administra las cuentas de usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear Usuario
        </button>
      </div>

      {users.length === 0 ? (
        <div style={{textAlign: 'center', padding: '60px 20px'}}>
          <svg style={{width: '80px', height: '80px', margin: '0 auto 20px', color: '#d1d5db'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p style={{fontSize: '18px', color: '#6b7280', fontWeight: '500'}}>No hay usuarios registrados</p>
        </div>
      ) : (
        <div style={{display: 'grid', gap: '12px'}}>
          {users.map((user) => {
            const userId = user.uid || user.id;
            
            return (
              <div
                key={userId}
                style={{
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.3s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                    <h3 style={{fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0}}>
                      {user.name}
                    </h3>
                    {getRoleBadge(user.role)}
                    
                    {/* Badge de estado */}
                    {user.isActive === false && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#fee2e2',
                        color: '#991b1b'
                      }}>
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                    {user.email}
                  </p>
                </div>

                <div style={{display: 'flex', gap: '8px'}}>
                  <button
                    onClick={() => setEditingUser(user)}
                    disabled={deletingUserId === userId}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: deletingUserId === userId ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseOver={(e) => deletingUserId !== userId && (e.target.style.transform = 'translateY(-2px)')}
                    onMouseOut={(e) => deletingUserId !== userId && (e.target.style.transform = 'translateY(0)')}
                  >
                    <svg style={{width: '14px', height: '14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>

                    <button
                      onClick={() => handleToggleStatus(userId, user.isActive !== false)}
                      disabled={deletingUserId === userId}
                      style={{
                        padding: '8px 16px',
                        background: deletingUserId === userId 
                          ? '#d1d5db' 
                          : user.isActive !== false 
                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'  // Naranja para desactivar
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Verde para activar
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: deletingUserId === userId ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => deletingUserId !== userId && (e.target.style.transform = 'translateY(-2px)')}
                      onMouseOut={(e) => deletingUserId !== userId && (e.target.style.transform = 'translateY(0)')}
                    >
                      {deletingUserId === userId ? (
                        <>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #ffffff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                          }}></div>
                          Procesando...
                        </>
                      ) : user.isActive !== false ? (
                        <>
                          <svg style={{width: '14px', height: '14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Desactivar
                        </>
                      ) : (
                        <>
                          <svg style={{width: '14px', height: '14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Activar
                        </>
                      )}
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText="Cancelar"
      />

    </div>
  );
};