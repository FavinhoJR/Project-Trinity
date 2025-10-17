import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, User } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import Modal from '../components/Common/Modal';
import apiService from '../services/api';
import { formatCurrency } from '../utils/currency';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    fecha_nacimiento: '',
    direccion: '',
    notas: ''
  });

  useEffect(() => {
    loadCustomers();
  }, [currentPage, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        q: searchTerm,
        page: currentPage,
        limit: 10
      };
      
      const data = await apiService.getCustomers(params);
      setCustomers(data.customers || []);
      setTotalPages(Math.ceil(data.total / 10));
      setTotalCustomers(data.total);
    } catch (err) {
      setError('Error al cargar clientes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');

      if (editingCustomer) {
        await apiService.updateCustomer(editingCustomer.id, formData);
        setSuccess('Cliente actualizado correctamente');
      } else {
        await apiService.createCustomer(formData);
        setSuccess('Cliente creado correctamente');
      }

      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (err) {
      setError('Error al guardar cliente: ' + err.message);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      nombre: customer.nombre || '',
      telefono: customer.telefono || '',
      email: customer.email || '',
      fecha_nacimiento: customer.fecha_nacimiento || '',
      direccion: customer.direccion || '',
      notas: customer.notas || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      await apiService.deleteCustomer(customerId);
      setSuccess('Cliente eliminado correctamente');
      loadCustomers();
    } catch (err) {
      setError('Error al eliminar cliente: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      fecha_nacimiento: '',
      direccion: '',
      notas: ''
    });
  };

  const openModal = () => {
    resetForm();
    setEditingCustomer(null);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-GT');
  };

  return (
    <Layout title="Gestión de Clientes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Clientes</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gestiona la información de tus clientes</p>
          </div>
          <button
            onClick={openModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Search and Stats */}
        <div className="card">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Total: {totalCustomers} clientes
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="card">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner />
              </div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                <User className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <p>No se encontraron clientes</p>
                <p className="text-sm">Crea tu primer cliente para comenzar</p>
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--primary-light)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Total Gastado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-opacity-50" style={{ backgroundColor: 'var(--surface)' }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                            {customer.nombre}
                          </div>
                          {customer.fecha_nacimiento && (
                            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              Cumpleaños: {formatDate(customer.fecha_nacimiento)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {customer.telefono && (
                            <div className="flex items-center text-sm" style={{ color: 'var(--text-muted)' }}>
                              <Phone className="w-3 h-3 mr-1" />
                              {customer.telefono}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center text-sm" style={{ color: 'var(--text-muted)' }}>
                              <Mail className="w-3 h-3 mr-1" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--success)' }}>
                        {formatCurrency(customer.total_gastado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            style={{ color: 'var(--primary)' }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--primary)'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            style={{ color: 'var(--error)' }}
                            onMouseEnter={(e) => e.target.style.color = '#dc2626'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--error)'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
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
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: María González"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: 5555-1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: maria@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="input w-full"
                placeholder="Ej: Zona 10, Ciudad de Guatemala"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Información adicional sobre el cliente..."
              />
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
                {editingCustomer ? 'Actualizar' : 'Crear'} Cliente
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Customers;