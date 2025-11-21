import { useState } from 'react';
import { registerUser } from '../../services/userService';
import { createUserByAdmin } from '../../services/userService';

export const CreateUserForm = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
    const result = await createUserByAdmin({ 
        email: email.trim(),
        password,
        name: name.trim(),
        role,
        approved: true
    });

    console.log('Usuario creado:', result);
    alert('Usuario creado exitosamente');
    onSuccess();
    if (onRefresh) onRefresh();
    } catch (err) {
    console.error('Error creando usuario:', err);
    setError(err.message || 'Error al crear el usuario');
    }
  };

  return (
    <div style={{padding: '32px'}}>
      <div style={{marginBottom: '24px'}}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0'}}>
          Crear Nuevo Usuario
        </h2>
        <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
          El usuario será creado y aprobado automáticamente
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
              boxSizing: 'border-box'
            }}
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
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Contraseña */}
        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>
            Contraseña <span style={{color: '#ef4444'}}>*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          <p style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>
            Mínimo 6 caracteres
          </p>
        </div>

        {/* Rol */}
        <div style={{marginBottom: '24px'}}>
          <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>
            Rol <span style={{color: '#ef4444'}}>*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              background: 'white',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            <option value="student">Estudiante</option>
            <option value="advisor">Asesor</option>
            <option value="admin">Administrador</option>
          </select>
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
            marginBottom: '24px'
          }}>
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
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: loading ? '#d1d5db' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};