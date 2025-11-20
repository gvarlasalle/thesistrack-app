import { useState, useEffect } from 'react';
import { getAllUsers, registerUser } from '../../services/userService';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerUser(
        formData.email,
        formData.password,
        {
          name: formData.name,
          role: formData.role
        }
      );

      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'student'
      });
      setShowCreateForm(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      advisor: 'bg-green-100 text-green-800',
      student: 'bg-blue-100 text-blue-800'
    };
    const labels = {
      admin: 'Administrador',
      advisor: 'Asesor',
      student: 'Estudiante'
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        background: role === 'admin' ? '#f3e8ff' : role === 'advisor' ? '#d1fae5' : '#dbeafe',
        color: role === 'admin' ? '#7c3aed' : role === 'advisor' ? '#059669' : '#2563eb'
      }}>
        {labels[role]}
      </span>
    );
  };

  const containerStyle = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '24px',
    marginTop: '24px'
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: '#e5e7eb',
    color: '#374151'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border 0.3s'
  };

  return (
    <div style={containerStyle}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937'}}>
          Gestion de Usuarios ({users.length})
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={primaryButtonStyle}
        >
          {showCreateForm ? 'Cancelar' : '+ Crear Usuario'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{
          background: '#f9fafb',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '2px solid #e5e7eb'
        }}>
          <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '20px'}}>
            Crear Nuevo Usuario
          </h3>
          
          <form onSubmit={handleSubmit} style={{display: 'grid', gap: '16px'}}>
            <div>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151'}}>
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={inputStyle}
                placeholder="Ej: Juan Perez"
                required
                minLength={3}
              />
            </div>

            <div>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151'}}>
                Correo Electronico *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={inputStyle}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>

            <div>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151'}}>
                Contrasena *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                style={inputStyle}
                placeholder="Minimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151'}}>
                Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                style={inputStyle}
                required
              >
                <option value="student">Estudiante</option>
                <option value="advisor">Asesor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{display: 'flex', gap: '12px', marginTop: '8px'}}>
              <button
                type="submit"
                disabled={loading}
                style={{...primaryButtonStyle, flex: 1, opacity: loading ? 0.6 : 1}}
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setError('');
                }}
                style={{...secondaryButtonStyle}}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      <div style={{overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '2px solid #e5e7eb'}}>
              <th style={{padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase'}}>Nombre</th>
              <th style={{padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase'}}>Email</th>
              <th style={{padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase'}}>Rol</th>
              <th style={{padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase'}}>Fecha de Registro</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} style={{borderBottom: '1px solid #f3f4f6'}}>
                <td style={{padding: '16px', fontSize: '14px', fontWeight: '500'}}>{user.name}</td>
                <td style={{padding: '16px', fontSize: '14px', color: '#6b7280'}}>{user.email}</td>
                <td style={{padding: '16px'}}>{getRoleBadge(user.role)}</td>
                <td style={{padding: '16px', fontSize: '14px', color: '#6b7280'}}>
                  {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString('es-PE') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div style={{textAlign: 'center', padding: '40px', color: '#9ca3af'}}>
          No hay usuarios registrados
        </div>
      )}
    </div>
  );
};