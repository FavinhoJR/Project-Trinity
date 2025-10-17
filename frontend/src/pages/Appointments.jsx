import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Clock, User } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import StatusBadge from '../components/Common/StatusBadge';
import Modal from '../components/Common/Modal';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';

const Appointments = () => {
  const { user, hasRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [filters, setFilters] = useState({
    estado: '',
    estilista_id: user.role === 'estilista' ? user.id : '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  const [formData, setFormData] = useState({
    cliente_id: '',
    estilista_id: user.role === 'estilista' ? user.id : '',
    servicio_ids: [],
    fecha_inicio: '',
    estado: 'pendiente',
    notas: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar citas con filtros
      const appointmentsData = await apiService.getAppointments(filters);
      setAppointments(appointmentsData.appointments || []);

      // Cargar datos para formularios (solo si puede crear/editar)
      if (hasRole(['admin', 'recepcion'])) {
        const [customersData, stylistsData, servicesData] = await Promise.all([
          apiService.getCustomers(),
          apiService.getStylists(),
          apiService.getServices()
        ]);
        
        setCustomers(customersData.customers || []);
        setStylists(stylistsData);
        setServices(servicesData.services || []);
      }
    } catch (err) {
      setError('Error al cargar las citas');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        await apiService.updateAppointment(editingAppointment.id, formData);
        setSuccess('Cita actualizada correctamente');
      } else {
        await apiService.createAppointment(formData);
        setSuccess('Cita creada correctamente');
      }
      
      setShowModal(false);
      setEditingAppointment(null);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message || 'Error al guardar la cita');
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      cliente_id: appointment.cliente_id,
      estilista_id: appointment.estilista_id,
      servicio_ids: appointment.servicios?.map(s => s.id) || [],
      fecha_inicio: new Date(appointment.fecha_inicio).toISOString().slice(0, 16),
      estado: appointment.estado,
      notas: appointment.notas || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      try {
        await apiService.deleteAppointment(id);
        setSuccess('Cita cancelada correctamente');
        loadData();
      } catch (err) {
        setError('Error al cancelar la cita');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      estilista_id: user.role === 'estilista' ? user.id : '',
      servicio_ids: [],
      fecha_inicio: '',
      estado: 'pendiente',
      notas: ''
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingAppointment(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <Layout title="Gestión de Citas">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Citas">
      {error && (
        <Alert 
          type="error" 
          message={error} 
          onClose={() => setError('')}
          className="mb-6"
        />
      )}

      {success && (
        <Alert 
          type="success" 
          message={success} 
          onClose={() => setSuccess('')}
          className="mb-6"
        />
      )}

      {/* Header con filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-600">Gestiona las citas del salón</p>
        </div>
        
        {hasRole(['admin', 'recepcion']) && (
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({...filters, estado: e.target.value})}
                className="select"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            {hasRole(['admin', 'recepcion']) && (
              <div>
                <label className="label">Estilista</label>
                <select
                  value={filters.estilista_id}
                  onChange={(e) => setFilters({...filters, estilista_id: e.target.value})}
                  className="select"
                >
                  <option value="">Todos</option>
                  {stylists.map(stylist => (
                    <option key={stylist.id} value={stylist.id}>
                      {stylist.nombre || stylist.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Fecha Desde</label>
              <input
                type="date"
                value={filters.fecha_desde}
                onChange={(e) => setFilters({...filters, fecha_desde: e.target.value})}
                className="input"
              />
            </div>

            <div>
              <label className="label">Fecha Hasta</label>
              <input
                type="date"
                value={filters.fecha_hasta}
                onChange={(e) => setFilters({...filters, fecha_hasta: e.target.value})}
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha y Hora</th>
                <th>Estilista</th>
                <th>Servicios</th>
                <th>Estado</th>
                <th>Total</th>
                {hasRole(['admin', 'recepcion']) && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div>
                        <div className="font-medium">{appointment.cliente_nombre}</div>
                        <div className="text-sm text-gray-500">{appointment.cliente_telefono}</div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm">
                            {new Date(appointment.fecha_inicio).toLocaleDateString('es-ES')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(appointment.fecha_inicio).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.estilista_email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {appointment.servicios?.join(', ') || 'Sin servicios'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={appointment.estado} />
                    </td>
                    <td>
                      <span className="font-medium">
                        {formatCurrency(appointment.precio_total || 0)}
                      </span>
                    </td>
                    {hasRole(['admin', 'recepcion']) && (
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="btn btn-sm btn-secondary"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(appointment.id)}
                            className="btn btn-sm btn-error"
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hasRole(['admin', 'recepcion']) ? 7 : 6} className="text-center py-8">
                    <div className="text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay citas que mostrar</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear/editar cita */}
      {hasRole(['admin', 'recepcion']) && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Cliente *</label>
                <select
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                  className="select"
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.nombre} - {customer.telefono}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Estilista *</label>
                <select
                  value={formData.estilista_id}
                  onChange={(e) => setFormData({...formData, estilista_id: e.target.value})}
                  className="select"
                  required
                >
                  <option value="">Seleccionar estilista</option>
                  {stylists.map(stylist => (
                    <option key={stylist.id} value={stylist.id}>
                      {stylist.nombre || stylist.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Fecha y Hora *</label>
                <input
                  type="datetime-local"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  className="select"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Servicios *</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                {services.map(service => (
                  <label key={service.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.servicio_ids.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            servicio_ids: [...formData.servicio_ids, service.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            servicio_ids: formData.servicio_ids.filter(id => id !== service.id)
                          });
                        }
                      }}
                    />
                    <span className="text-sm">
                      {service.nombre} ({formatCurrency(service.precio)})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                className="textarea"
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {editingAppointment ? 'Actualizar' : 'Crear'} Cita
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default Appointments;
