import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Calendar, Users, TrendingUp, Download, Filter } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import apiService from '../services/api';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [clientsData, setClientsData] = useState([]);
  const [filters, setFilters] = useState({
    periodo: '30',
    fecha_desde: '',
    fecha_hasta: '',
    estilista_id: ''
  });

  useEffect(() => {
    loadDashboardStats();
  }, [filters.periodo]);

  useEffect(() => {
    if (filters.fecha_desde && filters.fecha_hasta) {
      loadDetailedReports();
    }
  }, [filters.fecha_desde, filters.fecha_hasta, filters.estilista_id]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboardStats(filters.periodo);
      setDashboardStats(data);
    } catch (err) {
      setError('Error al cargar estadísticas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedReports = async () => {
    try {
      const params = {
        fecha_desde: filters.fecha_desde,
        fecha_hasta: filters.fecha_hasta,
        estilista_id: filters.estilista_id
      };

      const [revenue, appointments, clients] = await Promise.all([
        apiService.getRevenueReport(params),
        apiService.getAppointmentsReport(params),
        apiService.getClientsReport(params)
      ]);

      setRevenueData(revenue);
      setAppointmentsData(appointments);
      setClientsData(clients);
    } catch (err) {
      setError('Error al cargar reportes detallados: ' + err.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-GT');
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', trend = null }) => (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}% vs período anterior
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Reportes y Estadísticas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
            <p className="text-gray-600">Análisis detallado del rendimiento del salón</p>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Filters */}
        <div className="card">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período Rápido
                </label>
                <select
                  value={filters.periodo}
                  onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}
                  className="input w-full"
                >
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                  <option value="365">Último año</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filters.fecha_desde}
                  onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filters.fecha_hasta}
                  onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estilista
                </label>
                <select
                  value={filters.estilista_id}
                  onChange={(e) => setFilters({ ...filters, estilista_id: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Todos los estilistas</option>
                  {/* Aquí se cargarían los estilistas */}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        {loading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : dashboardStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Clientes"
              value={dashboardStats.total_clientes || 0}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Estilistas Activos"
              value={dashboardStats.total_estilistas || 0}
              icon={Users}
              color="green"
            />
            <StatCard
              title="Servicios Disponibles"
              value={dashboardStats.total_servicios || 0}
              icon={BarChart3}
              color="purple"
            />
            <StatCard
              title="Citas del Período"
              value={dashboardStats.citas_periodo || 0}
              icon={Calendar}
              color="orange"
            />
          </div>
        ) : null}

        {/* Detailed Stats */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Citas Pendientes"
              value={dashboardStats.citas_pendientes || 0}
              icon={Calendar}
              color="yellow"
            />
            <StatCard
              title="Citas Confirmadas"
              value={dashboardStats.citas_confirmadas || 0}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="Citas Completadas"
              value={dashboardStats.citas_completadas_periodo || 0}
              icon={Calendar}
              color="green"
            />
            <StatCard
              title="Citas Canceladas"
              value={dashboardStats.citas_canceladas_periodo || 0}
              icon={Calendar}
              color="red"
            />
          </div>
        )}

        {/* Revenue Stats */}
        {dashboardStats?.ingresos_totales !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Ingresos Totales"
              value={formatCurrency(dashboardStats.ingresos_totales)}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Ingreso Promedio por Cita"
              value={formatCurrency(dashboardStats.ingreso_promedio_cita)}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              title="Citas Facturadas"
              value={dashboardStats.citas_facturadas || 0}
              icon={BarChart3}
              color="purple"
            />
          </div>
        )}

        {/* Top Services */}
        {dashboardStats?.top_servicios && dashboardStats.top_servicios.length > 0 && (
          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Servicios Más Populares</h3>
                <button
                  onClick={() => exportToCSV(dashboardStats.top_servicios, 'servicios_populares.csv')}
                  className="btn btn-sm btn-outline flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Citas Realizadas</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">% del Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardStats.top_servicios.map((service, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{service.nombre}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{service.total_citas}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{formatCurrency(service.ingresos)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{service.porcentaje}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Chart Placeholder */}
        {revenueData.length > 0 && (
          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ingresos por Día</h3>
                <button
                  onClick={() => exportToCSV(revenueData, 'ingresos_diarios.csv')}
                  className="btn btn-sm btn-outline flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Gráfico de ingresos (implementar con Chart.js)</p>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Chart Placeholder */}
        {appointmentsData.length > 0 && (
          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Citas por Estado</h3>
                <button
                  onClick={() => exportToCSV(appointmentsData, 'citas_por_estado.csv')}
                  className="btn btn-sm btn-outline flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Gráfico de citas (implementar con Chart.js)</p>
              </div>
            </div>
          </div>
        )}

        {/* Clients Analysis */}
        {clientsData.length > 0 && (
          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Análisis de Clientes</h3>
                <button
                  onClick={() => exportToCSV(clientsData, 'analisis_clientes.csv')}
                  className="btn btn-sm btn-outline flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Gastado</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Citas Realizadas</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Última Visita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clientsData.map((client, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{client.nombre}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{formatCurrency(client.total_gastado)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{client.total_citas}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{formatDate(client.ultima_visita)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
