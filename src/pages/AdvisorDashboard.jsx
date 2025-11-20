import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { getProjectsByAdvisor } from '../services/projectService';
import { getPendingDeliveries } from '../services/deliveryService';
import { DeliveryReview } from '../components/advisor/DeliveryReview';

export const AdvisorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;
    
    try {
      const projectsData = await getProjectsByAdvisor(user.uid);
      setProjects(projectsData);

      if (projectsData.length > 0) {
        const allPending = [];
        for (const project of projectsData) {
          const pending = await getPendingDeliveries(project.id);
          allPending.push(...pending);
        }

        // Ordenar por versión descendente (más reciente primero)
        allPending.sort((a, b) => (b.version || 0) - (a.version || 0));

        setPendingDeliveries(allPending);
        
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
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

  const handleDeliveryReviewed = () => {
    loadData();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
      in_progress: { bg: '#dbeafe', color: '#1e40af', label: 'En Progreso' },
      completed: { bg: '#d1fae5', color: '#065f46', label: 'Completado' }
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
            borderTop: '4px solid #4facfe',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{color: '#6b7280', fontSize: '16px'}}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#f3f4f6'}}>
      {/* Header Moderno */}
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
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
            }}>
              <svg style={{width: '28px', height: '28px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                Panel de Asesor
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
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 10px 40px rgba(79, 172, 254, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2}}>
              <svg style={{width: '120px', height: '120px'}} fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Mis Proyectos</p>
            <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{projects.length}</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 10px 40px rgba(240, 147, 251, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2}}>
              <svg style={{width: '120px', height: '120px'}} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Entregas Pendientes</p>
            <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{pendingDeliveries.length}</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 10px 40px rgba(250, 112, 154, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2}}>
              <svg style={{width: '120px', height: '120px'}} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Estudiantes</p>
            <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>
              {projects.reduce((acc, p) => acc + (p.teamMembers?.length || 0), 0)}
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
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
              No tienes proyectos asignados
            </h3>
            <p style={{fontSize: '14px', color: '#6b7280'}}>
              Un administrador te asignará proyectos pronto
            </p>
          </div>
        ) : (
          <>
            {/* Mis Proyectos */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '28px',
              marginBottom: '32px'
            }}>
              <h2 style={{fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
                Mis Proyectos ({projects.length})
              </h2>
              <div style={{display: 'grid', gap: '16px'}}>
                {projects.map((project) => {
                  const statusStyle = getStatusColor(project.status);
                  return (
                    <div
                      key={project.id}
                      style={{
                        background: '#f9fafb',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px',
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#4facfe';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
                        <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0}}>
                          {project.title}
                        </h3>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          background: statusStyle.bg,
                          color: statusStyle.color
                        }}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5'}}>
                        {project.description}
                      </p>
                      <div style={{display: 'flex', gap: '24px', fontSize: '14px', color: '#6b7280'}}>
                        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {project.teamMembers?.length || 0} estudiante(s)
                        </span>
                        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Hito Actual: {project.currentMilestone}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Entregas Pendientes de Revision */}
            {selectedProject && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '28px'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg style={{width: '24px', height: '24px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 style={{fontSize: '22px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                    Entregas Pendientes de Revisión ({pendingDeliveries.length})
                  </h2>
                </div>

                {pendingDeliveries.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '60px 20px'}}>
                    <svg style={{width: '80px', height: '80px', margin: '0 auto 20px', color: '#d1fae5'}} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p style={{fontSize: '18px', color: '#059669', fontWeight: '500'}}>¡Todo al día!</p>
                    <p style={{fontSize: '14px', color: '#6b7280', marginTop: '8px'}}>No hay entregas pendientes de revisión</p>
                  </div>
                ) : (
                  <div style={{display: 'grid', gap: '20px'}}>
                    {pendingDeliveries.map((delivery) => (
                      <DeliveryReview
                        key={delivery.id}
                        delivery={delivery}
                        onReviewed={handleDeliveryReviewed}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
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