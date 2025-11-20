import { useState, useEffect } from 'react';
import { createProject } from '../../services/projectService';
import { getAllStudents, getAllAdvisors } from '../../services/userService';

export const CreateProjectForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamMembers: [],
    advisorId: ''
  });
  const [students, setStudents] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [studentsData, advisorsData] = await Promise.all([
        getAllStudents(),
        getAllAdvisors()
      ]);
      setStudents(studentsData);
      setAdvisors(advisorsData);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createProject({
        ...formData,
        milestones: [
          { name: 'Capítulo 1', completed: false, dueDate: null },
          { name: 'Capítulo 2', completed: false, dueDate: null },
          { name: 'Capítulo 3', completed: false, dueDate: null }
        ]
      });
      
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(studentId)
        ? prev.teamMembers.filter(id => id !== studentId)
        : [...prev.teamMembers, studentId]
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Crear Nuevo Proyecto</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título del Proyecto *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Sistema de Gestión de Bibliotecas"
            required
            minLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Descripción del proyecto..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Estudiantes *
          </label>
          <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
            {students.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay estudiantes disponibles</p>
            ) : (
              students.map((student) => (
                <div key={student.uid} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={student.uid}
                    checked={formData.teamMembers.includes(student.uid)}
                    onChange={() => toggleStudent(student.uid)}
                    className="mr-2"
                  />
                  <label htmlFor={student.uid} className="text-sm cursor-pointer">
                    {student.name} ({student.email})
                  </label>
                </div>
              ))
            )}
          </div>
          {formData.teamMembers.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {formData.teamMembers.length} estudiante(s) seleccionado(s)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Asesor *
          </label>
          <select
            value={formData.advisorId}
            onChange={(e) => setFormData({ ...formData, advisorId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Seleccionar --</option>
            {advisors.map((advisor) => (
              <option key={advisor.uid} value={advisor.uid}>
                {advisor.name} ({advisor.email})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creando...' : 'Crear Proyecto'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};