import { useState } from 'react';
import { createDelivery } from '../../services/deliveryService';
import { validatePDFFile, formatFileSize } from '../../utils/fileValidation';

export const UploadDeliveryForm = ({ projectId, milestone, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setFormData({ ...formData, file: null });
      setFileError('');
      return;
    }
    
    const validation = validatePDFFile(file);
    
    if (!validation.valid) {
      setFileError(validation.errors.join('. '));
      setFormData({ ...formData, file: null });
      e.target.value = '';
      return;
    }
    
    setFormData({ ...formData, file });
    setFileError('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      setError('Debe seleccionar un archivo PDF');
      return;
    }

    const validation = validatePDFFile(formData.file);
    if (!validation.valid) {
      setError(validation.errors.join('. '));
      return;
    }

    setUploading(true);
    setError('');

    try {
      await createDelivery({
        projectId,
        milestone,
        description: formData.description,
        file: formData.file
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error en subida:', err);
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      border: '2px solid #bfdbfe',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0
        }}>
          Subir Entrega - {milestone}
        </h3>
        <span style={{
          fontSize: '12px',
          background: '#dbeafe',
          color: '#1e40af',
          padding: '6px 12px',
          borderRadius: '20px',
          fontWeight: '600'
        }}>
          Solo PDF
        </span>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom: '20px'}}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Seleccionar Archivo PDF *
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
            accept=".pdf,application/pdf"
            disabled={uploading}
          />
          
          {fileError && (
            <div style={{
              marginTop: '8px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'start',
              gap: '8px'
            }}>
              <span style={{fontSize: '18px'}}>❌</span>
              <span>{fileError}</span>
            </div>
          )}
          
          {formData.file && !fileError && (
            <div style={{
              marginTop: '8px',
              background: '#d1fae5',
              border: '1px solid #6ee7b7',
              color: '#065f46',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'start',
              gap: '8px'
            }}>
              <span style={{fontSize: '18px'}}>✅</span>
              <div style={{flex: 1}}>
                <p style={{fontWeight: '600', margin: '0 0 4px 0'}}>{formData.file.name}</p>
                <p style={{fontSize: '12px', color: '#047857', margin: 0}}>
                  Tamaño: {formatFileSize(formData.file.size)}
                </p>
              </div>
            </div>
          )}
          
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: '8px 0 0 0'
          }}>
            • Solo archivos PDF • Tamaño máximo: 10MB
          </p>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Descripción (opcional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              minHeight: '80px',
              fontFamily: 'inherit'
            }}
            placeholder="Agregue una descripción de su entrega..."
            disabled={uploading}
          />
        </div>

        {error && (
          <div style={{
            marginBottom: '20px',
            background: '#fee2e2',
            borderLeft: '4px solid #ef4444',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'start',
            gap: '8px'
          }}>
            <span style={{fontSize: '18px'}}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div style={{display: 'flex', gap: '12px', paddingTop: '8px'}}>
          <button
            type="submit"
            disabled={uploading || !formData.file || !!fileError}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: uploading || !formData.file || !!fileError 
                ? '#9ca3af' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: uploading || !formData.file || !!fileError ? 'not-allowed' : 'pointer',
              boxShadow: uploading || !formData.file || !!fileError 
                ? 'none' 
                : '0 4px 15px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!uploading && formData.file && !fileError) {
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {uploading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Subiendo...
              </>
            ) : (
              <>
                <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Subir Entrega
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            style={{
              padding: '12px 24px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => {
              if (!uploading) {
                e.target.style.background = '#d1d5db';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#e5e7eb';
            }}
          >
            Cancelar
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