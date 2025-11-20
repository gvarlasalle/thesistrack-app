import { useState } from 'react';
import { createProject } from '../../services/projectService';
import { getAllUsers } from '../../services/userService';
import { useEffect } from 'react';

export const CreateProjectForm = ({ onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [students, setStudents] = useState([]);
  const [advisor, setAdvisor] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      setStudents(users.filter(u => u.role === 'student'));
      setAdvisors(users.filter(u => u.role === 'advisor'));
    } catch (err) {
      setError('Error cargando usuarios');
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
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
    if (!advisor) {
      setError('Debe seleccionar un asesor');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createProject({
        title: title.trim(),
        description: description.trim(),
        teamMembers: selectedStudents,
        advisorId: advisor,
        status: 'in_progress',
        currentMilestone: 'Capitulo 1'
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{padding: '32px'}}>
      {/* Header */}
      <div style={{marginBottom: '32px'}}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 8px 0'
        }}>
          Crear Nuevo Proyecto
        </h2>
        <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
          Completa la informacion del proyecto y asigna estudiantes y asesor
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
            placeholder="Ej: Sistema de Gestion de Bibliotecas"
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
            Descripcion
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripcion del proyecto..."
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

        {/* Estudiantes */}
        <div style={{marginBottom: '24px'}}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Seleccionar Estudiantes <span style={{color: '#ef4444'}}>*</span>
          </label>
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '10px',
            padding: '12px',
            maxHeight: '200px',
            overflowY: 'auto',
            background: '#f9fafb'
          }}>
            {students.length === 0 ? (
              <p style={{color: '#6b7280', fontSize: '14px', textAlign: 'center', margin: '12px 0'}}>
                No hay estudiantes disponibles
              </p>
            ) : (
              students.map((student) => (
                <label
                  key={student.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
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
                    e.currentTarget.style.borderColor = '#8b5cf6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    disabled={loading}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: '12px',
                      cursor: 'pointer',
                      accentColor: '#8b5cf6'
                    }}
                  />
                  <div style={{flex: 1}}>
                    <p style={{fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0}}>
                      {student.name}
                    </p>
                    <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0'}}>
                      {student.email}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
          {selectedStudents.length > 0 && (
            <p style={{fontSize: '12px', color: '#8b5cf6', marginTop: '8px'}}>
              {selectedStudents.length} estudiante(s) seleccionado(s)
            </p>
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
            Seleccionar Asesor <span style={{color: '#ef4444'}}>*</span>
          </label>
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
            {advisors.map((adv) => (
              <option key={adv.id} value={adv.id}>
                {adv.name} ({adv.email})
              </option>
            ))}
          </select>
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
                Creando...
              </>
            ) : (
              <>
                <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Proyecto
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