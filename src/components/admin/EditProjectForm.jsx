import { useState, useEffect } from 'react';
import { updateProject, assignAdvisor } from '../../services/projectService';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getAllUsers } from '../../services/userService';

export const EditProjectForm = ({ project, onSuccess, onCancel }) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [selectedStudents, setSelectedStudents] = useState(project.teamMembers || []);
  const [advisor, setAdvisor] = useState(project.advisorId);
  const [status, setStatus] = useState(project.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  
  const [students, setStudents] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

    const loadUsers = async () => {
    try {
        const users = await getAllUsers();
        
        // Normalizar IDs
        const normalizedUsers = users.map(u => ({
        ...u,
        id: u.uid || u.id
        }));
        
        // ← AGREGAR ESTA LÍNEA
        setAllUsers(normalizedUsers);
        
        // Filtrar estudiantes disponibles (sin proyecto O que ya están en este proyecto)
        const allStudents = normalizedUsers.filter(u => u.role === 'student');
        const availableStudents = allStudents.filter(u => 
        (!u.teamId || u.teamId === project.id) && u.isActive !== false  // ← Solo activos
        );
        
        // Filtrar asesores ACTIVOS con menos de 12 proyectos
        const allAdvisors = normalizedUsers.filter(u => u.role === 'advisor');
        const availableAdvisors = allAdvisors.filter(adv => {
        const projectCount = adv.assignedProjects ? adv.assignedProjects.length : 0;
        return projectCount < 12 && adv.isActive !== false;  // ← Solo activos
        });
        
        setStudents(availableStudents);
        setAdvisors(availableAdvisors);
    } catch (err) {
        console.error('Error cargando usuarios:', err);
        setError('Error cargando usuarios');
    }
    };

  const handleStudentToggle = (studentId) => {
    if (!studentId) return;
    
    setSelectedStudents(prev => {
      const isSelected = prev.includes(studentId);
      
      // Si va a agregar y ya tiene 3, no permitir
      if (!isSelected && prev.length >= 3) {
        setError('Solo se permiten máximo 3 estudiantes por proyecto');
        setTimeout(() => setError(''), 3000);
        return prev;
      }
      
      return isSelected
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId];
    });
  };

  const handleSelectAll = () => {
    const validIds = students.map(s => s.id).filter(id => id).slice(0, 3);
    setSelectedStudents(validIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }
    if (selectedStudents.length === 0) {
      setError('Debe seleccionar al menos un estudiante');
      return;
    }
    if (selectedStudents.length > 3) {
      setError('Solo se permiten máximo 3 estudiantes por proyecto');
      return;
    }
    if (!advisor) {
      setError('Debe seleccionar un asesor');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Actualizar proyecto básico
      await updateProject(project.id, {
        title: title.trim(),
        description: description.trim(),
        status
      });

      // Manejar cambio de asesor
      if (advisor !== project.advisorId) {
        await assignAdvisor(project.id, advisor);
      }

      // Manejar cambios en estudiantes
      const oldStudents = project.teamMembers || [];
      const removedStudents = oldStudents.filter(id => !selectedStudents.includes(id));
      const addedStudents = selectedStudents.filter(id => !oldStudents.includes(id));

      // Remover estudiantes que ya no están
      for (const studentId of removedStudents) {
        const studentRef = doc(db, 'users', studentId);
        await updateDoc(studentRef, {
          teamId: null
        });
      }

      // Agregar nuevos estudiantes
      for (const studentId of addedStudents) {
        const studentRef = doc(db, 'users', studentId);
        await updateDoc(studentRef, {
          teamId: project.id
        });
      }

      // Actualizar teamMembers en el proyecto
      await updateDoc(doc(db, 'projects', project.id), {
        teamMembers: selectedStudents
      });

      onSuccess();
    } catch (err) {
      console.error('Error actualizando proyecto:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '32px',
      marginBottom: '32px'
    }}>
      <div style={{marginBottom: '32px'}}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 8px 0'
        }}>
          Editar Proyecto
        </h2>
        <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
          Actualiza la información del proyecto
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Título */}
        <div style={{marginBottom: '24px'}}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Título del Proyecto <span style={{color: '#ef4444'}}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              transition: 'border 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Descripción */}
        <div style={{marginBottom: '24px'}}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'border 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Estado */}
        <div style={{marginBottom: '24px'}}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              background: 'white',
              cursor: 'pointer',
              transition: 'border 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>

        {/* Estudiantes Actuales */}
        <div style={{marginBottom: '24px'}}>
        <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
        }}>
            Estudiantes del Proyecto (máx. 3)
        </label>
        
        {/* Lista de estudiantes actuales */}
        <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '10px',
            padding: '12px',
            background: '#f9fafb',
            marginBottom: '12px'
        }}>
            {selectedStudents.length === 0 ? (
            <p style={{color: '#9ca3af', fontSize: '14px', textAlign: 'center', margin: '12px 0'}}>
                No hay estudiantes asignados
            </p>
            ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {selectedStudents.map((studentId) => {
                const student = allUsers.find(s => s.id === studentId);
                if (!student) return null;
                
                const isInactive = student.isActive === false;
                
                return (
                    <div
                    key={studentId}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: isInactive ? '#fef3c7' : 'white',
                        borderRadius: '8px',
                        border: `1px solid ${isInactive ? '#fbbf24' : '#e5e7eb'}`
                    }}
                    >
                    <div style={{flex: 1}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <p style={{fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0}}>
                            {student.name}
                        </p>
                        {isInactive && (
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
                        <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0'}}>
                        {student.email}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleStudentToggle(studentId)}
                        disabled={loading}
                        style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.05)')}
                        onMouseOut={(e) => !loading && (e.target.style.transform = 'scale(1)')}
                    >
                        Quitar
                    </button>
                    </div>
                );
                })}
            </div>
            )}
        </div>
        
        <p style={{fontSize: '12px', color: selectedStudents.length >= 3 ? '#ef4444' : '#6b7280', marginBottom: '12px'}}>
            {selectedStudents.length}/3 estudiantes asignados
        </p>

        {/* Botón Agregar Estudiante */}
        {selectedStudents.length < 3 && (
            <button
            type="button"
            onClick={() => setShowAddStudent(!showAddStudent)}
            disabled={loading}
            style={{
                width: '100%',
                padding: '12px',
                background: showAddStudent ? '#f3f4f6' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: showAddStudent ? '#6b7280' : 'white',
                border: showAddStudent ? '2px solid #d1d5db' : 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
            }}
            onMouseOver={(e) => !showAddStudent && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !showAddStudent && (e.target.style.transform = 'translateY(0)')}
            >
            <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAddStudent ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
            </svg>
            {showAddStudent ? 'Cancelar' : 'Agregar Estudiante'}
            </button>
        )}

        {/* Lista para agregar estudiantes (solo activos) */}
        {showAddStudent && (
            <div style={{
            marginTop: '12px',
            border: '2px solid #10b981',
            borderRadius: '10px',
            padding: '12px',
            background: '#f0fdf4',
            maxHeight: '200px',
            overflowY: 'auto'
            }}>
            <p style={{fontSize: '13px', fontWeight: '600', color: '#059669', marginBottom: '12px'}}>
                Selecciona un estudiante activo para agregar:
            </p>
            {students.filter(s => !selectedStudents.includes(s.id)).length === 0 ? (
                <p style={{color: '#6b7280', fontSize: '14px', textAlign: 'center', margin: '12px 0'}}>
                No hay más estudiantes activos disponibles
                </p>
            ) : (
                students
                .filter(s => !selectedStudents.includes(s.id))
                .map((student) => (
                    <div
                    key={student.id}
                    onClick={() => {
                        handleStudentToggle(student.id);
                        setShowAddStudent(false);
                    }}
                    style={{
                        padding: '10px 12px',
                        background: 'white',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '1px solid #e5e7eb'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#10b981';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                    >
                    <p style={{fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0}}>
                        {student.name}
                    </p>
                    <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0'}}>
                        {student.email}
                    </p>
                    </div>
                ))
            )}
            </div>
        )}
        </div>

        {/* Asesor */}
        <div style={{marginBottom: '24px'}}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Cambiar Asesor <span style={{color: '#ef4444'}}>*</span>
          </label>
          
          {advisors.length === 0 ? (
            <div style={{
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              padding: '16px',
              background: '#f9fafb',
              textAlign: 'center'
            }}>
              <p style={{color: '#6b7280', fontSize: '14px', margin: 0}}>
                No hay asesores disponibles (todos tienen 12+ proyectos)
              </p>
            </div>
          ) : (
            <select
              value={advisor}
              onChange={(e) => setAdvisor(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer',
                transition: 'border 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">-- Seleccionar --</option>
              {advisors.map((adv) => {
                const projectCount = adv.assignedProjects ? adv.assignedProjects.length : 0;
                return (
                  <option key={adv.id} value={adv.id}>
                    {adv.name} - {projectCount}/12 proyectos
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #ef4444',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <svg style={{width: '20px', height: '20px', flexShrink: 0}} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Botones */}
        <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => !loading && (e.target.style.background = '#f9fafb')}
            onMouseOut={(e) => !loading && (e.target.style.background = 'white')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#d1d5db' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></div>
                Guardando...
              </>
            ) : (
              <>
                <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};