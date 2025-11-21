import { useState } from 'react';
import { updateProject } from '../../services/projectService';
import { ConfirmModal } from '../common/ConfirmModal';

export const MilestoneManager = ({ project, onUpdate }) => {
  const [milestones, setMilestones] = useState(project.milestones || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  const handleToggleComplete = async (index) => {
    const milestone = milestones[index];
    const newStatus = !milestone.completed;

    setConfirmModal({
      isOpen: true,
      title: newStatus ? '¿Marcar hito como completado?' : '¿Marcar hito como pendiente?',
      message: newStatus 
        ? `El hito "${milestone.name}" será marcado como completado.`
        : `El hito "${milestone.name}" será marcado como pendiente.`,
      type: newStatus ? 'success' : 'warning',
      confirmText: 'Confirmar',
      onConfirm: async () => {
        try {
          const updatedMilestones = [...milestones];
          updatedMilestones[index] = { ...milestone, completed: newStatus };
          
          await updateProject(project.id, { milestones: updatedMilestones });
          setMilestones(updatedMilestones);
          
          setConfirmModal({
            isOpen: true,
            title: '¡Actualizado!',
            message: `Hito ${newStatus ? 'completado' : 'marcado como pendiente'} exitosamente`,
            type: 'success',
            confirmText: 'Entendido',
            onConfirm: () => {
              setConfirmModal({ ...confirmModal, isOpen: false });
              onUpdate();
            }
          });
        } catch (error) {
          console.error('Error actualizando hito:', error);
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: 'No se pudo actualizar el hito',
            type: 'danger',
            confirmText: 'Entendido',
            onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false })
          });
        }
      }
    });
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditingName(milestones[index].name);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) {
      alert('El nombre del hito no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      const updatedMilestones = [...milestones];
      updatedMilestones[editingIndex] = {
        ...updatedMilestones[editingIndex],
        name: editingName.trim()
      };
      
      await updateProject(project.id, { milestones: updatedMilestones });
      setMilestones(updatedMilestones);
      setEditingIndex(null);
      setEditingName('');
      onUpdate();
    } catch (error) {
      console.error('Error actualizando hito:', error);
      alert('Error al actualizar el hito');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  const handleDeleteMilestone = (index) => {
    const milestone = milestones[index];
    
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar hito?',
      message: `¿Estás seguro de eliminar el hito "${milestone.name}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Sí, eliminar',
      onConfirm: async () => {
        try {
          const updatedMilestones = milestones.filter((_, i) => i !== index);
          await updateProject(project.id, { milestones: updatedMilestones });
          setMilestones(updatedMilestones);
          
          setConfirmModal({
            isOpen: true,
            title: '¡Eliminado!',
            message: 'Hito eliminado exitosamente',
            type: 'success',
            confirmText: 'Entendido',
            onConfirm: () => {
              setConfirmModal({ ...confirmModal, isOpen: false });
              onUpdate();
            }
          });
        } catch (error) {
          console.error('Error eliminando hito:', error);
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: 'No se pudo eliminar el hito',
            type: 'danger',
            confirmText: 'Entendido',
            onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false })
          });
        }
      }
    });
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneName.trim()) {
      alert('El nombre del hito no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      const updatedMilestones = [
        ...milestones,
        { name: newMilestoneName.trim(), completed: false }
      ];
      
      await updateProject(project.id, { milestones: updatedMilestones });
      setMilestones(updatedMilestones);
      setNewMilestoneName('');
      setShowAddForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error agregando hito:', error);
      alert('Error al agregar el hito');
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const progress = getProgress();

  return (
    <div>
      {/* Resumen de Progreso */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        borderRadius: '12px',
        color: 'white',
        marginBottom: '24px'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
          <h3 style={{fontSize: '18px', fontWeight: '600', margin: 0}}>Progreso de Hitos</h3>
          <span style={{fontSize: '24px', fontWeight: 'bold'}}>{progress}%</span>
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
            transition: 'width 0.3s'
          }}></div>
        </div>
        <p style={{fontSize: '14px', marginTop: '8px', opacity: 0.9}}>
          {milestones.filter(m => m.completed).length} de {milestones.length} hitos completados
        </p>
      </div>

      {/* Lista de Hitos */}
      <div style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0}}>
            Hitos del Proyecto
          </h3>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Hito
            </button>
          )}
        </div>

        {/* Formulario para agregar hito */}
        {showAddForm && (
          <div style={{
            padding: '16px',
            background: '#f0fdf4',
            border: '2px solid #10b981',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#065f46',
              marginBottom: '8px'
            }}>
              Nombre del Nuevo Hito
            </label>
            <input
              type="text"
              value={newMilestoneName}
              onChange={(e) => setNewMilestoneName(e.target.value)}
              placeholder="Ej: Capítulo 4, Revisión Final, etc."
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #10b981',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newMilestoneName.trim()) {
                  handleAddMilestone();
                }
              }}
            />
            <div style={{display: 'flex', gap: '8px'}}>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewMilestoneName('');
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'white',
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddMilestone}
                disabled={loading || !newMilestoneName.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: newMilestoneName.trim() && !loading
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newMilestoneName.trim() && !loading ? 'pointer' : 'not-allowed'
                }}
              >
                {loading ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        )}

        {/* Hitos */}
        {milestones.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #e5e7eb'
          }}>
            <svg style={{width: '64px', height: '64px', margin: '0 auto 16px', color: '#d1d5db'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p style={{color: '#6b7280', fontSize: '15px'}}>No hay hitos definidos para este proyecto</p>
            <p style={{color: '#9ca3af', fontSize: '13px', marginTop: '4px'}}>Agrega hitos para organizar el progreso del proyecto</p>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {milestones.map((milestone, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  background: milestone.completed ? '#f0fdf4' : '#f9fafb',
                  border: `2px solid ${milestone.completed ? '#86efac' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(index)}
                    disabled={loading}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: milestone.completed ? '#10b981' : '#e5e7eb',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.1)')}
                    onMouseOut={(e) => !loading && (e.target.style.transform = 'scale(1)')}
                  >
                    {milestone.completed && (
                      <svg style={{width: '18px', height: '18px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Nombre */}
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '500'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                  ) : (
                    <p style={{
                      flex: 1,
                      fontSize: '15px',
                      fontWeight: '500',
                      color: milestone.completed ? '#059669' : '#374151',
                      textDecoration: milestone.completed ? 'line-through' : 'none',
                      margin: 0
                    }}>
                      {milestone.name}
                    </p>
                  )}

                  {/* Acciones */}
                  <div style={{display: 'flex', gap: '8px'}}>
                    {editingIndex === index ? (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            background: 'white',
                            color: '#6b7280',
                            border: '2px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={loading || !editingName.trim()}
                          style={{
                            padding: '6px 12px',
                            background: editingName.trim() && !loading ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: editingName.trim() && !loading ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Guardar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(index)}
                          disabled={loading}
                          style={{
                            padding: '6px',
                            background: 'white',
                            border: '2px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Editar"
                        >
                          <svg style={{width: '16px', height: '16px', color: '#6b7280'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(index)}
                          disabled={loading}
                          style={{
                            padding: '6px',
                            background: 'white',
                            border: '2px solid #fee2e2',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Eliminar"
                        >
                          <svg style={{width: '16px', height: '16px', color: '#ef4444'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
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