import React, { useState, useEffect } from 'react';
import { Users, Calendar, Scissors, DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import apiService from '../services/api';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, icon: Icon, color, change }) => {
  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{title}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
            {change && (
              <p className="text-sm mt-1" style={{ color: 'var(--success)' }}>
                <TrendingUp className="w-4 h-4 inline mr-1" />
                {change}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
            <Icon className="w-6 h-6" style={{ color: 'white' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topStylists, setTopStylists] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsData, appointmentsData] = await Promise.all([
        apiService.getDashboardStats(30),
        apiService.getAppointments({ limit: 5 })
      ]);

      setStats(statsData);
      setRecentAppointments(appointmentsData.appointments || []);
      
      // Simular datos de servicios y estilistas más populares
      setTopServices([
        { nombre: 'Corte básico', precio: 150, total_citas: 12 },
        { nombre: 'Mechas', precio: 300, total_citas: 8 },
        { nombre: 'Peinado', precio: 200, total_citas: 6 }
      ]);
      
      setTopStylists([
        { nombre: 'María González', email: 'maria@salon.com', ingresos_generados: 2500 },
        { nombre: 'Ana López', email: 'ana@salon.com', ingresos_generados: 1800 }
      ]);
      
    } catch (err) {
      setError('Error al cargar datos del dashboard');
      console.error('Error loading dashboard:', err);
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
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          ¡Hola, {user?.email?.split('@')[0]}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Aquí tienes un resumen de la actividad de hoy.
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Clientes"
          value={stats?.estadisticas_generales?.total_clientes || 0}
          icon={Users}
        />
        <StatCard
          title="Citas del Período"
          value={stats?.citas_periodo || 0}
          icon={Calendar}
        />
        <StatCard
          title="Servicios Activos"
          value={stats?.total_servicios || 0}
          icon={Scissors}
        />
        <StatCard
          title="Ingresos (30 días)"
          value={formatCurrency(stats?.ingresos_periodo || 0)}
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citas recientes */}
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Citas Recientes
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Confirmadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Pendientes</span>
                </div>
              </div>
            </div>

            {recentAppointments.length > 0 ? (
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--primary-light)' }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{appointment.cliente_nombre}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(appointment.fecha_inicio).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {formatCurrency(appointment.precio_total || 0)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {appointment.estado}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                No hay citas recientes
              </p>
            )}
          </div>
        </div>

        {/* Servicios más populares */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Servicios Más Populares
            </h3>
            
            <div className="space-y-3">
              {topServices.map((servicio, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--primary-light)' }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{servicio.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(servicio.precio)}</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                    {servicio.total_citas} citas
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estilistas destacados */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Estilistas Destacados
            </h3>
            
            <div className="space-y-3">
              {topStylists.map((estilista, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--primary-light)' }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{estilista.nombre || estilista.email}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(estilista.ingresos_generados)}</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                    Ingresos
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Resumen Rápido
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Promedio por cita:</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {formatCurrency(stats?.promedio_por_cita || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Tasa de ocupación:</span>
                <span className="font-semibold" style={{ color: 'var(--success)' }}>
                  {stats?.tasa_ocupacion || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Clientes nuevos:</span>
                <span className="font-semibold" style={{ color: 'var(--primary)' }}>
                  {stats?.clientes_nuevos || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;