export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger' // 'danger', 'warning', 'info', 'success'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    const styles = {
      danger: {
        iconBg: '#fee2e2',
        iconColor: '#dc2626',
        buttonBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        buttonShadow: 'rgba(239, 68, 68, 0.4)',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '28px', height: '28px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      },
      warning: {
        iconBg: '#fef3c7',
        iconColor: '#d97706',
        buttonBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        buttonShadow: 'rgba(245, 158, 11, 0.4)',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '28px', height: '28px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      },
      info: {
        iconBg: '#dbeafe',
        iconColor: '#2563eb',
        buttonBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        buttonShadow: 'rgba(59, 130, 246, 0.4)',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '28px', height: '28px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      success: {
        iconBg: '#d1fae5',
        iconColor: '#059669',
        buttonBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        buttonShadow: 'rgba(16, 185, 129, 0.4)',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '28px', height: '28px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    };
    return styles[type] || styles.danger;
  };

  const typeStyles = getTypeStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icono */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: typeStyles.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          color: typeStyles.iconColor
        }}>
          {typeStyles.icon}
        </div>

        {/* Título */}
        <h3 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center',
          margin: '0 0 12px 0'
        }}>
          {title}
        </h3>

        {/* Mensaje */}
        <p style={{
          fontSize: '15px',
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: '1.6',
          margin: '0 0 32px 0'
        }}>
          {message}
        </p>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: 'white',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f9fafb';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: typeStyles.buttonBg,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: `0 4px 15px ${typeStyles.buttonShadow}`,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 6px 20px ${typeStyles.buttonShadow}`;
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 15px ${typeStyles.buttonShadow}`;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};