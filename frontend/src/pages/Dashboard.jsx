import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Scissors, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import StatusBadge from '../components/Common/StatusBadge';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas del dashboard
      const dashboardStats = await apiService.getDashboardStats(30);
      setStats(dashboardStats);

      // Cargar citas recientes
      const appointmentsData = await apiService.getAppointments({ 
        limit: 5,
        ...(user.role === 'estilista' ? { estilista_id: user.id } : {})
      });
      setRecentAppointments(appointmentsData.appointments || []);

    } catch (err) {
      setError('Error al cargar los datos del dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className="text-sm text-green-600 mt-1">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                {change}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Dashboard">
      {error && (
        <Alert 
          type="error" 
          message={error} 
          onClose={() => setError('')}
          className="mb-6"
        />
      )}

      {/* Saludo personalizado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Hola, {user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-gray-600">
          Aquí tienes un resumen de la actividad de hoy.
        </p>
      </div>

      {/* Estadísticas principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Clientes"
            value={stats.estadisticas_generales?.total_clientes || 0}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Citas del Período"
            value={stats.estadisticas_generales?.citas_periodo || 0}
            icon={Calendar}
            color="bg-green-500"
          />
          <StatCard
            title="Servicios Activos"
            value={stats.estadisticas_generales?.total_servicios || 0}
            icon={Scissors}
            color="bg-purple-500"
          />
          <StatCard
            title="Ingresos (30 días)"
            value={`$${stats.ingresos?.ingresos_totales || 0}`}
            icon={DollarSign}
            color="bg-yellow-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de citas */}
        {stats && (
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Estado de Citas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">Pendientes</span>
                  </div>
                  <span className="font-semibold">
                    {stats.estadisticas_generales?.citas_pendientes || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Confirmadas</span>
                  </div>
                  <span className="font-semibold">
                    {stats.estadisticas_generales?.citas_confirmadas || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Completadas (30 días)</span>
                  </div>
                  <span className="font-semibold">
                    {stats.estadisticas_generales?.citas_completadas_periodo || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Canceladas (30 días)</span>
                  </div>
                  <span className="font-semibold">
                    {stats.estadisticas_generales?.citas_canceladas_periodo || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Citas recientes */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Citas Recientes</h3>
            {recentAppointments.length > 0 ? (
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{appointment.cliente_nombre}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(appointment.fecha_inicio).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <StatusBadge status={appointment.estado} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No hay citas recientes
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top servicios y estilistas */}
      {stats && (stats.top_servicios?.length > 0 || stats.top_estilistas?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Top servicios */}
          {stats.top_servicios?.length > 0 && (
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Servicios Más Populares</h3>
                <div className="space-y-3">
                  {stats.top_servicios.map((servicio, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{servicio.nombre}</p>
                        <p className="text-xs text-gray-500">${servicio.precio}</p>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {servicio.total_citas} citas
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top estilistas */}
          {stats.top_estilistas?.length > 0 && (
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Estilistas Destacados</h3>
                <div className="space-y-3">
                  {stats.top_estilistas.map((estilista, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{estilista.nombre || estilista.email}</p>
                        <p className="text-xs text-gray-500">${estilista.ingresos_generados}</p>
                      </div>
                      <span className="text-sm font-semibold text-purple-600">
                        {estilista.total_citas} citas
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
