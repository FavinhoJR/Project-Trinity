import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCog, Mail, Shield, Eye, EyeOff, Key } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import Modal from '../components/Common/Modal';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    role: 'estilista',
    activo: true
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, showInactive]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        q: searchTerm,
        activo: showInactive ? null : true,
        page: currentPage,
        limit: 10
      };

      const data = await apiService.getUsers(params);
      setUsers(data.users || []);
      setTotalPages(Math.ceil(data.total / 10));
      setTotalUsers(data.total);
    } catch (err) {
      setError('Error al cargar usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');

      if (editingUser) {
        await apiService.updateUser(editingUser.id, formData);
        setSuccess('Usuario actualizado correctamente');
      } else {
        await apiService.createUser(formData);
        setSuccess('Usuario creado correctamente');
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (err) {
      setError('Error al guardar usuario: ' + err.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre || '',
      email: user.email || '',
      role: user.role || 'estilista',
      activo: user.activo !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser.id) {
      setError('No puedes eliminar tu propio usuario');
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await apiService.deleteUser(userId);
      setSuccess('Usuario eliminado correctamente');
      loadUsers();
    } catch (err) {
      setError('Error al eliminar usuario: ' + err.message);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (userId === currentUser.id) {
      setError('No puedes desactivar tu propio usuario');
      return;
    }

    try {
      await apiService.updateUser(userId, { activo: !currentStatus });
      setSuccess(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      loadUsers();
    } catch (err) {
      setError('Error al cambiar estado del usuario: ' + err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setError('');

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      await apiService.updateUserPassword(editingUser.id, passwordData.newPassword);
      setSuccess('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError('Error al cambiar contraseña: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      role: 'estilista',
      activo: true
    });
  };

  const openModal = () => {
    resetForm();
    setEditingUser(null);
    setShowModal(true);
  };

  const openPasswordModal = (user) => {
    setEditingUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-GT');
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { backgroundColor: 'var(--error)', color: 'white', label: 'Administrador' },
      recepcion: { backgroundColor: 'var(--primary)', color: 'white', label: 'Recepción' },
      estilista: { backgroundColor: 'var(--success)', color: 'white', label: 'Estilista' }
    };

    const config = roleConfig[role] || { backgroundColor: 'var(--text-muted)', color: 'white', label: role };

    return (
      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: config.backgroundColor, color: config.color }}>
        {config.label}
      </span>
    );
  };

  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'recepcion', label: 'Recepción' },
    { value: 'estilista', label: 'Estilista' }
  ];

  return (
    <Layout title="Gestión de Usuarios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Usuarios</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gestiona los usuarios del sistema</p>
          </div>
          <button
            onClick={openModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
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
                    placeholder="Buscar usuarios..."
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
                  Total: {totalUsers} usuarios
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
      <div className="card">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner />
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                <UserCog className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <p>No se encontraron usuarios</p>
                <p className="text-sm">Crea tu primer usuario para comenzar</p>
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--primary-light)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {users.map((user) => (
                    <tr key={user.id} className={`hover:bg-opacity-50 ${!user.activo ? 'opacity-60' : ''}`} style={{ backgroundColor: 'var(--surface)' }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
                              <UserCog className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                              {user.nombre}
                            </div>
                            {user.id === currentUser.id && (
                              <div className="text-xs" style={{ color: 'var(--primary)' }}>(Tú)</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm" style={{ color: 'var(--text-muted)' }}>
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full" style={{ 
                          backgroundColor: user.activo ? 'var(--success)' : 'var(--error)', 
                          color: 'white' 
                        }}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            style={{ color: 'var(--primary)' }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--primary)'}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPasswordModal(user)}
                            style={{ color: 'var(--primary)' }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--primary)'}
                            title="Cambiar contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          {user.id !== currentUser.id && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(user.id, user.activo)}
                                style={{ color: user.activo ? 'var(--warning)' : 'var(--success)' }}
                                onMouseEnter={(e) => e.target.style.color = user.activo ? '#d97706' : '#22c55e'}
                                onMouseLeave={(e) => e.target.style.color = user.activo ? 'var(--warning)' : 'var(--success)'}}
                                title={user.activo ? "Desactivar" : "Activar"}
                              >
                                {user.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                style={{ color: 'var(--error)' }}
                                onMouseEnter={(e) => e.target.style.color = '#dc2626'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--error)'}
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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

        {/* User Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: maria@salon.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Rol *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input w-full"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
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
                  Usuario activo
                </label>
              </div>
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
                {editingUser ? 'Actualizar' : 'Crear'} Usuario
              </button>
            </div>
          </form>
        </Modal>

        {/* Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Cambiar Contraseña"
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Cambiando contraseña para: <strong style={{ color: 'var(--text)' }}>{editingUser?.nombre}</strong>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Nueva Contraseña *
              </label>
              <input
                type="password"
                required
                minLength="6"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="input w-full"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="input w-full"
                placeholder="Repite la contraseña"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Cambiar Contraseña
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Users;