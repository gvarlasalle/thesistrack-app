import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { getProjectsByStudent } from '../services/projectService';
import { 
  getDeliveriesByProject, 
  getCurrentMilestoneStatus,
  getNextAvailableMilestone
} from '../services/deliveryService';
import { UploadDeliveryForm } from '../components/student/UploadDeliveryForm';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [milestoneStatus, setMilestoneStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadingMilestone, setUploadingMilestone] = useState(null);
  const [expandedMilestone, setExpandedMilestone] = useState(null);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);
  
const loadProjects = async () => {
    try {
      setLoading(true);
      const userProjects = await getProjectsByStudent(user.uid);
      
      // Cargar nombres de asesores
      const projectsWithAdvisors = await Promise.all(
        userProjects.map(async (project) => {
          if (project.advisorId) {
            try {
              const { getUserById } = await import('../services/userService');
              const advisor = await getUserById(project.advisorId);
              return {
                ...project,
                advisorName: advisor.name || 'Por asignar'
              };
            } catch (err) {
              console.warn('Error obteniendo asesor:', err);
              return {
                ...project,
                advisorName: 'Por asignar'
              };
            }
          }
          return {
            ...project,
            advisorName: 'Por asignar'
          };
        })
      );
      
      setProjects(projectsWithAdvisors);
      
      if (projectsWithAdvisors.length > 0) {
        setSelectedProject(projectsWithAdvisors[0]);
        setMilestones(projectsWithAdvisors[0].milestones || []);
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    } finally {
      setLoading(false);
    }
  };

const loadProjectData = async () => {
    try {
      setLoading(true);
      
      const projectDeliveries = await getDeliveriesByProject(selectedProject.id);
      setDeliveries(projectDeliveries);
      
      const projectMilestones = selectedProject.milestones || [];
      setMilestones(projectMilestones);
      
      const milestonesNames = projectMilestones.map(m => m.name);
      const status = await getCurrentMilestoneStatus(selectedProject.id, milestonesNames);
      
      // Importar la función
      const { getNextAvailableMilestone } = await import('../services/deliveryService');
      const nextMilestone = await getNextAvailableMilestone(selectedProject.id, projectMilestones);
      
      // Actualizar el estado para permitir subida solo en el hito disponible
      const updatedStatus = {};
      for (const [milestoneName, milestoneData] of Object.entries(status)) {
        updatedStatus[milestoneName] = {
          ...milestoneData,
          canUpload: milestoneName === nextMilestone
        };
      }
      
      setMilestoneStatus(updatedStatus);
      
    } catch (error) {
      console.error('Error cargando datos del proyecto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleUploadClick = (milestoneName) => {
    setUploadingMilestone(milestoneName);
  };

  const handleUploadSuccess = () => {
    setUploadingMilestone(null);
    loadProjectData();
  };

  const handleUploadCancel = () => {
    setUploadingMilestone(null);
  };

  const toggleMilestoneExpand = (milestoneName) => {
    setExpandedMilestone(expandedMilestone === milestoneName ? null : milestoneName);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'not_started': {
        bg: '#f3f4f6',
        color: '#4b5563',
        text: 'Sin Iniciar'
      },
      'pending': {
        bg: '#fef3c7',
        color: '#92400e',
        text: 'Pendiente'
      },
      'approved': {
        bg: '#d1fae5',
        color: '#065f46',
        text: 'Aprobado'
      },
      'rejected': {
        bg: '#fee2e2',
        color: '#991b1b',
        text: 'Rechazado'
      }
    };

    const badge = badges[status] || badges['not_started'];

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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{color: '#6b7280', fontSize: '16px'}}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div style={{minHeight: '100vh', background: '#f3f4f6'}}>
        <header style={{
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '20px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}>
                <span style={{fontSize: '24px'}}>📚</span>
              </div>
              <div>
                <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                  Panel de Estudiante
                </h1>
                <p style={{fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0'}}>
                  Bienvenido, {user?.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div style={{padding: '32px', maxWidth: '1000px', margin: '0 auto'}}>
          <div style={{
            background: '#fef3c7',
            border: '2px solid #fcd34d',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>⚠️</div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px'}}>
              No tienes proyectos asignados
            </h2>
            <p style={{fontSize: '16px', color: '#6b7280'}}>
              Contacta con tu asesor para que te asigne a un proyecto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#f3f4f6'}}>
      {/* Header */}
      <header style={{
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}>
              <span style={{fontSize: '24px'}}>📚</span>
            </div>
            <div>
              <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                Panel de Estudiante
              </h1>
              <p style={{fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0'}}>
                Bienvenido, {user?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{maxWidth: '1400px', margin: '0 auto', padding: '32px'}}>
        {/* Información del Proyecto */}
        {selectedProject && (
          <div style={{marginBottom: '32px'}}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderLeft: '6px solid #10b981'
            }}>
              <div style={{marginBottom: '12px'}}>
                <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0'}}>
                  {selectedProject.title}
                </h2>
                <p style={{fontSize: '16px', color: '#6b7280', margin: 0}}>
                  {selectedProject.description}
                </p>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px'}}>
                <div>
                  <span style={{fontSize: '14px', color: '#6b7280', fontWeight: '500'}}>Asesor:</span>
                  <p style={{fontSize: '16px', color: '#1f2937', fontWeight: '600', margin: '4px 0 0 0'}}>
                    {selectedProject.advisorName || 'Por asignar'}
                  </p>
                </div>
                <div>
                  <span style={{fontSize: '14px', color: '#6b7280', fontWeight: '500'}}>Fecha de inicio:</span>
                  <p style={{fontSize: '16px', color: '#1f2937', fontWeight: '600', margin: '4px 0 0 0'}}>
                    {formatDate(selectedProject.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hitos del Proyecto */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '12px',
            borderBottom: '3px solid #10b981'
          }}>
            <h2 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
              📋 Hitos del Proyecto
            </h2>
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '500',
              background: '#f3f4f6',
              padding: '8px 16px',
              borderRadius: '20px'
            }}>
              {Object.values(milestoneStatus).filter(m => m.status === 'approved').length} de {milestones.length} completados
            </span>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {milestones.map((milestone, index) => {
              const milestoneName = milestone.name;
              const status = milestoneStatus[milestoneName] || { status: 'not_started', canUpload: false, deliveries: [] };
              const isExpanded = expandedMilestone === milestoneName;
              const hasDeliveries = status.deliveries && status.deliveries.length > 0;

              return (
                <div key={milestoneName} style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '2px solid #e5e7eb'
                }}>
                  {/* Header del Hito */}
                  <div style={{
                    background: 'linear-gradient(to right, #f9fafb, white)',
                    padding: '20px'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '16px', flex: 1}}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '20px',
                          flexShrink: 0,
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{flex: 1}}>
                          <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                            {milestoneName}
                          </h3>
                          {status.message && (
                            <p style={{fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0'}}>
                              {status.message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        {getStatusBadge(status.status)}
                        
                        {status.canUpload && uploadingMilestone !== milestoneName && (
                          <button
                            onClick={() => handleUploadClick(milestoneName)}
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Subir Entrega
                          </button>
                        )}

                        {hasDeliveries && (
                          <button
                            onClick={() => toggleMilestoneExpand(milestoneName)}
                            style={{
                              padding: '8px',
                              background: 'transparent',
                              border: 'none',
                              color: '#6b7280',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                            onMouseOut={(e) => e.target.style.background = 'transparent'}
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
                  </div>

                  {/* Formulario de Subida */}
                  {uploadingMilestone === milestoneName && (
                    <div style={{
                      padding: '20px',
                      background: '#eff6ff',
                      borderTop: '2px solid #bfdbfe'
                    }}>
                      <UploadDeliveryForm
                        projectId={selectedProject.id}
                        milestone={milestoneName}
                        onSuccess={handleUploadSuccess}
                        onCancel={handleUploadCancel}
                      />
                    </div>
                  )}

                  {/* Lista de Entregas Expandible */}
                  {isExpanded && hasDeliveries && (
                    <div style={{
                      padding: '20px',
                      background: '#f9fafb',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#374151',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>📄</span>
                        Historial de Versiones ({status.deliveries.length})
                      </h4>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                        {status.deliveries.map((delivery) => (
                          <div 
                            key={delivery.id}
                            style={{
                              background: 'white',
                              borderRadius: '8px',
                              padding: '16px',
                              border: '2px solid #e5e7eb'
                            }}
                          >
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                              <div style={{flex: 1}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
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
                                </div>
                                
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '12px',
                                  fontSize: '14px'
                                }}>
                                  <div>
                                    <span style={{color: '#6b7280'}}>Archivo:</span>
                                    <p style={{color: '#1f2937', fontWeight: '600', margin: '2px 0 0 0'}}>
                                      {delivery.fileName}
                                    </p>
                                  </div>
                                  <div>
                                    <span style={{color: '#6b7280'}}>Tamaño:</span>
                                    <p style={{color: '#1f2937', margin: '2px 0 0 0'}}>
                                      {formatFileSize(delivery.fileSize)}
                                    </p>
                                  </div>
                                  <div>
                                    <span style={{color: '#6b7280'}}>Subido:</span>
                                    <p style={{color: '#1f2937', margin: '2px 0 0 0'}}>
                                      {formatDate(delivery.uploadedAt)}
                                    </p>
                                  </div>
                                  {delivery.reviewedAt && (
                                    <div>
                                      <span style={{color: '#6b7280'}}>Revisado:</span>
                                      <p style={{color: '#1f2937', margin: '2px 0 0 0'}}>
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
                                    <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '600'}}>
                                      Descripción:
                                    </span>
                                    <p style={{fontSize: '14px', color: '#374151', margin: '4px 0 0 0'}}>
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
                                    <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '600'}}>
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

                                <a
                                href={delivery.fileUrl}                                
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  marginLeft: '16px',
                                  flexShrink: 0,
                                  padding: '10px 16px',
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
                                  transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                              >
                                <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Ver PDF
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje cuando no hay entregas */}
                  {!hasDeliveries && uploadingMilestone !== milestoneName && (
                    <div style={{
                      padding: '20px',
                      background: '#f9fafb',
                      borderTop: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      No hay entregas para este hito
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Información adicional */}
        <div style={{
          marginTop: '32px',
          background: '#eff6ff',
          border: '2px solid #bfdbfe',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{display: 'flex', alignItems: 'start', gap: '16px'}}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#3b82f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{fontSize: '20px'}}>ℹ️</span>
            </div>
            <div style={{flex: 1}}>
              <h3 style={{fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 8px 0'}}>
                Información importante
              </h3>
              <ul style={{fontSize: '14px', color: '#1e40af', margin: 0, padding: '0 0 0 20px'}}>
                <li style={{marginBottom: '6px'}}>Solo puedes subir archivos PDF (máximo 10MB)</li>
                <li style={{marginBottom: '6px'}}>No puedes subir nuevas versiones si hay una pendiente de revisión</li>
                <li style={{marginBottom: '6px'}}>Si tu entrega es rechazada, podrás subir una nueva versión</li>
                <li>Una vez aprobado un hito, se habilita el siguiente automáticamente</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Animación de loading */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};