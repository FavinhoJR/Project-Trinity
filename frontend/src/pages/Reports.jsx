import React, { useEffect, useState } from 'react';
import { Download, Filter, TrendingUp, Users, CalendarRange, DollarSign } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';
import apiService from '../services/api';
import { formatCurrency } from '../utils/currency';

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function exportToCSV(data, filename) {
  if (!data?.length) {
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const Reports = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [appointmentsData, setAppointmentsData] = useState(null);
  const [clientsData, setClientsData] = useState(null);
  const [stylists, setStylists] = useState([]);
  const [filters, setFilters] = useState({
    periodo: '30',
    fecha_inicio: toDateInputValue(thirtyDaysAgo),
    fecha_fin: toDateInputValue(today),
    estilista_id: ''
  });

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const [stats, stylistsData] = await Promise.all([
          apiService.getDashboardStats(filters.periodo),
          apiService.getStylists()
        ]);

        setDashboardStats(stats);
        setStylists(stylistsData || []);
      } catch (loadError) {
        setError(loadError.message || 'No se pudieron cargar los reportes');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, [filters.periodo]);

  useEffect(() => {
    const loadDetailedReports = async () => {
      try {
        const params = {
          fecha_inicio: filters.fecha_inicio,
          fecha_fin: filters.fecha_fin,
          estilista_id: filters.estilista_id || undefined
        };

        const [revenue, appointments, clients] = await Promise.all([
          apiService.getRevenueReport(params),
          apiService.getAppointmentsReport(params),
          apiService.getClientsReport(params)
        ]);

        setRevenueData(revenue?.datos || []);
        setAppointmentsData(appointments);
        setClientsData(clients);
      } catch (loadError) {
        setError(loadError.message || 'No se pudieron cargar los reportes detallados');
      }
    };

    loadDetailedReports();
  }, [filters.fecha_inicio, filters.fecha_fin, filters.estilista_id]);

  const general = dashboardStats?.estadisticas_generales || {};
  const ingresos = dashboardStats?.ingresos || {};
  const topServicios = dashboardStats?.top_servicios || [];
  const frequentClients = clientsData?.clientes_frecuentes || [];
  const appointmentStatusRows = appointmentsData?.resumen_por_estado || [];

  const overviewCards = [
    {
      label: 'Ingresos cerrados',
      value: formatCurrency(ingresos.ingresos_totales || 0),
      icon: DollarSign
    },
    {
      label: 'Clientes activos',
      value: general.total_clientes || 0,
      icon: Users
    },
    {
      label: 'Citas período',
      value: general.citas_periodo || 0,
      icon: CalendarRange
    },
    {
      label: 'Ticket promedio',
      value: formatCurrency(ingresos.ingreso_promedio_cita || 0),
      icon: TrendingUp
    }
  ];

  return (
    <Layout title="Reportes y Estadísticas">
      <section className="hero-banner reports-hero">
        <div>
          <p className="eyebrow">Análisis y control</p>
          <h2>Reportes operativos con datos reales</h2>
          <p>
            Seguimiento de ingresos, comportamiento de clientes y productividad del equipo con filtros
            listos para trabajo académico y demostraciones.
          </p>
        </div>
        <div className="hero-banner__stats">
          <div>
            <span className="hero-banner__label">Período rápido</span>
            <strong>{filters.periodo} días</strong>
          </div>
          <div>
            <span className="hero-banner__label">Citas facturadas</span>
            <strong>{ingresos.citas_facturadas || 0}</strong>
          </div>
          <div>
            <span className="hero-banner__label">Top servicio</span>
            <strong>{topServicios[0]?.nombre || 'Sin datos'}</strong>
          </div>
        </div>
      </section>

      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}

      <section className="panel filters-panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Filtros</p>
            <h3>Rango y enfoque</h3>
          </div>
          <div className="panel__summary">
            <Filter size={16} />
            <span>Ajusta el período del informe</span>
          </div>
        </div>

        <div className="filters-grid">
          <label className="form-group">
            <span className="label">Período rápido</span>
            <select
              className="select"
              value={filters.periodo}
              onChange={(event) => setFilters((current) => ({ ...current, periodo: event.target.value }))}
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="365">Último año</option>
            </select>
          </label>

          <label className="form-group">
            <span className="label">Fecha inicio</span>
            <input
              className="input"
              type="date"
              value={filters.fecha_inicio}
              onChange={(event) => setFilters((current) => ({ ...current, fecha_inicio: event.target.value }))}
            />
          </label>

          <label className="form-group">
            <span className="label">Fecha fin</span>
            <input
              className="input"
              type="date"
              value={filters.fecha_fin}
              onChange={(event) => setFilters((current) => ({ ...current, fecha_fin: event.target.value }))}
            />
          </label>

          <label className="form-group">
            <span className="label">Estilista</span>
            <select
              className="select"
              value={filters.estilista_id}
              onChange={(event) => setFilters((current) => ({ ...current, estilista_id: event.target.value }))}
            >
              <option value="">Todos</option>
              {stylists.map((stylist) => (
                <option key={stylist.id} value={stylist.id}>
                  {stylist.nombre || stylist.email}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="loading-panel">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <section className="stats-grid">
            {overviewCards.map((card) => {
              const Icon = card.icon;
              return (
                <article className="metric-card" key={card.label}>
                  <div className="metric-card__icon">
                    <Icon size={18} />
                  </div>
                  <div>
                    <span className="metric-card__label">{card.label}</span>
                    <strong className="metric-card__value">{card.value}</strong>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="dashboard-grid">
            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Ingresos</p>
                  <h3>Evolución del rango</h3>
                </div>
                <button className="btn btn-secondary" onClick={() => exportToCSV(revenueData, 'reporte_ingresos.csv')}>
                  <Download size={16} />
                  Exportar
                </button>
              </div>

              {revenueData.length ? (
                <div className="bar-list">
                  {revenueData.map((row) => (
                    <div className="bar-list__item" key={row.fecha}>
                      <div className="bar-list__row">
                        <strong>{new Date(row.fecha).toLocaleDateString('es-MX')}</strong>
                        <span>{row.total_citas} citas</span>
                      </div>
                      <div className="bar-track">
                        <span
                          style={{
                            width: `${Math.max(
                              (Number(row.ingresos_totales || 0) /
                                Math.max(...revenueData.map((item) => Number(item.ingresos_totales || 0)), 1)) *
                                100,
                              6
                            )}%`
                          }}
                        />
                      </div>
                      <small>{formatCurrency(row.ingresos_totales || 0)}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel">No hay ingresos cerrados en el rango seleccionado.</div>
              )}
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Agenda</p>
                  <h3>Distribución por estado</h3>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => exportToCSV(appointmentStatusRows, 'reporte_estados_citas.csv')}
                >
                  <Download size={16} />
                  Exportar
                </button>
              </div>

              {appointmentStatusRows.length ? (
                <div className="list-stack">
                  {appointmentStatusRows.map((row) => (
                    <div className="list-item" key={row.estado}>
                      <div>
                        <strong>{row.estado}</strong>
                        <span>{row.total} citas</span>
                      </div>
                      <div className="list-item__meta">
                        <strong>{formatCurrency(row.ingresos_potenciales || 0)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel">No hay datos de citas para este rango.</div>
              )}
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Servicios</p>
                  <h3>Top del período</h3>
                </div>
                <button className="btn btn-secondary" onClick={() => exportToCSV(topServicios, 'top_servicios.csv')}>
                  <Download size={16} />
                  Exportar
                </button>
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
                      <small>{formatCurrency(service.ingresos || 0)}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel">Todavía no hay suficientes servicios completados para rankear.</div>
              )}
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Clientes</p>
                  <h3>Clientes frecuentes</h3>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => exportToCSV(frequentClients, 'clientes_frecuentes.csv')}
                >
                  <Download size={16} />
                  Exportar
                </button>
              </div>

              {frequentClients.length ? (
                <div className="table-shell">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Citas</th>
                        <th>Total gastado</th>
                        <th>Última visita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frequentClients.slice(0, 8).map((client) => (
                        <tr key={`${client.nombre}-${client.email || 'sin-email'}`}>
                          <td>{client.nombre}</td>
                          <td>{client.total_citas}</td>
                          <td>{formatCurrency(client.total_gastado || 0)}</td>
                          <td>
                            {client.ultima_visita
                              ? new Date(client.ultima_visita).toLocaleDateString('es-MX')
                              : 'Sin visitas'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-panel">No hay clientes con historial en este rango.</div>
              )}
            </article>
          </section>
        </>
      )}
    </Layout>
  );
};

export default Reports;
