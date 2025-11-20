import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { getProjectByStudent } from '../services/projectService';
import { getDeliveriesByProject } from '../services/deliveryService';
import { UploadDeliveryForm } from '../components/student/UploadDeliveryForm';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [expandedDeliveries, setExpandedDeliveries] = useState({});

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      const projectData = await getProjectByStudent(user.uid);
      if (projectData) {
        setProject(projectData);
        const deliveriesData = await getDeliveriesByProject(projectData.id);
        deliveriesData.sort((a, b) => (b.version || 0) - (a.version || 0));
        setDeliveries(deliveriesData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUploadClick = (milestone) => {
    setSelectedMilestone(milestone);
    setShowUploadForm(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    setSelectedMilestone('');
    loadData();
  };

  const toggleDeliveryExpand = (deliveryId) => {
    setExpandedDeliveries(prev => ({
      ...prev,
      [deliveryId]: !prev[deliveryId]
    }));
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente', icon: '⏳' },
      approved: { bg: '#d1fae5', color: '#065f46', label: 'Aprobado', icon: '✓' },
      rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rechazado', icon: '✗' }
    };
    const style = config[status] || config.pending;
    
    return (
      <span style={{
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>{style.icon}</span>
        {style.label}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return timestamp.toDate().toLocaleString('es-PE');
    } catch (e) {
      return 'Fecha invalida';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getDeliveriesByMilestone = (milestone) => deliveries.filter(d => d.milestone === milestone);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
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
            borderTop: '4px solid #43e97b',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{color: '#6b7280', fontSize: '16px'}}>Cargando tu proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
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
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(67, 233, 123, 0.4)'
              }}>
                <svg style={{width: '28px', height: '28px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>Mi Proyecto</h1>
                <p style={{fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0'}}>Bienvenido, {user?.name}</p>
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
              Cerrar Sesion
            </button>
          </div>
        </header>

        <main style={{maxWidth: '1400px', margin: '0 auto', padding: '32px'}}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '60px 32px',
            textAlign: 'center'
          }}>
            <svg style={{width: '80px', height: '80px', margin: '0 auto 20px', color: '#d1d5db'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 style={{fontSize: '20px', color: '#1f2937', fontWeight: '600', marginBottom: '8px'}}>
              No tienes proyecto asignado
            </h3>
            <p style={{fontSize: '14px', color: '#6b7280'}}>
              Un administrador te asignara a un proyecto pronto
            </p>
          </div>
        </main>
      </div>
    );
  }

  const milestones = ['Capitulo 1', 'Capitulo 2', 'Capitulo 3'];
  const projectStatusStyle = {
    pending: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
    in_progress: { bg: '#dbeafe', color: '#1e40af', label: 'En Progreso' },
    completed: { bg: '#d1fae5', color: '#065f46', label: 'Completado' }
  }[project.status] || { bg: '#f3f4f6', color: '#6b7280', label: 'Desconocido' };

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
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(67, 233, 123, 0.4)'
            }}>
              <svg style={{width: '28px', height: '28px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>Mi Proyecto</h1>
              <p style={{fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0'}}>Bienvenido, {user?.name}</p>
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
            Cerrar Sesion
          </button>
        </div>
      </header>

      <main style={{maxWidth: '1400px', margin: '0 auto', padding: '32px'}}>
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 10px 40px rgba(67, 233, 123, 0.3)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{position: 'absolute', top: '-40px', right: '-40px', opacity: 0.1}}>
            <svg style={{width: '200px', height: '200px'}} fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <div style={{position: 'relative', zIndex: 1}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px'}}>
              <div>
                <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>TU PROYECTO</p>
                <h2 style={{fontSize: '32px', fontWeight: 'bold', margin: 0}}>{project.title}</h2>
              </div>
              <span style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {projectStatusStyle.label}
              </span>
            </div>
            <p style={{fontSize: '16px', opacity: 0.95, lineHeight: '1.6', marginBottom: '20px'}}>
              {project.description}
            </p>
            <div style={{display: 'flex', gap: '24px', fontSize: '14px', opacity: 0.9}}>
              <span>📋 Hito Actual: {project.currentMilestone}</span>
              <span>✓ {deliveries.length} entregas realizadas</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '28px',
          marginBottom: '32px'
        }}>
          <h2 style={{fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
            Hitos del Proyecto
          </h2>

          <div style={{display: 'grid', gap: '16px'}}>
            {milestones.map((milestone) => {
              const milestoneDeliveries = getDeliveriesByMilestone(milestone);
              const isCurrentMilestone = project.currentMilestone === milestone;
              const hasApproved = milestoneDeliveries.some(d => d.status === 'approved');
              
              return (
                <div
                  key={milestone}
                  style={{
                    background: isCurrentMilestone ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : '#f9fafb',
                    border: `2px solid ${isCurrentMilestone ? '#60a5fa' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: hasApproved 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                          : isCurrentMilestone 
                          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                          : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        {hasApproved ? (
                          <svg style={{width: '24px', height: '24px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg style={{width: '24px', height: '24px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0}}>
                          {milestone}
                        </h3>
                        <p style={{fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0'}}>
                          {milestoneDeliveries.length} entrega(s) • {hasApproved ? 'Aprobado ✓' : isCurrentMilestone ? 'Hito Actual' : 'Pendiente'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUploadClick(milestone)}
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(67, 233, 123, 0.3)',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Subir
                    </button>
                  </div>

                  {milestoneDeliveries.length > 0 && (
                    <div style={{
                      background: 'white',
                      borderRadius: '10px',
                      padding: '16px',
                      marginTop: '12px'
                    }}>
                      <p style={{fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase'}}>
                        Entregas Realizadas
                      </p>
                      <div style={{display: 'grid', gap: '8px'}}>
                        {milestoneDeliveries.map((delivery) => (
                          <div key={delivery.id} style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}>
                            <div 
                              onClick={() => toggleDeliveryExpand(delivery.id)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                background: '#f9fafb',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#f9fafb'}
                            >
                              <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: '12px'}}>
                                <span style={{fontSize: '14px', color: '#6b7280'}}>
                                  {expandedDeliveries[delivery.id] ? '▼' : '▶'}
                                </span>
                                <div>
                                  <p style={{fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0}}>
                                    {delivery.milestone}
                                  </p>
                                  <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0'}}>
                                    Version {delivery.version} • {delivery.fileName}
                                  </p>
                                </div>
                              </div>
                              <div>
                                {getStatusBadge(delivery.status)}
                              </div>
                            </div>

                            {expandedDeliveries[delivery.id] && (
                              <div style={{
                                padding: '16px',
                                background: 'white',
                                borderTop: '1px solid #e5e7eb'
                              }}>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, 1fr)',
                                  gap: '16px',
                                  marginBottom: '16px'
                                }}>
                                  <div>
                                    <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Archivo</p>
                                    <p style={{fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0}}>
                                      {delivery.fileName}
                                    </p>
                                  </div>
                                  <div>
                                    <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Tamaño</p>
                                    <p style={{fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0}}>
                                      {formatFileSize(delivery.fileSize)}
                                    </p>
                                  </div>
                                  <div>
                                    <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Fecha de Subida</p>
                                    <p style={{fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0}}>
                                      {formatDate(delivery.uploadedAt)}
                                    </p>
                                  </div>
                                  <div>
                                    <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Estado</p>
                                    {getStatusBadge(delivery.status)}
                                  </div>
                                </div>

                                {delivery.description && (
                                  <div style={{marginBottom: '16px'}}>
                                    <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Descripcion</p>
                                    <p style={{
                                      fontSize: '14px',
                                      background: '#f9fafb',
                                      padding: '12px',
                                      borderRadius: '8px',
                                      margin: 0,
                                      color: '#1f2937'
                                    }}>
                                      {delivery.description}
                                    </p>
                                  </div>
                                )}

                                {delivery.advisorComments && (
                                  <div style={{marginBottom: '16px'}}>
                                    <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Comentarios del Asesor</p>
                                    <p style={{
                                      fontSize: '14px',
                                      background: '#fef3c7',
                                      padding: '12px',
                                      borderRadius: '8px',
                                      border: '1px solid #fde68a',
                                      margin: 0,
                                      color: '#92400e'
                                    }}>
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
                                      gap: '8px',
                                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                      color: 'white',
                                      padding: '10px 16px',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      textDecoration: 'none',
                                      boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                                      transition: 'transform 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                  >
                                    <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Ver PDF
                                  </a>
                                )}
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
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '28px'
        }}>
          <h2 style={{fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
            Mis Entregas ({deliveries.length})
          </h2>

          {deliveries.length === 0 ? (
            <div style={{textAlign: 'center', padding: '48px 0'}}>
              <div style={{fontSize: '64px', marginBottom: '16px'}}>📭</div>
              <p style={{fontSize: '16px', color: '#6b7280'}}>Aun no has realizado ninguna entrega</p>
            </div>
          ) : (
            <div style={{display: 'grid', gap: '12px'}}>
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#60a5fa';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
                    <div>
                      <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px 0'}}>
                        {delivery.milestone}
                      </h3>
                      <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                        Version {delivery.version}
                      </p>
                    </div>
                    {getStatusBadge(delivery.status)}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <p style={{color: '#6b7280', margin: '0 0 4px 0'}}>Archivo</p>
                      <p style={{fontWeight: '500', color: '#1f2937', margin: 0}}>{delivery.fileName}</p>
                    </div>
                    <div>
                      <p style={{color: '#6b7280', margin: '0 0 4px 0'}}>Tamaño</p>
                      <p style={{fontWeight: '500', color: '#1f2937', margin: 0}}>{formatFileSize(delivery.fileSize)}</p>
                    </div>
                    <div>
                      <p style={{color: '#6b7280', margin: '0 0 4px 0'}}>Fecha</p>
                      <p style={{fontWeight: '500', color: '#1f2937', margin: 0}}>{formatDate(delivery.uploadedAt)}</p>
                    </div>
                  </div>

                  {delivery.advisorComments && (
                    <div style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <p style={{fontSize: '12px', fontWeight: '600', color: '#92400e', margin: '0 0 4px 0'}}>
                        Comentarios del Asesor
                      </p>
                      <p style={{fontSize: '14px', color: '#92400e', margin: 0}}>
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
                        gap: '8px',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ver PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showUploadForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <UploadDeliveryForm
              projectId={project.id}
              milestone={selectedMilestone}
              onSuccess={handleUploadSuccess}
              onCancel={() => {
                setShowUploadForm(false);
                setSelectedMilestone('');
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
