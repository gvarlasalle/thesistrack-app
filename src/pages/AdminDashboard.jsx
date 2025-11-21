import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { getAllProjects } from '../services/projectService';
import { getUserCountByRole } from '../services/userService';
import { CreateProjectForm } from '../components/admin/CreateProjectForm';
import { ProjectsManagement } from '../components/admin/ProjectsManagement';
import { UserManagement } from '../components/admin/UserManagement';
import { PendingUsersApproval } from '../components/admin/PendingUsersApproval';
import { StatsCards } from '../components/admin/StatsCards';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleRefresh = () => {
  setRefreshTrigger(prev => prev + 1);
  };
  
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
        {/* SECCIÓN 1: ESTADÍSTICAS */}
        <div style={{marginBottom: '48px'}}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '3px solid #8b5cf6'
          }}>
            📊 Estadísticas del Sistema
          </h2>
          <StatsCards stats={stats} />
        </div>

        {/* SECCIÓN 2: PROYECTOS DE TESIS */}
        <div style={{marginBottom: '48px'}}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '3px solid #8b5cf6'
          }}>
            <h2 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
              📚 Proyectos de Tesis
            </h2>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
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
                <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Nuevo Proyecto
              </button>
            )}
          </div>

          {showCreateForm && (
            <div style={{marginBottom: '24px'}}>
              <CreateProjectForm
                onSuccess={() => {
                  setShowCreateForm(false);
                  handleRefresh();
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          <ProjectsManagement onRefresh={handleRefresh} />
        </div>

        {/* SECCIÓN 3: GESTIÓN DE CUENTAS */}
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '3px solid #8b5cf6'
          }}>
            👥 Gestión de Cuentas
          </h2>
          <div style={{ height: '20px' }}></div>
          <UserManagement onRefresh={handleRefresh} />
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