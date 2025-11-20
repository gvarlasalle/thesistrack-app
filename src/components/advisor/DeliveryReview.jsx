import { useState } from 'react';
import { approveDelivery, rejectDelivery } from '../../services/deliveryService';

export const DeliveryReview = ({ delivery, onReviewed }) => {
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      await approveDelivery(delivery.id, comments);
      onReviewed();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      setError('Debe proporcionar comentarios al rechazar');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await rejectDelivery(delivery.id, comments);
      onReviewed();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return timestamp.toDate().toLocaleString('es-PE');
    } catch (e) {
      return 'Fecha invalida';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
      border: '2px solid #e5e7eb',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'all 0.3s'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.borderColor = '#f093fb';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(240, 147, 251, 0.15)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.borderColor = '#e5e7eb';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
    }}>
      
      {/* Header Colapsable */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '20px 24px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isExpanded ? 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' : 'white',
          transition: 'all 0.3s'
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg style={{width: '24px', height: '24px', color: 'white'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
              {delivery.milestone}
            </h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px'}}>
              <p style={{fontSize: '13px', color: '#6b7280', margin: 0}}>
                Versión {delivery.version}
              </p>
              <span style={{color: '#d1d5db'}}>•</span>
              <p style={{fontSize: '13px', color: '#6b7280', margin: 0}}>
                {delivery.fileName}
              </p>
            </div>
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <span style={{
            padding: '6px 14px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            color: '#92400e',
            fontSize: '12px',
            fontWeight: '600',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
          }}>
            Pendiente
          </span>
          
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s'
          }}>
            <svg 
              style={{
                width: '20px', 
                height: '20px', 
                color: '#6b7280',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Contenido Expandible */}
      {isExpanded && (
        <div style={{
          padding: '24px',
          borderTop: '2px solid #f3f4f6',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {/* Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #f3f4f6'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                <svg style={{width: '18px', height: '18px', color: '#6b7280'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <p style={{fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0}}>TAMAÑO</p>
              </div>
              <p style={{fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0}}>
                {formatFileSize(delivery.fileSize)}
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #f3f4f6'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                <svg style={{width: '18px', height: '18px', color: '#6b7280'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p style={{fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0}}>FECHA DE SUBIDA</p>
              </div>
              <p style={{fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0}}>
                {formatDate(delivery.uploadedAt)}
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {delivery.fileUrl ? (
                  <a
                  href={delivery.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ver PDF
                </a>
              ) : (
                <span style={{fontSize: '13px', color: '#9ca3af'}}>No disponible</span>
              )}
            </div>
          </div>

          {/* Description */}
          {delivery.description && (
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #f3f4f6',
              marginBottom: '20px'
            }}>
              <p style={{fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '8px'}}>
                DESCRIPCIÓN DEL ESTUDIANTE
              </p>
              <p style={{fontSize: '14px', color: '#1f2937', margin: 0, lineHeight: '1.6'}}>
                {delivery.description}
              </p>
            </div>
          )}

          {/* Comments */}
          <div style={{marginBottom: '20px'}}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '10px'
            }}>
              <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Comentarios de Revision
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '100px',
                transition: 'border 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4facfe'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              rows={4}
              placeholder="Agregue sus comentarios sobre la entrega..."
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '2px solid #ef4444',
              color: '#991b1b',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '14px',
              marginBottom: '20px',
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

          {/* Action Buttons */}
          <div style={{display: 'flex', gap: '12px'}}>
            <button
              onClick={handleApprove}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                background: loading ? '#d1d5db' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
                  Procesando...
                </>
              ) : (
                <>
                  <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aprobar
                </>
              )}
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                background: loading ? '#d1d5db' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
                  Procesando...
                </>
              ) : (
                <>
                  <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Rechazar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
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