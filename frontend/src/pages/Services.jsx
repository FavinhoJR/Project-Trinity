import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Scissors, Clock, DollarSign, Eye, EyeOff } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import Modal from '../components/Common/Modal';
import apiService from '../services/api';
import { formatCurrency } from '../utils/currency';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion_min: '',
    categoria: '',
    activo: true
  });

  useEffect(() => {
    loadServices();
  }, [currentPage, searchTerm, showInactive]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const params = {
        q: searchTerm,
        activo: showInactive ? null : true,
        page: currentPage,
        limit: 10
      };

      const data = await apiService.getServices(params);
      setServices(data.services || []);
      setTotalPages(Math.ceil(data.total / 10));
      setTotalServices(data.total);
    } catch (err) {
      setError('Error al cargar servicios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');

      const serviceData = {
        ...formData,
        precio: parseFloat(formData.precio),
        duracion_min: parseInt(formData.duracion_min)
      };

      if (editingService) {
        await apiService.updateService(editingService.id, serviceData);
        setSuccess('Servicio actualizado correctamente');
      } else {
        await apiService.createService(serviceData);
        setSuccess('Servicio creado correctamente');
      }

      setShowModal(false);
      setEditingService(null);
      resetForm();
      loadServices();
    } catch (err) {
      setError('Error al guardar servicio: ' + err.message);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      nombre: service.nombre || '',
      descripcion: service.descripcion || '',
      precio: service.precio || '',
      duracion_min: service.duracion_min || '',
      categoria: service.categoria || '',
      activo: service.activo !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      await apiService.deleteService(serviceId);
      setSuccess('Servicio eliminado correctamente');
      loadServices();
    } catch (err) {
      setError('Error al eliminar servicio: ' + err.message);
    }
  };

  const handleToggleStatus = async (serviceId, currentStatus) => {
    try {
      await apiService.updateService(serviceId, { activo: !currentStatus });
      setSuccess(`Servicio ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      loadServices();
    } catch (err) {
      setError('Error al cambiar estado del servicio: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      duracion_min: '',
      categoria: '',
      activo: true
    });
  };

  const openModal = () => {
    resetForm();
    setEditingService(null);
    setShowModal(true);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const categories = [
    'Corte',
    'Peinado',
    'Coloración',
    'Tratamiento',
    'Manicure',
    'Pedicure',
    'Maquillaje',
    'Otros'
  ];

  return (
    <Layout title="Gestión de Servicios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Servicios</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gestiona los servicios que ofreces en el salón</p>
          </div>
          <button
            onClick={openModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Servicio
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Search and Filters */}
        <div className="card">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Buscar servicios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded"
                  />
                  Mostrar inactivos
                </label>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Total: {totalServices} servicios
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : services.length === 0 ? (
            <div className="col-span-full text-center p-8" style={{ color: 'var(--text-muted)' }}>
              <Scissors className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p>No se encontraron servicios</p>
              <p className="text-sm">Crea tu primer servicio para comenzar</p>
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className={`card ${!service.activo ? 'opacity-60' : ''}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
                        {service.nombre}
                      </h3>
                      {service.categoria && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {service.categoria}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(service)}
                        style={{ color: 'var(--primary)' }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--primary)'}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(service.id, service.activo)}
                        style={{ color: service.activo ? 'var(--warning)' : 'var(--success)' }}
                        onMouseEnter={(e) => e.target.style.color = service.activo ? '#d97706' : '#22c55e'}
                        onMouseLeave={(e) => e.target.style.color = service.activo ? 'var(--warning)' : 'var(--success)'}}
                        title={service.activo ? "Desactivar" : "Activar"}
                      >
                        {service.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        style={{ color: 'var(--error)' }}
                        onMouseEnter={(e) => e.target.style.color = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--error)'}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {service.descripcion && (
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {service.descripcion}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center" style={{ color: 'var(--text-muted)' }}>
                        <DollarSign className="w-4 h-4 mr-1" />
                        Precio:
                      </div>
                      <span className="font-semibold" style={{ color: 'var(--success)' }}>
                        {formatCurrency(service.precio)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-4 h-4 mr-1" />
                        Duración:
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        {formatDuration(service.duracion_min)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div style={{ color: 'var(--text-muted)' }}>
                        Citas realizadas:
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        {service.total_citas_realizadas || 0}
                      </span>
                    </div>
                  </div>

                  {!service.activo && (
                    <div className="mt-3 px-2 py-1 text-xs rounded-full text-center" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
                      Servicio inactivo
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-sm btn-outline disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-sm btn-outline disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: Corte de cabello"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Categoría
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Precio (GTQ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Duración (minutos) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duracion_min}
                  onChange={(e) => setFormData({ ...formData, duracion_min: e.target.value })}
                  className="input w-full"
                  placeholder="30"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Describe el servicio..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="activo" className="ml-2 text-sm" style={{ color: 'var(--text)' }}>
                Servicio activo
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingService ? 'Actualizar' : 'Crear'} Servicio
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Services;