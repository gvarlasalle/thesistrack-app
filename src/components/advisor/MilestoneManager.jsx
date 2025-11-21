import { useState } from 'react';
import { updateProject } from '../../services/projectService';
import { getDeliveriesByMilestone, approveDelivery, rejectDelivery } from '../../services/deliveryService';
import { useEffect } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';

export const MilestoneManager = ({ project, onUpdate }) => {
  const [milestones, setMilestones] = useState(project.milestones || []);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [milestoneDeliveries, setMilestoneDeliveries] = useState({});
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [reviewingDelivery, setReviewingDelivery] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  useEffect(() => {
    loadMilestoneDeliveries();
  }, [project.id, milestones]);

  const loadMilestoneDeliveries = async () => {
    const deliveriesMap = {};
    for (const milestone of milestones) {
      const deliveries = await getDeliveriesByMilestone(project.id, milestone.name);
      deliveriesMap[milestone.name] = deliveries;
    }
    setMilestoneDeliveries(deliveriesMap);
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneName.trim()) return;

    const newMilestone = {
      name: newMilestoneName.trim(),
      completed: false,
      dueDate: null
    };

    const updatedMilestones = [...milestones, newMilestone];
    
    try {
      await updateProject(project.id, { milestones: updatedMilestones });
      setMilestones(updatedMilestones);
      setNewMilestoneName('');
      setIsAddingMilestone(false);
      onUpdate();
    } catch (error) {
      console.error('Error agregando hito:', error);
      alert('Error al agregar hito');
    }
  };

  const handleEditMilestone = async (index) => {
    const milestone = milestones[index];
    if (!editingMilestone || editingMilestone.trim() === milestone.name) {
      setEditingMilestone(null);
      return;
    }

    const updatedMilestones = [...milestones];
    updatedMilestones[index] = { ...milestone, name: editingMilestone.trim() };

    try {
      await updateProject(project.id, { milestones: updatedMilestones });
      setMilestones(updatedMilestones);
      setEditingMilestone(null);
      onUpdate();
    } catch (error) {
      console.error('Error editando hito:', error);
      alert('Error al editar hito');
    }
  };

  const handleDeleteMilestone = async (index) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar hito?',
      message: `Se eliminará el hito "${milestones[index].name}". Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Sí, eliminar',
      onConfirm: async () => {
        const updatedMilestones = milestones.filter((_, i) => i !== index);
        try {
          await updateProject(project.id, { milestones: updatedMilestones });
          setMilestones(updatedMilestones);
          setConfirmModal({ ...confirmModal, isOpen: false });
          onUpdate();
        } catch (error) {
          console.error('Error eliminando hito:', error);
          alert('Error al eliminar hito');
        }
      }
    });
  };

  const handleToggleComplete = async (index) => {
    const milestone = milestones[index];
    const action = milestone.completed ? 'desmarcar' : 'marcar';
    
    setConfirmModal({
      isOpen: true,
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} hito como completado?`,
      message: `El hito "${milestone.name}" será ${action}ado como completado.`,
      type: milestone.completed ? 'warning' : 'success',
      confirmText: 'Confirmar',
      onConfirm: async () => {
        const updatedMilestones = [...milestones];
        updatedMilestones[index] = {
          ...milestone,
          completed: !milestone.completed,
          completedAt: !milestone.completed ? new Date() : null
        };

        try {
          await updateProject(project.id, { milestones: updatedMilestones });
          setMilestones(updatedMilestones);
          setConfirmModal({ ...confirmModal, isOpen: false });
          onUpdate();
        } catch (error) {
          console.error('Error actualizando hito:', error);
          alert('Error al actualizar hito');
        }
      }
    });
  };

  const toggleMilestoneExpand = (milestoneName) => {
    setExpandedMilestone(expandedMilestone === milestoneName ? null : milestoneName);
  };

  const handleApproveDelivery = async (deliveryId) => {
    try {
      await approveDelivery(deliveryId, approvalComment);
      setReviewingDelivery(null);
      setApprovalComment('');
      await loadMilestoneDeliveries();
      onUpdate();
    } catch (error) {
      console.error('Error aprobando entrega:', error);
      alert('Error al aprobar entrega');
    }
  };

  const handleRejectDelivery = async (deliveryId) => {
    if (!rejectionComment.trim()) {
      alert('Debe proporcionar comentarios al rechazar');
      return;
    }

    try {
      await rejectDelivery(deliveryId, rejectionComment);
      setReviewingDelivery(null);
      setRejectionComment('');
      await loadMilestoneDeliveries();
      onUpdate();
    } catch (error) {
      console.error('Error rechazando entrega:', error);
      alert('Error al rechazar entrega');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { bg: '#fef3c7', color: '#92400e', text: 'Pendiente' },
      'approved': { bg: '#d1fae5', color: '#065f46', text: 'Aprobado' },
      'rejected': { bg: '#fee2e2', color: '#991b1b', text: 'Rechazado' }
    };
    const badge = badges[status] || badges['pending'];
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: badge.bg,
        color: badge.color
      }}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header con progreso */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        color: 'white'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
          Progreso de Hitos
        </h3>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '20px',
          height: '32px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div style={{
            background: 'white',
            height: '100%',
            width: `${(milestones.filter(m => m.completed).length / milestones.length) * 100}%`,
            transition: 'width 0.3s ease',
            borderRadius: '20px'
          }}></div>
        </div>
        <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
          {milestones.filter(m => m.completed).length} de {milestones.length} hitos completados
        </p>
      </div>

      {/* Lista de hitos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {milestones.map((milestone, index) => {
          const deliveries = milestoneDeliveries[milestone.name] || [];
          const isExpanded = expandedMilestone === milestone.name;
          const hasDeliveries = deliveries.length > 0;

          return (
            <div key={index} style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: milestone.completed ? '2px solid #10b981' : '2px solid #e5e7eb'
            }}>
              {/* Header del hito */}
              <div style={{
                background: milestone.completed 
                  ? 'linear-gradient(to right, #d1fae5, #a7f3d0)' 
                  : 'linear-gradient(to right, #f9fafb, white)',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div
                    onClick={() => handleToggleComplete(index)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: milestone.completed 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'white',
                      border: milestone.completed ? 'none' : '3px solid #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'not-allowed',
                      transition: 'all 0.2s',
                      boxShadow: milestone.completed ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                  >
                    {milestone.completed && (
                      <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: milestone.completed ? '#065f46' : '#1f2937',
                      margin: '0 0 4px 0',
                      textDecoration: milestone.completed ? 'line-through' : 'none'
                    }}>
                      {milestone.name}
                    </h4>
                    {milestone.completed && milestone.completedAt && (
                      <p style={{ fontSize: '12px', color: '#059669', margin: 0 }}>
                        Completado el {formatDate(milestone.completedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {hasDeliveries && (
                    <span style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {deliveries.length} entrega{deliveries.length !== 1 ? 's' : ''}
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingMilestone(milestone.name);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#6b7280'
                    }}
                  >
                    ✏️ Editar
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMilestone(index);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'white',
                      border: '2px solid #fee2e2',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#dc2626'
                    }}
                  >
                    🗑️
                  </button>

                  {hasDeliveries && (
                    <button
                      onClick={() => toggleMilestoneExpand(milestone.name)}
                      style={{
                        padding: '8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      <svg 
                        style={{
                          width: '24px',
                          height: '24px',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s'
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Formulario de edición */}
              {editingMilestone === milestone.name && (
                <div style={{
                  padding: '20px',
                  background: '#eff6ff',
                  borderTop: '2px solid #bfdbfe'
                }}>
                  <input
                    type="text"
                    value={editingMilestone}
                    onChange={(e) => setEditingMilestone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginBottom: '12px'
                    }}
                    placeholder="Nombre del hito"
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingMilestone(null)}
                      style={{
                        padding: '8px 16px',
                        background: 'white',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleEditMilestone(index)}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de entregas expandible */}
              {isExpanded && hasDeliveries && (
                <div style={{
                  padding: '20px',
                  background: '#f9fafb',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <h5 style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📄</span>
                    Entregas ({deliveries.length})
                  </h5>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {deliveries.map((delivery) => (
                      <div key={delivery.id} style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '2px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#2563eb',
                                background: '#dbeafe',
                                padding: '4px 12px',
                                borderRadius: '12px'
                              }}>
                                Versión {delivery.version}
                              </span>
                              {getStatusBadge(delivery.status)}
                              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                                Por: {delivery.studentName || 'Desconocido'}
                              </span>
                            </div>

                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '12px',
                              fontSize: '14px'
                            }}>
                              <div>
                                <span style={{ color: '#6b7280' }}>Archivo:</span>
                                <p style={{ color: '#1f2937', fontWeight: '600', margin: '2px 0 0 0' }}>
                                  {delivery.fileName}
                                </p>
                              </div>
                              <div>
                                <span style={{ color: '#6b7280' }}>Tamaño:</span>
                                <p style={{ color: '#1f2937', margin: '2px 0 0 0' }}>
                                  {formatFileSize(delivery.fileSize)}
                                </p>
                              </div>
                              <div>
                                <span style={{ color: '#6b7280' }}>Subido:</span>
                                <p style={{ color: '#1f2937', margin: '2px 0 0 0' }}>
                                  {formatDate(delivery.uploadedAt)}
                                </p>
                              </div>
                              {delivery.reviewedAt && (
                                <div>
                                  <span style={{ color: '#6b7280' }}>Revisado:</span>
                                  <p style={{ color: '#1f2937', margin: '2px 0 0 0' }}>
                                    {formatDate(delivery.reviewedAt)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {delivery.description && (
                              <div style={{
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px solid #e5e7eb'
                              }}>
                                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                                  Descripción:
                                </span>
                                <p style={{ fontSize: '14px', color: '#374151', margin: '4px 0 0 0' }}>
                                  {delivery.description}
                                </p>
                              </div>
                            )}

                            {delivery.advisorComments && (
                              <div style={{
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px solid #e5e7eb'
                              }}>
                                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                                  Comentarios del asesor:
                                </span>
                                <p style={{
                                  fontSize: '14px',
                                  color: '#374151',
                                  margin: '8px 0 0 0',
                                  background: '#fef3c7',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  borderLeft: '4px solid #fbbf24'
                                }}>
                                  {delivery.advisorComments}
                                </p>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                            <a
                              href={delivery.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              👁️ Ver PDF
                            </a>

                            {delivery.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setReviewingDelivery(delivery.id)}
                                  style={{
                                    padding: '8px 16px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  ✅ Aprobar
                                </button>
                                <button
                                  onClick={() => setReviewingDelivery(delivery.id)}
                                  style={{
                                    padding: '8px 16px',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  ❌ Rechazar
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Formulario de revisión */}
                        {reviewingDelivery === delivery.id && (
                          <div style={{
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '2px solid #e5e7eb'
                          }}>
                            <h6 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                              Revisar entrega
                            </h6>
                            <textarea
                              placeholder="Comentarios (opcional para aprobar, requerido para rechazar)"
                              value={delivery.status === 'pending' ? (approvalComment || rejectionComment) : ''}
                              onChange={(e) => {
                                setApprovalComment(e.target.value);
                                setRejectionComment(e.target.value);
                              }}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                resize: 'vertical',
                                minHeight: '80px',
                                fontFamily: 'inherit',
                                marginBottom: '12px'
                              }}
                            />
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setReviewingDelivery(null);
                                  setApprovalComment('');
                                  setRejectionComment('');
                                }}
                                style={{
                                  padding: '8px 16px',
                                  background: '#e5e7eb',
                                  color: '#374151',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleApproveDelivery(delivery.id)}
                                style={{
                                  padding: '8px 16px',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                ✅ Aprobar
                              </button>
                              <button
                                onClick={() => handleRejectDelivery(delivery.id)}
                                style={{
                                  padding: '8px 16px',
                                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                ❌ Rechazar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón agregar hito */}
      {!isAddingMilestone && (
        <button
          onClick={() => setIsAddingMilestone(true)}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '16px',
            background: 'white',
            border: '2px dashed #d1d5db',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            color: '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          + Agregar Hito
        </button>
      )}

      {/* Formulario nuevo hito */}
      {isAddingMilestone && (
        <div style={{
          marginTop: '16px',
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #3b82f6'
        }}>
          <input
            type="text"
            value={newMilestoneName}
            onChange={(e) => setNewMilestoneName(e.target.value)}
            placeholder="Nombre del nuevo hito"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '12px'
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setIsAddingMilestone(false);
                setNewMilestoneName('');
              }}
              style={{
                padding: '10px 20px',
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAddMilestone}
              disabled={!newMilestoneName.trim()}
              style={{
                padding: '10px 20px',
                background: newMilestoneName.trim() 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: newMilestoneName.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Agregar
            </button>
          </div>
        </div>
      )}

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