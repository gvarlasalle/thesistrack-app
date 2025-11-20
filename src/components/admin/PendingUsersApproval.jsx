import { useState, useEffect } from 'react';
import { getPendingUsers, approveUser, rejectUser } from '../../services/userService';

export const PendingUsersApproval = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const users = await getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error('Error cargando usuarios pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('¿Aprobar esta cuenta de asesor?')) return;
    
    setProcessingUserId(userId);
    try {
      await approveUser(userId);
      await loadPendingUsers();
      alert('Usuario aprobado exitosamente');
    } catch (error) {
      alert('Error al aprobar usuario: ' + error.message);
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('¿Rechazar esta solicitud? El usuario no podrá acceder al sistema.')) return;
    
    setProcessingUserId(userId);
    try {
      await rejectUser(userId);
      await loadPendingUsers();
      alert('Usuario rechazado');
    } catch (error) {
      alert('Error al rechazar usuario: ' + error.message);
    } finally {
      setProcessingUserId(null);
    }
  };

  const containerStyle = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '24px',
    marginTop: '24px'
  };

  const alertStyle = {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    border: '2px solid #fbbf24',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const cardStyle = {
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  };

  const approveButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
  };

  const rejectButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{textAlign: 'center', color: '#6b7280'}}>Cargando solicitudes pendientes...</p>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <div style={containerStyle}>
        <h2 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>
          Solicitudes Pendientes de Aprobación
        </h2>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280'
        }}>
          <svg style={{width: '64px', height: '64px', margin: '0 auto 16px', color: '#d1d5db'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p style={{fontSize: '16px', fontWeight: '500'}}>No hay solicitudes pendientes</p>
          <p style={{fontSize: '14px', marginTop: '8px'}}>Todas las cuentas están aprobadas o rechazadas</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px'}}>
        Solicitudes Pendientes de Aprobación ({pendingUsers.length})
      </h2>

      <div style={alertStyle}>
        <svg style={{width: '24px', height: '24px', color: '#f59e0b', flexShrink: 0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p style={{fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '4px'}}>
            Revisar solicitudes de asesor
          </p>
          <p style={{fontSize: '13px', color: '#78350f'}}>
            Estas cuentas no pueden acceder al sistema hasta que sean aprobadas
          </p>
        </div>
      </div>

      {pendingUsers.map((user) => (
        <div key={user.uid} style={cardStyle}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px'}}>
            <div>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '2px'}}>
                    {user.name}
                  </h3>
                  <p style={{fontSize: '14px', color: '#6b7280'}}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '600',
              background: '#dbeafe',
              color: '#1e40af'
            }}>
              Asesor
            </span>
          </div>

          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            <p><strong>Fecha de solicitud:</strong> {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleString('es-PE') : 'N/A'}</p>
          </div>

          <div style={{display: 'flex', gap: '12px'}}>
            <button
              onClick={() => handleApprove(user.uid)}
              disabled={processingUserId === user.uid}
              style={{
                ...approveButtonStyle,
                flex: 1,
                opacity: processingUserId === user.uid ? 0.6 : 1,
                cursor: processingUserId === user.uid ? 'not-allowed' : 'pointer'
              }}
            >
              {processingUserId === user.uid ? 'Procesando...' : '✓ Aprobar'}
            </button>
            <button
              onClick={() => handleReject(user.uid)}
              disabled={processingUserId === user.uid}
              style={{
                ...rejectButtonStyle,
                flex: 1,
                opacity: processingUserId === user.uid ? 0.6 : 1,
                cursor: processingUserId === user.uid ? 'not-allowed' : 'pointer'
              }}
            >
              {processingUserId === user.uid ? 'Procesando...' : '✗ Rechazar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};