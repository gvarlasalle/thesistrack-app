import { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/userService';
import { getProjectDeliveries } from '../../services/deliveryService';
import { updateProject } from '../../services/projectService';
import { MilestoneManager } from './MilestoneManager';
import { DeliveryHistory } from './DeliveryHistory';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProjectDetailModal = ({ project, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [students, setStudents] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });
  const [rejectionComment, setRejectionComment] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar estudiantes
      const allUsers = await getAllUsers();
      const projectStudents = allUsers.filter(u => 
        project.teamMembers?.includes(u.id || u.uid)
      );
      
      // Cargar entregas
      const projectDeliveries = await getProjectDeliveries(project.id);
      
      setStudents(projectStudents);
      setDeliveries(projectDeliveries);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => {
    if (!project.milestones || project.milestones.length === 0) return 0;
    const completed = project.milestones.filter(m => m.completed).length;
    return Math.round((completed / project.milestones.length) * 100);
  };

  const allMilestonesCompleted = () => {
    return project.milestones && project.milestones.length > 0 &&
           project.milestones.every(m => m.completed);
  };

  const handleCompleteProject = () => {
    setConfirmModal({
      isOpen: true,
      title: '¿Marcar proyecto como completado?',
      message: 'Esta acción marcará el proyecto como completado. Los estudiantes podrán ver su calificación final.',
      type: 'success',
      confirmText: 'Sí, completar',
      onConfirm: async () => {
        try {
          await updateProject(project.id, { status: 'completed' });
          setConfirmModal({
            isOpen: true,
            title: '¡Proyecto completado!',
            message: 'El proyecto ha sido marcado como completado exitosamente',
            type: 'success',
            confirmText: 'Entendido',
            onConfirm: () => {
              setConfirmModal({ ...confirmModal, isOpen: false });
              onUpdate();
              onClose();
            }
          });
        } catch (error) {
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: 'No se pudo completar el proyecto',
            type: 'danger',
            confirmText: 'Entendido',
            onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false })
          });
        }
      }
    });
  };

  const handleRejectProject = () => {
    setShowRejectionForm(true);
  };

  const handleConfirmRejection = () => {
    if (!rejectionComment.trim()) {
      alert('Debes proporcionar un comentario de rechazo');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: '¿Rechazar proyecto?',
      message: 'Esta acción marcará el proyecto como rechazado. Los estudiantes podrán ver el comentario de rechazo.',
      type: 'danger',
      confirmText: 'Sí, rechazar',
      onConfirm: async () => {
        try {
          await updateProject(project.id, { 
            status: 'rejected',
            rejectionComment: rejectionComment.trim()
          });
          setConfirmModal({
            isOpen: true,
            title: 'Proyecto rechazado',
            message: 'El proyecto ha sido rechazado. Los estudiantes han sido notificados.',
            type: 'success',
            confirmText: 'Entendido',
            onConfirm: () => {
              setConfirmModal({ ...confirmModal, isOpen: false });
              setShowRejectionForm(false);
              setRejectionComment('');
              onUpdate();
              onClose();
            }
          });
        } catch (error) {
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: 'No se pudo rechazar el proyecto',
            type: 'danger',
            confirmText: 'Entendido',
            onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false })
          });
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
      in_progress: { bg: '#dbeafe', color: '#1e40af', label: 'En Progreso' },
      completed: { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
      rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rechazado' },
      suspended: { bg: '#f3e8ff', color: '#6b21a8', label: 'Suspendido' }
    };
    return config[status] || config.pending;
  };

  const tabs = [
    { id: 'info', label: 'Información', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'milestones', label: 'Hitos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'deliveries', label: 'Entregas', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
  ];

  const statusStyle = getStatusBadge(project.status);
  const progress = getProgress();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          maxWidth: '1200px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '32px',
          borderBottom: '2px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px'}}>
            <div style={{flex: 1}}>
              <h2 style={{fontSize: '28px', fontWeight: 'bold', margin: '0 0 12px 0'}}>
                {project.title}
              </h2>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'}}>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  {statusStyle.label}
                </span>
                <span style={{fontSize: '14px', opacity: 0.9}}>
                  👥 {students.length} estudiante(s)
                </span>
                <span style={{fontSize: '14px', opacity: 0.9}}>
                  📝 {deliveries.length} entrega(s)
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              <svg style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progreso */}
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <span style={{fontSize: '14px', opacity: 0.9}}>Progreso general</span>
              <span style={{fontSize: '14px', fontWeight: '600'}}>{progress}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '10px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'white',
                transition: 'width 0.3s',
                boxShadow: '0 0 10px rgba(255,255,255,0.5)'
              }}></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          background: '#f9fafb',
          padding: '0 32px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 24px',
                background: activeTab === tab.id ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                color: activeTab === tab.id ? '#667eea' : '#6b7280',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-2px'
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = '#374151';
                  e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = '#6b7280';
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex: 1, overflow: 'auto', padding: '32px'}}>
          {activeTab === 'info' && (
            <div>
              {/* Descripción */}
              <div style={{marginBottom: '32px'}}>
                <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px'}}>
                  Descripción
                </h3>
                <p style={{fontSize: '15px', color: '#6b7280', lineHeight: '1.6'}}>
                  {project.description || 'Sin descripción'}
                </p>
              </div>

              {/* Estudiantes */}
              <div style={{marginBottom: '32px'}}>
                <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px'}}>
                  Estudiantes del Proyecto
                </h3>
                {students.length === 0 ? (
                  <p style={{color: '#9ca3af', fontSize: '14px'}}>No hay estudiantes asignados</p>
                ) : (
                  <div style={{display: 'grid', gap: '12px'}}>
                    {students.map((student) => (
                      <div
                        key={student.id || student.uid}
                        style={{
                          padding: '16px',
                          background: student.isActive === false ? '#fef3c7' : '#f9fafb',
                          border: `2px solid ${student.isActive === false ? '#fbbf24' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
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
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <p style={{fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0}}>
                              {student.name}
                            </p>
                            {student.isActive === false && (
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: '#fee2e2',
                                color: '#991b1b'
                              }}>
                                Inactivo
                              </span>
                            )}
                          </div>
                          <p style={{fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0'}}>
                            {student.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hito Actual */}
              <div>
                <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px'}}>
                  Hito Actual
                </h3>
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <p style={{fontSize: '18px', fontWeight: '600', margin: 0}}>
                    {project.currentMilestone || 'Sin hito definido'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <MilestoneManager
              project={project}
              onUpdate={() => {
                onUpdate();
                loadData();
              }}
            />
          )}

          {activeTab === 'deliveries' && (
            <DeliveryHistory
              deliveries={deliveries}
              students={students}
              onUpdate={loadData}
            />
          )}
        </div>

        {/* Footer con acciones */}
        {project.status === 'in_progress' && !showRejectionForm && (
          <div style={{
            padding: '24px 32px',
            borderTop: '2px solid #e5e7eb',
            background: '#f9fafb',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleRejectProject}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Rechazar Proyecto
            </button>
            <button
              onClick={handleCompleteProject}
              disabled={!allMilestonesCompleted()}
              style={{
                padding: '12px 24px',
                background: allMilestonesCompleted() 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: allMilestonesCompleted() ? 'pointer' : 'not-allowed',
                boxShadow: allMilestonesCompleted() ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => allMilestonesCompleted() && (e.target.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => allMilestonesCompleted() && (e.target.style.transform = 'translateY(0)')}
            >
              Completar Proyecto
            </button>
          </div>
        )}

        {/* Formulario de rechazo */}
        {showRejectionForm && (
          <div style={{
            padding: '24px 32px',
            borderTop: '2px solid #e5e7eb',
            background: '#fef3c7'
          }}>
            <h3 style={{fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '12px'}}>
              Comentario de Rechazo
            </h3>
            <textarea
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              placeholder="Explica por qué se rechaza el proyecto..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #fbbf24',
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}
            />
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => {
                  setShowRejectionForm(false);
                  setRejectionComment('');
                }}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRejection}
                disabled={!rejectionComment.trim()}
                style={{
                  padding: '10px 20px',
                  background: rejectionComment.trim() ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: rejectionComment.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        )}
      </div>

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