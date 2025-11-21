import { useState } from 'react';
import { updateUser } from '../../services/userService';

export const EditUserForm = ({ user, onSuccess, onCancel }) => {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError('El nombre y el email son requeridos');
      return;
    }

    if (password && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = user.uid || user.id;
      
      // Actualizar solo nombre y email en Firestore
      const updateData = {
        name: name.trim(),
        email: email.trim()
      };

      await updateUser(userId, updateData);
      
      alert('Usuario actualizado exitosamente');
      onSuccess();
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      setError(err.message || 'Error al actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{padding: '32px'}}>
      <div style={{marginBottom: '24px'}}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0'}}>
          Editar Usuario
        </h2>
        <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
          Actualiza el nombre y correo del usuario
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>
            Nombre Completo <span style={{color: '#ef4444'}}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              boxSizing: 'border-box',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Email */}
        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>
            Correo Electrónico <span style={{color: '#ef4444'}}>*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              boxSizing: 'border-box',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{fontSize: '12px', color: '#f59e0b', marginTop: '4px'}}>
            ⚠️ El email se actualiza en la base de datos, pero no en Firebase Authentication
          </p>
        </div>

        {/* Rol (Solo lectura) */}
        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>
            Rol (no modificable)
          </label>
          <div style={{
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '10px',
            fontSize: '14px',
            background: '#f9fafb',
            color: '#6b7280'
          }}>
            {user.role === 'admin' ? 'Administrador' : user.role === 'advisor' ? 'Asesor' : 'Estudiante'}
          </div>
        </div>

        {/* Nueva Contraseña (Deshabilitado) */}
        <div style={{marginBottom: '24px'}}>
          <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px'}}>
            Nueva Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="No disponible - requiere backend"
            disabled={true}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              boxSizing: 'border-box',
              background: '#f3f4f6',
              color: '#9ca3af',
              cursor: 'not-allowed'
            }}
          />
          <p style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>
            💡 El cambio de contraseña requiere Firebase Admin SDK (backend)
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fee2e2',
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
        <div style={{display: 'flex', gap: '12px'}}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
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
              flex: 1,
              padding: '12px',
              background: loading ? '#d1d5db' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
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
              'Guardar Cambios'
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