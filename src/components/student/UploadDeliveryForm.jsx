import { useState } from 'react';
import { createDelivery } from '../../services/deliveryService';

export const UploadDeliveryForm = ({ projectId, milestone, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('Archivo seleccionado:', file);
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede superar 10MB');
        return;
      }
      setFormData({ ...formData, file });
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== INICIANDO SUBIDA ===');
    console.log('ProjectId:', projectId);
    console.log('Milestone:', milestone);
    console.log('Archivo:', formData.file);
    console.log('Descripcion:', formData.description);
    
    if (!formData.file) {
      console.error('No hay archivo seleccionado');
      setError('Debe seleccionar un archivo');
      return;
    }

    setUploading(true);
    setError('');

    try {
      console.log('Llamando a createDelivery...');
      
      const result = await createDelivery({
        projectId,
        milestone,
        description: formData.description,
        file: formData.file
      });
      
      console.log('=== SUBIDA EXITOSA ===', result);
      onSuccess();
    } catch (err) {
      console.error('=== ERROR EN SUBIDA ===', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">Subir Entrega - {milestone}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Archivo (Max 10MB)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            accept=".pdf,.doc,.docx"
            disabled={uploading}
          />
          {formData.file && (
            <p className="text-sm text-gray-600 mt-2">
              Archivo seleccionado: {formData.file.name} ({(formData.file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripcion (opcional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Agregue una descripcion de la entrega..."
            disabled={uploading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {uploading ? 'Subiendo...' : 'Subir Entrega'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};