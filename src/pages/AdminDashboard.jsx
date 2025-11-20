import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { getAllProjects } from '../services/projectService';
import { getUserCountByRole } from '../services/userService';
import { CreateProjectForm } from '../components/admin/CreateProjectForm';
import { UserManagement } from '../components/admin/UserManagement';
import { PendingUsersApproval } from '../components/admin/PendingUsersApproval';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, projectsData] = await Promise.all([
        getUserCountByRole(),
        getAllProjects()
      ]);
      setStats(statsData);
      setProjects(projectsData);
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

  const handleProjectCreated = () => {
    setShowCreateForm(false);
    loadData();
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
      in_progress: { bg: '#dbeafe', color: '#1e40af', label: 'En Progreso' },
      completed: { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
      rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rechazado' }
    };
    const style = config[status] || config.pending;
    
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
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            borderTop: '4px solid #667eea',
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}>
              <svg style={{width: '28px', height: '28px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                Panel de Administración
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
        {/* Stats Cards Modernos */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2}}>
                <svg style={{width: '120px', height: '120px'}} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Total Usuarios</p>
              <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{stats.total}</p>
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
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Administradores</p>
              <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{stats.admin}</p>
            </div>

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
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Asesores</p>
              <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{stats.advisor}</p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 10px 40px rgba(67, 233, 123, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2}}>
                <svg style={{width: '120px', height: '120px'}} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Estudiantes</p>
              <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{stats.student}</p>
            </div>
          </div>
        )}

        {/* Botón Crear Proyecto */}
        {showCreateForm ? (
          <div style={{marginBottom: '32px'}}>
            <CreateProjectForm
              onSuccess={handleProjectCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        ) : (
          <div style={{marginBottom: '32px'}}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Nuevo Proyecto
            </button>
          </div>
        )}

        {/* Projects Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '28px',
          marginBottom: '32px'
        }}>
          <h2 style={{fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
            Todos los Proyectos ({projects.length})
          </h2>
          {projects.length === 0 ? (
            <div style={{textAlign: 'center', padding: '60px 20px'}}>
              <svg style={{width: '80px', height: '80px', margin: '0 auto 20px', color: '#d1d5db'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p style={{fontSize: '18px', color: '#6b7280', fontWeight: '500'}}>No hay proyectos creados</p>
              <p style={{fontSize: '14px', color: '#9ca3af', marginTop: '8px'}}>Crea el primer proyecto usando el botón de arriba</p>
            </div>
          ) : (
            <div style={{display: 'grid', gap: '16px'}}>
              {projects.map((project) => (
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
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
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
                    {getStatusBadge(project.status)}
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
                      Hito: {project.currentMilestone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Users Approval */}
        <PendingUsersApproval />

        {/* User Management */}
        <UserManagement />
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