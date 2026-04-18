import React, { useEffect, useState } from 'react';
import {
  Users,
  CalendarRange,
  Scissors,
  DollarSign,
  Clock3,
  CheckCircle2,
  Ban,
  Star
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import StatusBadge from '../components/Common/StatusBadge';
import apiService from '../services/api';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';

const metricCards = [
  { key: 'clientes', label: 'Clientes activos', icon: Users },
  { key: 'citas', label: 'Citas del período', icon: CalendarRange },
  { key: 'servicios', label: 'Servicios activos', icon: Scissors },
  { key: 'ingresos', label: 'Ingresos cerrados', icon: DollarSign }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, appointmentsData] = await Promise.all([
          apiService.getDashboardStats(30),
          apiService.getAppointments({ limit: 6 })
        ]);

        setDashboardData(statsData);
        setRecentAppointments(appointmentsData.appointments || []);
      } catch (loadError) {
        setError(loadError.message || 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const general = dashboardData?.estadisticas_generales || {};
  const ingresos = dashboardData?.ingresos || {};
  const topServicios = dashboardData?.top_servicios || [];
  const topEstilistas = dashboardData?.top_estilistas || [];

  const metricValues = {
    clientes: general.total_clientes || 0,
    citas: general.citas_periodo || 0,
    servicios: general.total_servicios || 0,
    ingresos: formatCurrency(ingresos.ingresos_totales || 0)
  };

  const completionRate = Number(general.citas_periodo)
    ? Math.round((Number(general.citas_completadas_periodo || 0) / Number(general.citas_periodo || 1)) * 100)
    : 0;

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="loading-panel">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">TRINITY control center</p>
          <h2>Bienvenida, {user?.nombre || user?.email?.split('@')[0]}</h2>
          <p>
            Vista general del salón con ingresos reales, rendimiento operativo y seguimiento de citas
            sin depender de datos simulados.
          </p>
        </div>
        <div className="hero-banner__stats">
          <div>
            <span className="hero-banner__label">Citas completadas</span>
            <strong>{general.citas_completadas_periodo || 0}</strong>
          </div>
          <div>
            <span className="hero-banner__label">Tasa de cierre</span>
            <strong>{completionRate}%</strong>
          </div>
          <div>
            <span className="hero-banner__label">Ticket promedio</span>
            <strong>{formatCurrency(ingresos.ingreso_promedio_cita || 0)}</strong>
          </div>
        </div>
      </section>

      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}

      <section className="stats-grid">
        {metricCards.map(({ key, label, icon: Icon }) => (
          <article className="metric-card" key={key}>
            <div className="metric-card__icon">
              <Icon size={18} />
            </div>
            <div>
              <span className="metric-card__label">{label}</span>
              <strong className="metric-card__value">{metricValues[key]}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Agenda</p>
              <h3>Citas recientes</h3>
            </div>
            <div className="panel__summary">
              <Clock3 size={16} />
              <span>{recentAppointments.length} registros</span>
            </div>
          </div>

          {recentAppointments.length ? (
            <div className="list-stack">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="list-item">
                  <div>
                    <strong>{appointment.cliente_nombre}</strong>
                    <span>
                      {new Date(appointment.fecha_inicio).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <small>{appointment.servicios?.join(', ') || 'Sin servicios'}</small>
                  </div>
                  <div className="list-item__meta">
                    <StatusBadge status={appointment.estado} />
                    <strong>{formatCurrency(appointment.precio_total || 0)}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-panel">No hay citas recientes para mostrar.</div>
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Demanda</p>
              <h3>Servicios más solicitados</h3>
            </div>
            <div className="panel__summary">
              <Star size={16} />
              <span>Top 5</span>
            </div>
          </div>

          {topServicios.length ? (
            <div className="bar-list">
              {topServicios.map((service) => (
                <div className="bar-list__item" key={service.nombre}>
                  <div className="bar-list__row">
                    <strong>{service.nombre}</strong>
                    <span>{service.total_citas} citas</span>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${Math.max(service.porcentaje || 8, 8)}%` }} />
                  </div>
                  <small>{formatCurrency(service.ingresos || service.precio || 0)}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-panel">Todavía no hay suficientes citas completadas para este ranking.</div>
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Rendimiento</p>
              <h3>Estilistas destacados</h3>
            </div>
            <div className="panel__summary">
              <CheckCircle2 size={16} />
              <span>Por ingresos</span>
            </div>
          </div>

          {topEstilistas.length ? (
            <div className="list-stack">
              {topEstilistas.map((stylist) => (
                <div className="list-item" key={stylist.email}>
                  <div>
                    <strong>{stylist.nombre || stylist.email}</strong>
                    <span>{stylist.total_citas} citas completadas</span>
                  </div>
                  <div className="list-item__meta">
                    <strong>{formatCurrency(stylist.ingresos_generados || 0)}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-panel">Aún no hay estilistas con ingresos registrados en el período.</div>
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Salud operativa</p>
              <h3>Estado del sistema</h3>
            </div>
            <div className="panel__summary">
              <Ban size={16} />
              <span>Prioridades</span>
            </div>
          </div>

          <div className="check-grid">
            <div className="check-card">
              <span>Pendientes</span>
              <strong>{general.citas_pendientes || 0}</strong>
            </div>
            <div className="check-card">
              <span>Confirmadas</span>
              <strong>{general.citas_confirmadas || 0}</strong>
            </div>
            <div className="check-card">
              <span>Canceladas</span>
              <strong>{general.citas_canceladas_periodo || 0}</strong>
            </div>
            <div className="check-card">
              <span>Estilistas activos</span>
              <strong>{general.total_estilistas || 0}</strong>
            </div>
          </div>

          <div className="module-note">
            Inventario, ventas/POS y notificaciones ya tienen base estructural en la BD, pero siguen pendientes
            como módulos funcionales completos.
          </div>
        </article>
      </section>
    </Layout>
  );
};

export default Dashboard;
