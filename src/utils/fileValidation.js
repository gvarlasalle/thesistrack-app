// Validación de archivos PDF
export const validatePDFFile = (file) => {
  const errors = [];
  
  // Validar que exista el archivo
  if (!file) {
    errors.push('Debe seleccionar un archivo');
    return { valid: false, errors };
  }
  
  // Validar tipo de archivo (solo PDF)
  const validTypes = ['application/pdf'];
  if (!validTypes.includes(file.type)) {
    errors.push('Solo se permiten archivos PDF');
  }
  
  // Validar extensión
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    errors.push('El archivo debe tener extensión .pdf');
  }
  
  // Validar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB en bytes
  if (file.size > maxSize) {
    errors.push('El archivo no puede superar 10MB');
  }
  
  // Validar tamaño mínimo (al menos 1KB)
  if (file.size < 1024) {
    errors.push('El archivo es demasiado pequeño');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};