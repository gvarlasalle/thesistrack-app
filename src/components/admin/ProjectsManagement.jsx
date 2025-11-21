import { useState, useEffect } from 'react';
import { getAllProjects, deleteProject } from '../../services/projectService';
import { getAllUsers } from '../../services/userService';
import { EditProjectForm } from './EditProjectForm';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProjectsManagement = ({ onRefresh }) => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedProject, setExpandedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
    });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, usersData] = await Promise.all([
        getAllProjects(),
        getAllUsers()
      ]);
      
      // Normalizar usuarios
      const normalizedUsers = usersData.map(u => ({
        ...u,
        id: u.uid || u.id
      }));
      
      setProjects(projectsData);
      setUsers(normalizedUsers);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

    const handleDeleteProject = async (projectId) => {
    // Abrir modal de confirmación
    setConfirmModal({
        isOpen: true,
        title: '¿Eliminar proyecto?',
        message: '¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer. Los estudiantes y el asesor serán desvinculados.',
        type: 'danger',
        confirmText: 'Sí, eliminar',
        onConfirm: async () => {
        try {
            setDeletingProjectId(projectId);
            setConfirmModal({ ...confirmModal, isOpen: false });
            
            await deleteProject(projectId);
            await loadData();
            
            // Mostrar éxito
            setConfirmModal({
            isOpen: true,
            title: '¡Proyecto eliminado!',
            message: 'El proyecto ha sido eliminado exitosamente',
            type: 'success',
            confirmText: 'Entendido',
            onConfirm: () => {
                setConfirmModal({ ...confirmModal, isOpen: false });
                if (onRefresh) onRefresh();
            }
            });
        } catch (error) {
            console.error('Error eliminando proyecto:', error);
            
            setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: error.message || 'Error al eliminar el proyecto',
            type: 'danger',
            confirmText: 'Entendido',
            onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false })
            });
        } finally {
            setDeletingProjectId(null);
        }
        }
    });
    };

  const handleEditSuccess = () => {
    setEditingProject(null);
    loadData();
    if (onRefresh) onRefresh();
  };

  const tabs = [
    { id: 'all', label: 'Todos', status: null },
    { id: 'pending', label: 'Pendientes', status: 'pending' },
    { id: 'in_progress', label: 'En Progreso', status: 'in_progress' },
    { id: 'completed', label: 'Completados', status: 'completed' },
    { id: 'rejected', label: 'Rechazados', status: 'rejected' },
    { id: 'suspended', label: 'Suspendidos', status: 'suspended' }
  ];

  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(p => p.status === tabs.find(t => t.id === activeTab)?.status);

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

  const getProjectStats = (project) => {
    const totalMilestones = project.milestones?.length || 0;
    const completedMilestones = project.milestones?.filter(m => m.completed).length || 0;
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    return { totalMilestones, completedMilestones, progress };
  };

    const getStudentInfo = (teamMemberIds) => {
    if (!teamMemberIds || teamMemberIds.length === 0) return [];
    
    return teamMemberIds.map(id => {
        const student = users.find(u => u.id === id);
        if (!student) return null;
        
        return {
        name: student.name || 'Desconocido',
        isInactive: student.isActive === false
        };
    }).filter(Boolean);
    };

  const getAdvisorName = (advisorId) => {
    if (!advisorId) return 'Sin asesor';
    const advisor = users.find(u => u.id === advisorId);
    return advisor ? advisor.name : 'Sin asesor';
  };

  const toggleExpand = (projectId) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
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
        <p style={{color: '#6b7280'}}>Cargando proyectos...</p>
      </div>
    );
  }

  // Modal de edición
  if (editingProject) {
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
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <EditProjectForm
            project={editingProject}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingProject(null)}
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
      {/* Header */}
      <div style={{marginBottom: '24px'}}>
        <h2 style={{fontSize: '22px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0'}}>
          Gestión de Proyectos
        </h2>
        <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
          Visualiza, edita y elimina proyectos de tesis
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => {
          const count = tab.id === 'all' 
            ? projects.length 
            : projects.filter(p => p.status === tab.status).length;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setExpandedProject(null);
              }}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #8b5cf6' : '3px solid transparent',
                color: activeTab === tab.id ? '#8b5cf6' : '#6b7280',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => activeTab !== tab.id && (e.target.style.color = '#374151')}
              onMouseOut={(e) => activeTab !== tab.id && (e.target.style.color = '#6b7280')}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div style={{textAlign: 'center', padding: '60px 20px'}}>
          <svg style={{width: '80px', height: '80px', margin: '0 auto 20px', color: '#d1d5db'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p style={{fontSize: '18px', color: '#6b7280', fontWeight: '500'}}>
            {activeTab === 'all' ? 'No hay proyectos creados' : `No hay proyectos ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div style={{display: 'grid', gap: '12px'}}>
          {filteredProjects.map((project) => {
            const isExpanded = expandedProject === project.id;
            const stats = getProjectStats(project);
            const statusStyle = getStatusBadge(project.status);
            const studentInfo = getStudentInfo(project.teamMembers);

            return (
              <div
                key={project.id}
                style={{
                  background: isExpanded ? '#f9fafb' : 'white',
                  border: `2px solid ${isExpanded ? '#8b5cf6' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  transition: 'all 0.3s',
                  overflow: 'hidden'
                }}
              >
                {/* Compact View */}
                <div style={{
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div 
                    onClick={() => toggleExpand(project.id)}
                    style={{flex: 1, cursor: 'pointer'}}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                      <h3 style={{fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0}}>
                        {project.title}
                      </h3>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <div style={{display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280'}}>
                      <span>{project.teamMembers?.length || 0} estudiante(s)</span>
                      <span>•</span>
                      <span>Progreso: {stats.progress}%</span>
                      <span>•</span>
                      <span>{project.currentMilestone}</span>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div style={{display: 'flex', gap: '8px', flexShrink: 0}}>
                    <button
                      onClick={() => setEditingProject(project)}
                      disabled={deletingProjectId === project.id}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: deletingProjectId === project.id ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => deletingProjectId !== project.id && (e.target.style.transform = 'translateY(-2px)')}
                      onMouseOut={(e) => deletingProjectId !== project.id && (e.target.style.transform = 'translateY(0)')}
                    >
                      <svg style={{width: '14px', height: '14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={deletingProjectId === project.id}
                      style={{
                        padding: '8px 16px',
                        background: deletingProjectId === project.id ? '#d1d5db' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: deletingProjectId === project.id ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => deletingProjectId !== project.id && (e.target.style.transform = 'translateY(-2px)')}
                      onMouseOut={(e) => deletingProjectId !== project.id && (e.target.style.transform = 'translateY(0)')}
                    >
                      {deletingProjectId === project.id ? (
                        <>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #ffffff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                          }}></div>
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <svg style={{width: '14px', height: '14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => toggleExpand(project.id)}
                      style={{
                        padding: '8px',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                      onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
                    >
                      <svg 
                        style={{
                          width: '18px',
                          height: '18px',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.3s'
                        }} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div style={{
                    padding: '0 20px 20px 20px',
                    borderTop: '1px solid #e5e7eb',
                    background: 'white'
                  }}>
                    <div style={{paddingTop: '20px', display: 'grid', gap: '24px'}}>
                      
                      {/* Descripción */}
                      {project.description && (
                        <div>
                          <h4 style={{fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0'}}>
                            Descripción
                          </h4>
                          <p style={{fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: 0}}>
                            {project.description}
                          </p>
                        </div>
                      )}

                      {/* Grid de información */}
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
                        
                        {/* Asesor */}
                        <div style={{
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          padding: '16px',
                          borderRadius: '10px',
                          border: '2px solid #fbbf24'
                        }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                            <svg style={{width: '20px', height: '20px', color: '#92400e'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <h4 style={{fontSize: '13px', fontWeight: '600', color: '#78350f', margin: 0}}>
                              Asesor
                            </h4>
                          </div>
                          <p style={{fontSize: '14px', color: '#92400e', fontWeight: '500', margin: 0}}>
                            {getAdvisorName(project.advisorId)}
                          </p>
                        </div>

                        {/* Estudiantes */}
                        <div style={{
                        background: '#f9fafb',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        gridColumn: 'span 2'
                        }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                            <svg style={{width: '18px', height: '18px', color: '#8b5cf6'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <h4 style={{fontSize: '13px', fontWeight: '600', color: '#374151', margin: 0}}>
                            Estudiantes ({project.teamMembers?.length || 0})
                            </h4>
                        </div>
                        {(() => {
                            const studentInfo = getStudentInfo(project.teamMembers);
                            return studentInfo.length > 0 ? (
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                                {studentInfo.map((info, idx) => (
                                <div 
                                    key={idx}
                                    style={{
                                    padding: '6px 12px',
                                    background: info.isInactive ? '#fef3c7' : 'white',
                                    border: `1px solid ${info.isInactive ? '#fbbf24' : '#e5e7eb'}`,
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: '#374151',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                    }}
                                >
                                    {info.name}
                                    {info.isInactive && (
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '8px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        background: '#fee2e2',
                                        color: '#991b1b'
                                    }}>
                                        Inactivo
                                    </span>
                                    )}
                                </div>
                                ))}
                            </div>
                            ) : (
                            <p style={{fontSize: '14px', color: '#9ca3af', margin: 0}}>
                                Sin estudiantes asignados
                            </p>
                            );
                        })()}
                        </div>

                        {/* Progreso */}
                        <div style={{
                          background: '#f9fafb',
                          padding: '16px',
                          borderRadius: '10px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                            <svg style={{width: '18px', height: '18px', color: '#10b981'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h4 style={{fontSize: '13px', fontWeight: '600', color: '#374151', margin: 0}}>
                              Progreso
                            </h4>
                          </div>
                          <div style={{marginBottom: '8px'}}>
                            <div style={{
                              width: '100%',
                              height: '8px',
                              background: '#e5e7eb',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${stats.progress}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                transition: 'width 0.3s'
                              }}></div>
                            </div>
                          </div>
                          <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                            {stats.completedMilestones}/{stats.totalMilestones} hitos completados
                          </p>
                        </div>

                        {/* Hito Actual */}
                        <div style={{
                          background: '#f9fafb',
                          padding: '16px',
                          borderRadius: '10px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                            <svg style={{width: '18px', height: '18px', color: '#3b82f6'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h4 style={{fontSize: '13px', fontWeight: '600', color: '#374151', margin: 0}}>
                              Hito Actual
                            </h4>
                          </div>
                          <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                            {project.currentMilestone}
                          </p>
                        </div>
                      </div>

                      {/* Timeline de Hitos */}
                      {project.milestones && project.milestones.length > 0 && (
                        <div>
                          <h4 style={{fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0'}}>
                            Timeline de Hitos
                          </h4>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            {project.milestones.map((milestone, index) => (
                              <div 
                                key={index}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '12px',
                                  background: milestone.completed ? '#f0fdf4' : '#f9fafb',
                                  border: `1px solid ${milestone.completed ? '#86efac' : '#e5e7eb'}`,
                                  borderRadius: '8px'
                                }}
                              >
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: milestone.completed ? '#10b981' : '#d1d5db',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {milestone.completed ? (
                                    <svg style={{width: '14px', height: '14px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <div style={{width: '8px', height: '8px', background: '#9ca3af', borderRadius: '50%'}}></div>
                                  )}
                                </div>
                                <div style={{flex: 1}}>
                                  <p style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: milestone.completed ? '#059669' : '#6b7280',
                                    margin: 0
                                  }}>
                                    {milestone.name}
                                  </p>
                                </div>
                                {milestone.completed && (
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#059669',
                                    fontWeight: '500'
                                  }}>
                                    Completado
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fechas */}
                      <div style={{
                        padding: '16px',
                        background: '#fef3c7',
                        borderRadius: '10px',
                        border: '1px solid #fcd34d'
                      }}>
                        <div style={{display: 'flex', gap: '24px', fontSize: '13px'}}>
                          {project.createdAt && (
                            <div>
                              <span style={{color: '#92400e', fontWeight: '600'}}>Creado: </span>
                              <span style={{color: '#78350f'}}>
                                {new Date(project.createdAt.toDate()).toLocaleDateString('es-PE')}
                              </span>
                            </div>
                          )}
                          {project.updatedAt && (
                            <div>
                              <span style={{color: '#92400e', fontWeight: '600'}}>Última actualización: </span>
                              <span style={{color: '#78350f'}}>
                                {new Date(project.updatedAt.toDate()).toLocaleDateString('es-PE')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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