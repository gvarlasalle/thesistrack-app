import { DeliveryReview } from './DeliveryReview';

export const DeliveryHistory = ({ deliveries, students, onUpdate }) => {
  const getStudentName = (studentId) => {
    const student = students.find(s => (s.id || s.uid) === studentId);
    return student ? student.name : 'Desconocido';
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
      approved: { bg: '#d1fae5', color: '#065f46', label: 'Aprobado' },
      rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rechazado' }
    };
    return config[status] || config.pending;
  };

  // Agrupar entregas por estado
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
  const approvedDeliveries = deliveries.filter(d => d.status === 'approved');
  const rejectedDeliveries = deliveries.filter(d => d.status === 'rejected');

  // Ordenar por versión descendente (más reciente primero)
  const sortByVersion = (a, b) => (b.version || 0) - (a.version || 0);

  return (
    <div>
      {/* Resumen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Pendientes</p>
          <p style={{fontSize: '36px', fontWeight: 'bold', margin: 0}}>{pendingDeliveries.length}</p>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Aprobadas</p>
          <p style={{fontSize: '36px', fontWeight: 'bold', margin: 0}}>{approvedDeliveries.length}</p>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Rechazadas</p>
          <p style={{fontSize: '36px', fontWeight: 'bold', margin: 0}}>{rejectedDeliveries.length}</p>
        </div>
      </div>

      {/* Entregas Pendientes de Revisión */}
      {pendingDeliveries.length > 0 && (
        <div style={{marginBottom: '32px'}}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#fef3c7',
            borderRadius: '10px',
            border: '2px solid #fbbf24'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg style={{width: '18px', height: '18px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 style={{fontSize: '18px', fontWeight: '600', color: '#92400e', margin: 0}}>
              Pendientes de Revisión ({pendingDeliveries.length})
            </h3>
          </div>
          <div style={{display: 'grid', gap: '16px'}}>
            {pendingDeliveries.sort(sortByVersion).map((delivery) => (
              <DeliveryReview
                key={delivery.id}
                delivery={delivery}
                onReviewed={onUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Entregas Aprobadas */}
      {approvedDeliveries.length > 0 && (
        <div style={{marginBottom: '32px'}}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#d1fae5',
            borderRadius: '10px',
            border: '2px solid #86efac'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg style={{width: '18px', height: '18px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 style={{fontSize: '18px', fontWeight: '600', color: '#065f46', margin: 0}}>
              Aprobadas ({approvedDeliveries.length})
            </h3>
          </div>
          <div style={{display: 'grid', gap: '12px'}}>
            {approvedDeliveries.sort(sortByVersion).map((delivery) => {
              const statusStyle = getStatusBadge(delivery.status);
              return (
                <div
                  key={delivery.id}
                  style={{
                    padding: '16px',
                    background: '#f0fdf4',
                    border: '2px solid #86efac',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                        <h4 style={{fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0}}>
                          Versión {delivery.version || 1}
                        </h4>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: statusStyle.bg,
                          color: statusStyle.color
                        }}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p style={{fontSize: '13px', color: '#6b7280', margin: 0}}>
                        Por: {getStudentName(delivery.studentId)}
                      </p>
                    </div>
                  </div>

                  {delivery.comments && (
                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #d1fae5',
                      marginBottom: '12px'
                    }}>
                      <p style={{fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5'}}>
                        {delivery.comments}
                      </p>
                    </div>
                  )}

                  {delivery.advisorComments && (
                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #d1fae5'
                    }}>
                      <p style={{fontSize: '12px', fontWeight: '600', color: '#059669', margin: '0 0 4px 0'}}>
                        Tu comentario:
                      </p>
                      <p style={{fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5'}}>
                        {delivery.advisorComments}
                      </p>
                    </div>
                  )}

                  {delivery.fileUrl && (
                    <a
                      href={delivery.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        background: 'white',
                        color: '#059669',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: '2px solid #86efac',
                        marginTop: '12px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#f0fdf4';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Ver Archivo
                    </a>
                  )}

                  {delivery.submittedAt && (
                    <p style={{fontSize: '12px', color: '#9ca3af', marginTop: '12px', margin: 0}}>
                      Entregado: {new Date(delivery.submittedAt.toDate()).toLocaleString('es-PE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entregas Rechazadas */}
      {rejectedDeliveries.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#fee2e2',
            borderRadius: '10px',
            border: '2px solid #fca5a5'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg style={{width: '18px', height: '18px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 style={{fontSize: '18px', fontWeight: '600', color: '#991b1b', margin: 0}}>
              Rechazadas ({rejectedDeliveries.length})
            </h3>
          </div>
          <div style={{display: 'grid', gap: '12px'}}>
            {rejectedDeliveries.sort(sortByVersion).map((delivery) => {
              const statusStyle = getStatusBadge(delivery.status);
              return (
                <div
                  key={delivery.id}
                  style={{
                    padding: '16px',
                    background: '#fef2f2',
                    border: '2px solid #fca5a5',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                        <h4 style={{fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0}}>
                          Versión {delivery.version || 1}
                        </h4>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: statusStyle.bg,
                          color: statusStyle.color
                        }}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p style={{fontSize: '13px', color: '#6b7280', margin: 0}}>
                        Por: {getStudentName(delivery.studentId)}
                      </p>
                    </div>
                  </div>

                  {delivery.comments && (
                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5',
                      marginBottom: '12px'
                    }}>
                      <p style={{fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5'}}>
                        {delivery.comments}
                      </p>
                    </div>
                  )}

                  {delivery.advisorComments && (
                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5'
                    }}>
                      <p style={{fontSize: '12px', fontWeight: '600', color: '#dc2626', margin: '0 0 4px 0'}}>
                        Motivo del rechazo:
                      </p>
                      <p style={{fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5'}}>
                        {delivery.advisorComments}
                      </p>
                    </div>
                  )}

                  {delivery.submittedAt && (
                    <p style={{fontSize: '12px', color: '#9ca3af', marginTop: '12px', margin: 0}}>
                      Entregado: {new Date(delivery.submittedAt.toDate()).toLocaleString('es-PE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sin entregas */}
      {deliveries.length === 0 && (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb'
        }}>
          <svg style={{width: '80px', height: '80px', margin: '0 auto 20px', color: '#d1d5db'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 style={{fontSize: '20px', color: '#1f2937', fontWeight: '600', marginBottom: '8px'}}>
            No hay entregas
          </h3>
          <p style={{fontSize: '14px', color: '#6b7280'}}>
            Los estudiantes aún no han subido ninguna entrega para este proyecto
          </p>
        </div>
      )}
    </div>
  );
};