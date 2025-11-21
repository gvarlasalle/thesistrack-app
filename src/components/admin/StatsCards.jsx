export const StatsCards = ({ stats }) => {
  if (!stats) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2}}>
          <svg style={{width: '120px', height: '120px'}} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Total Usuarios</p>
        <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{stats.total}</p>
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
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Administradores</p>
        <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{stats.admin}</p>
      </div>

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
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Asesores</p>
        <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{stats.advisor}</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        boxShadow: '0 10px 40px rgba(67, 233, 123, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2}}>
          <svg style={{width: '120px', height: '120px'}} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <p style={{fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0'}}>Estudiantes</p>
        <p style={{fontSize: '42px', fontWeight: 'bold', margin: 0}}>{stats.student}</p>
      </div>
    </div>
  );
};