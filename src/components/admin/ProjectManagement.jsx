import { useState, useEffect } from 'react';
import { 
  getAllProjects, 
  deleteProject, 
  updateProject,
  assignAdvisor 
} from '../../services/projectService';
import { getAllUsers } from '../../services/userService';
import { EditProjectForm } from './EditProjectForm';

export const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);

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
      
      setProjects(projectsData);
      setStudents(usersData.filter(u => u.role === 'student'));
      setAdvisors(usersData.filter(u => u.role === 'advisor'));
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeletingProjectId(projectId);
      await deleteProject(projectId);
      await loadData();
      alert('Proyecto eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      alert('Error al eliminar el proyecto: ' + error.message);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingProject(null);
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

  const getStudentNames = (teamMemberIds) => {
    if (!teamMemberIds || teamMemberIds.length === 0) return 'Sin estudiantes';
    
    const names = teamMemberIds.map(id => {
      const student = students.find(s => s.id === id);
      return student ? student.name : 'Desconocido';
    });
    
    return names.join(', ');
  };

  const getAdvisorName = (advisorId) => {
    const advisor = advisors.find(a => a.id === advisorId);
    return advisor ? advisor.name : 'Sin asesor';
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '40px',
        textAlign: 'center'
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

  if (editingProject) {
    return (
      <EditProjectForm
        project={editingProject}
        students={students}
        advisors={advisors}
        onSuccess={handleEditSuccess}
        onCancel={() => setEditingProject(null)}
      />
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
      <div style={{marginBottom: '24px'}}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 8px 0'
        }}>
          Gestión de Proyectos
        </h2>
        <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
          Edita o elimina proyectos existentes
        </p>
      </div>

      {projects.length === 0 ? (
        <div style={{textAlign: 'center', padding: '60px 20px'}}>
          <svg style={{width: '80px', height: '80px', margin: '0 auto 20px', color: '#d1d5db'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p style={{fontSize: '18px', color: '#6b7280', fontWeight: '500'}}>No hay proyectos disponibles</p>
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
                transition: 'all 0.2s'
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
                <div style={{flex: 1}}>
                  <h3 style={{fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0'}}>
                    {project.title}
                  </h3>
                  {getStatusBadge(project.status)}
                </div>
                
                <div style={{display: 'flex', gap: '8px'}}>
                  <button
                    onClick={() => setEditingProject(project)}
                    disabled={deletingProjectId === project.id}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
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
                    <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      fontSize: '14px',
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
                          width: '14px',
                          height: '14px',
                          border: '2px solid #ffffff',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }}></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5'}}>
                {project.description || 'Sin descripción'}
              </p>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px'}}>
                <div>
                  <span style={{color: '#6b7280', fontWeight: '500'}}>Estudiantes:</span>
                  <p style={{color: '#1f2937', margin: '4px 0 0 0'}}>{getStudentNames(project.teamMembers)}</p>
                </div>
                <div>
                  <span style={{color: '#6b7280', fontWeight: '500'}}>Asesor:</span>
                  <p style={{color: '#1f2937', margin: '4px 0 0 0'}}>{getAdvisorName(project.advisorId)}</p>
                </div>
                <div>
                  <span style={{color: '#6b7280', fontWeight: '500'}}>Hito Actual:</span>
                  <p style={{color: '#1f2937', margin: '4px 0 0 0'}}>{project.currentMilestone}</p>
                </div>
                <div>
                  <span style={{color: '#6b7280', fontWeight: '500'}}>Progreso:</span>
                  <p style={{color: '#1f2937', margin: '4px 0 0 0'}}>
                    {project.milestones ? 
                      `${project.milestones.filter(m => m.completed).length} / ${project.milestones.length} hitos` 
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          ))}
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