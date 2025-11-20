import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'advisor') navigate('/advisor');
      else if (user.role === 'student') navigate('/student');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(formData.email, formData.password);
      
      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'advisor') navigate('/advisor');
      else if (userData.role === 'student') navigate('/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, password) => {
    setFormData({ email, password });
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      
      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'advisor') navigate('/advisor');
      else if (userData.role === 'student') navigate('/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      width: '100%',
      maxWidth: '440px',
      overflow: 'hidden'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 30px',
      textAlign: 'center',
      color: 'white'
    },
    logo: {
      width: '80px',
      height: '80px',
      background: 'white',
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      margin: '0 0 10px 0'
    },
    subtitle: {
      fontSize: '14px',
      opacity: '0.9'
    },
    form: {
      padding: '40px 30px'
    },
    inputGroup: {
      marginBottom: '25px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      transition: 'all 0.3s',
      outline: 'none'
    },
    inputFocus: {
      border: '2px solid #667eea'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
    },
    error: {
      background: '#fee2e2',
      border: '1px solid #fecaca',
      color: '#dc2626',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '20px'
    },
    quickAccess: {
      borderTop: '1px solid #e5e7eb',
      padding: '25px 30px 30px'
    },
    quickTitle: {
      textAlign: 'center',
      fontSize: '11px',
      color: '#9ca3af',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '20px'
    },
    quickButtons: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px'
    },
    quickButton: {
      padding: '20px 10px',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '13px',
      fontWeight: '600',
      textAlign: 'center'
    },
    adminButton: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)'
    },
    advisorButton: {
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
    },
    studentButton: {
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(67, 233, 123, 0.4)'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg style={{width: '50px', height: '50px', color: '#667eea'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 style={styles.title}>ThesisTrack</h1>
          <p style={styles.subtitle}>Sistema de Gestion de Proyectos Academicos</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo Electronico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
              placeholder="usuario@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contrasena</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={styles.input}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
          </button>
        </form>

        <div style={styles.quickAccess}>
          <p style={styles.quickTitle}>Acceso Rapido - Desarrollo</p>
          <div style={styles.quickButtons}>
            <button
              onClick={() => quickLogin('admin@thesistrack.com', 'Admin123456')}
              disabled={loading}
              style={{...styles.quickButton, ...styles.adminButton}}
            >
              Admin
            </button>
            <button
              onClick={() => quickLogin('advisor@thesistrack.com', 'Advisor123456')}
              disabled={loading}
              style={{...styles.quickButton, ...styles.advisorButton}}
            >
              Asesor
            </button>
            <button
              onClick={() => quickLogin('student@thesistrack.com', 'Student123456')}
              disabled={loading}
              style={{...styles.quickButton, ...styles.studentButton}}
            >
              Estudiante
            </button>
          </div>
                </div>

        {/* Link de registro */}
        <div style={{
          borderTop: '1px solid #e5e7eb',
          padding: '20px 30px',
          textAlign: 'center',
          background: '#f9fafb'
        }}>
          <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '12px'}}>
            ¿No tienes cuenta?
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{
              width: '100%',
              padding: '12px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#667eea';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#667eea';
            }}
          >
            Crear Cuenta Nueva
          </button>
        </div>
      </div>
    </div>
  );
};