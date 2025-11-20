import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/userService';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await registerUser(formData.email, formData.password, {
        name: formData.name,
        role: formData.role
      });

      setSuccess(true);
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
      maxWidth: '500px',
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
      marginBottom: '20px'
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
      padding: '12px 16px',
      fontSize: '15px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      transition: 'all 0.3s',
      outline: 'none',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '15px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      transition: 'all 0.3s',
      outline: 'none',
      boxSizing: 'border-box',
      backgroundColor: 'white'
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
    success: {
      background: '#d1fae5',
      border: '1px solid #a7f3d0',
      color: '#065f46',
      padding: '20px',
      borderRadius: '12px',
      fontSize: '14px',
      textAlign: 'center'
    },
    link: {
      textAlign: 'center',
      marginTop: '20px',
      fontSize: '14px',
      color: '#6b7280'
    },
    linkButton: {
      color: '#667eea',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none'
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.logo}>
              <svg style={{width: '50px', height: '50px', color: '#10b981'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 style={styles.title}>Registro Exitoso</h1>
          </div>
          
          <div style={{padding: '40px 30px'}}>
            <div style={styles.success}>
              <p style={{marginBottom: '10px', fontWeight: '600', fontSize: '16px'}}>
                {formData.role === 'advisor' 
                  ? '¡Cuenta creada! Pendiente de aprobación'
                  : '¡Cuenta creada exitosamente!'}
              </p>
              <p style={{marginBottom: '20px'}}>
                {formData.role === 'advisor'
                  ? 'Un administrador revisará tu solicitud pronto. Recibirás un correo cuando tu cuenta sea aprobada.'
                  : 'Ya puedes iniciar sesión con tus credenciales.'}
              </p>
              <button
                onClick={() => navigate('/login')}
                style={styles.button}
              >
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg style={{width: '50px', height: '50px', color: '#667eea'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 style={styles.title}>Crear Cuenta</h1>
          <p style={styles.subtitle}>Registrate en ThesisTrack</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre Completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={styles.input}
              placeholder="Tu nombre completo"
              required
              minLength={3}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo Electronico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={styles.input}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Tipo de Cuenta</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={styles.select}
              required
            >
              <option value="student">Estudiante</option>
              <option value="advisor">Asesor</option>
            </select>
            {formData.role === 'advisor' && (
              <p style={{fontSize: '12px', color: '#6b7280', marginTop: '6px'}}>
                Las cuentas de asesor requieren aprobación del administrador
              </p>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={styles.input}
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirmar Contraseña</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              style={styles.input}
              placeholder="Repite tu contraseña"
              required
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
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>

          <div style={styles.link}>
            Ya tienes cuenta?{' '}
            <a
              onClick={() => navigate('/login')}
              style={styles.linkButton}
            >
              Iniciar Sesion
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};