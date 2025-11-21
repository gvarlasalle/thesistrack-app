import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { getProjectsByAdvisor } from '../services/projectService';
import { getAllUsers } from '../services/userService';
import { getProjectDeliveries } from '../services/deliveryService';
import { MilestoneManager } from '../components/advisor/MilestoneManager';
import { DeliveryHistory } from '../components/advisor/DeliveryHistory';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { updateProject } from '../services/projectService';

export const AdvisorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [projectDeliveries, setProjectDeliveries] = useState({});
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
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Cargar proyectos y usuarios
      const [projectsData, usersData] = await Promise.all([
        getProjectsByAdvisor(user.uid),
        getAllUsers()
      ]);
      
      setProjects(projectsData);
      setAllUsers(usersData);

      // Cargar entregas de todos los proyectos
      const deliveriesMap = {};
      for (const project of projectsData) {
        const deliveries = await getProjectDeliveries(project.id);
        deliveriesMap[project.id] = deliveries;
      }
      setProjectDeliveries(deliveriesMap);

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

  const toggleProject = (projectId) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      setActiveTab('info');
    } else {
      setExpandedProjectId(projectId);
      setActiveTab('info');
    }
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

  const getProjectProgress = (project) => {
    if (!project.milestones || project.milestones.length === 0) return 0;
    const completed = project.milestones.filter(m => m.completed).length;
    return Math.round((completed / project.milestones.length) * 100);
  };

  const getPendingDeliveriesCount = (projectId) => {
    const deliveries = projectDeliveries[projectId] || [];
    return deliveries.filter(d => d.status === 'pending').length;
  };

  const getTotalPendingDeliveries = () => {
    return Object.values(projectDeliveries).reduce((total, deliveries) => {
      return total + deliveries.filter(d => d.status === 'pending').length;
    }, 0);
  };

  const getStudentNames = (teamMemberIds) => {
    if (!teamMemberIds || teamMemberIds.length === 0) return [];
    return teamMemberIds.map(id => {
      const student = allUsers.find(u => (u.id || u.uid) === id);
      return student ? student.name : 'Desconocido';
    });
  };

  const allMilestonesCompleted = (project) => {
    return project.milestones && project.milestones.length > 0 &&
           project.milestones.every(m => m.completed);
  };

  const handleCompleteProject = (project) => {
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
              loadData();
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

  const handleConfirmRejection = (project) => {
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
              loadData();
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

  const tabs = [
    { id: 'info', label: 'Información', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'milestones', label: 'Hitos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'deliveries', label: 'Entregas', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
  ];

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

  const totalStudents = projects.reduce((acc, p) => acc + (p.teamMembers?.length || 0), 0);
  const totalPendingDeliveries = getTotalPendingDeliveries();

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
            <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{totalPendingDeliveries}</p>
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
            <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{totalStudents}</p>
          </div>
        </div>

        {/* Mis Proyectos */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '28px'
        }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            marginBottom: '24px',
            color: '#1f2937',
            paddingBottom: '12px',
            borderBottom: '3px solid #4facfe'
          }}>
            📚 Mis Proyectos ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <div style={{textAlign: 'center', padding: '60px 20px'}}>
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
            <div style={{display: 'grid', gap: '20px'}}>
              {projects.map((project) => {
                const isExpanded = expandedProjectId === project.id;
                const statusStyle = getStatusBadge(project.status);
                const progress = getProjectProgress(project);
                const pendingCount = getPendingDeliveriesCount(project.id);
                const studentNames = getStudentNames(project.teamMembers);
                const projectStudents = allUsers.filter(u => 
                  project.teamMembers?.includes(u.id || u.uid)
                );
                const deliveries = projectDeliveries[project.id] || [];

                return (
                  <div
                    key={project.id}
                    style={{
                      background: isExpanded ? 'white' : '#f9fafb',
                      border: `2px solid ${isExpanded ? '#4facfe' : '#e5e7eb'}`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'all 0.3s',
                      boxShadow: isExpanded ? '0 8px 24px rgba(79, 172, 254, 0.2)' : 'none'
                    }}
                  >
                    {/* Header Clickeable */}
                    <div
                      onClick={() => toggleProject(project.id)}
                      style={{
                        padding: '24px',
                        cursor: 'pointer',
                        background: isExpanded ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'transparent',
                        color: isExpanded ? 'white' : 'inherit',
                        transition: 'all 0.3s'
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
                        <div style={{flex: 1}}>
                          <h3 style={{fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0'}}>
                            {project.title}
                          </h3>
                          <div style={{display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'}}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: isExpanded ? 'rgba(255,255,255,0.2)' : statusStyle.bg,
                              color: isExpanded ? 'white' : statusStyle.color
                            }}>
                              {statusStyle.label}
                            </span>
                            {pendingCount > 0 && (
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: '#fef3c7',
                                color: '#92400e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                animation: 'pulse 2s infinite'
                              }}>
                                <svg style={{width: '14px', height: '14px'}} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {pendingCount} entrega{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            {studentNames.length > 0 && (
                              <span style={{fontSize: '13px', opacity: isExpanded ? 0.9 : 0.7}}>
                                👥 {studentNames.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isExpanded ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginLeft: '16px',
                          transition: 'transform 0.3s'
                        }}>
                          <svg 
                            style={{
                              width: '20px',
                              height: '20px',
                              color: isExpanded ? 'white' : '#6b7280',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s'
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Progreso */}
                      {!isExpanded && (
                        <div>
                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                            <span style={{fontSize: '13px', fontWeight: '500', color: '#374151'}}>Progreso</span>
                            <span style={{fontSize: '13px', fontWeight: '600', color: '#4facfe'}}>{progress}%</span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: '#e5e7eb',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                              transition: 'width 0.3s'
                            }}></div>
                          </div>
                        </div>
                      )}

                      {isExpanded && (
                        <div style={{marginTop: '16px'}}>
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
                      )}
                    </div>

                    {/* Contenido Expandible */}
                    {isExpanded && (
                      <div style={{
                        background: 'white',
                        animation: 'slideDown 0.3s ease-out'
                      }}>
                        {/* Tabs */}
                        <div style={{
                          display: 'flex',
                          borderBottom: '2px solid #e5e7eb',
                          background: '#f9fafb',
                          padding: '0 24px'
                        }}>
                          {tabs.map(tab => (
                            <button
                              key={tab.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab(tab.id);
                              }}
                              style={{
                                padding: '16px 24px',
                                background: activeTab === tab.id ? 'white' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '3px solid #4facfe' : '3px solid transparent',
                                color: activeTab === tab.id ? '#4facfe' : '#6b7280',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '-2px'
                              }}
                            >
                              <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                              </svg>
                              {tab.label}
                              {tab.id === 'deliveries' && pendingCount > 0 && (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  background: '#fef3c7',
                                  color: '#92400e'
                                }}>
                                  {pendingCount}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Tab Content */}
                        <div style={{padding: '32px'}}>
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
                                {projectStudents.length === 0 ? (
                                  <p style={{color: '#9ca3af', fontSize: '14px'}}>No hay estudiantes asignados</p>
                                ) : (
                                  <div style={{display: 'grid', gap: '12px'}}>
                                    {projectStudents.map((student) => (
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
                                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
                                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
                              onUpdate={loadData}
                            />
                          )}

                          {activeTab === 'deliveries' && (
                            <DeliveryHistory
                              deliveries={deliveries}
                              students={projectStudents}
                              onUpdate={loadData}
                            />
                          )}
                        </div>

                        {/* Footer con acciones */}
                        {project.status === 'in_progress' && !showRejectionForm && (
                          <div style={{
                            padding: '24px',
                            borderTop: '2px solid #e5e7eb',
                            background: '#f9fafb',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectProject();
                              }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteProject(project);
                              }}
                              disabled={!allMilestonesCompleted(project)}
                              style={{
                                padding: '12px 24px',
                                background: allMilestonesCompleted(project) 
                                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                  : '#d1d5db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: allMilestonesCompleted(project) ? 'pointer' : 'not-allowed',
                                boxShadow: allMilestonesCompleted(project) ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
                                transition: 'transform 0.2s'
                              }}
                              onMouseOver={(e) => allMilestonesCompleted(project) && (e.target.style.transform = 'translateY(-2px)')}
                              onMouseOut={(e) => allMilestonesCompleted(project) && (e.target.style.transform = 'translateY(0)')}
                            >
                              Completar Proyecto
                            </button>
                          </div>
                        )}

                        {/* Formulario de rechazo */}
                        {showRejectionForm && (
                          <div style={{
                            padding: '24px',
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
                              onClick={(e) => e.stopPropagation()}
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
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmRejection(project);
                                }}
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

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

      {/* Animaciones */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 2000px;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};