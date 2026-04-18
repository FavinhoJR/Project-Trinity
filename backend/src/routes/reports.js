import { Router } from 'express';

const router = Router();

function resolveDateRange(query) {
  return {
    start: query.fecha_inicio || query.fecha_desde || null,
    end: query.fecha_fin || query.fecha_hasta || null
  };
}

router.get('/dashboard', async (req, res) => {
  const db = req.app.get('db');
  const periodo = Number.parseInt(req.query.periodo || '30', 10) || 30;
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - periodo);

  try {
    const statsQuery = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM clientes) AS total_clientes,
         (SELECT COUNT(*) FROM users WHERE role = 'estilista' AND activo = true) AS total_estilistas,
         (SELECT COUNT(*) FROM servicios WHERE activo = true) AS total_servicios,
         (SELECT COUNT(*) FROM citas WHERE fecha_inicio >= $1) AS citas_periodo,
         (SELECT COUNT(*) FROM citas WHERE estado = 'pendiente') AS citas_pendientes,
         (SELECT COUNT(*) FROM citas WHERE estado = 'confirmada') AS citas_confirmadas,
         (SELECT COUNT(*) FROM citas WHERE estado = 'completada' AND fecha_inicio >= $1) AS citas_completadas_periodo,
         (SELECT COUNT(*) FROM citas WHERE estado = 'cancelada' AND fecha_inicio >= $1) AS citas_canceladas_periodo`,
      [fechaInicio]
    );

    const ingresosQuery = await db.query(
      `SELECT
         COALESCE(SUM(s.precio), 0) AS ingresos_totales,
         COALESCE(AVG(cita_totales.total_cita), 0) AS ingreso_promedio_cita,
         COUNT(DISTINCT c.id) AS citas_facturadas
       FROM citas c
       JOIN servicio_citas sc ON sc.cita_id = c.id
       JOIN servicios s ON s.id = sc.servicio_id
       LEFT JOIN (
         SELECT sc2.cita_id, SUM(s2.precio) AS total_cita
         FROM servicio_citas sc2
         JOIN servicios s2 ON s2.id = sc2.servicio_id
         GROUP BY sc2.cita_id
       ) cita_totales ON cita_totales.cita_id = c.id
       WHERE c.estado = 'completada' AND c.fecha_inicio >= $1`,
      [fechaInicio]
    );

    const topServiciosQuery = await db.query(
      `SELECT
         s.nombre,
         s.precio,
         COUNT(sc.cita_id) AS total_citas,
         COALESCE(SUM(s.precio), 0) AS ingresos
       FROM servicios s
       JOIN servicio_citas sc ON sc.servicio_id = s.id
       JOIN citas c ON c.id = sc.cita_id
       WHERE c.estado = 'completada' AND c.fecha_inicio >= $1
       GROUP BY s.id, s.nombre, s.precio
       ORDER BY total_citas DESC, ingresos DESC
       LIMIT 5`,
      [fechaInicio]
    );

    const topEstilistasQuery = await db.query(
      `SELECT
         u.nombre,
         u.email,
         COUNT(DISTINCT c.id) AS total_citas,
         COALESCE(SUM(s.precio), 0) AS ingresos_generados
       FROM users u
       JOIN citas c ON c.estilista_id = u.id
       LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
       LEFT JOIN servicios s ON s.id = sc.servicio_id
       WHERE u.role = 'estilista' AND c.estado = 'completada' AND c.fecha_inicio >= $1
       GROUP BY u.id, u.nombre, u.email
       ORDER BY ingresos_generados DESC, total_citas DESC
       LIMIT 5`,
      [fechaInicio]
    );

    const totalIngresos = Number(ingresosQuery.rows[0].ingresos_totales) || 0;
    const topServicios = topServiciosQuery.rows.map((item) => ({
      ...item,
      porcentaje: totalIngresos > 0 ? Number(((Number(item.ingresos) / totalIngresos) * 100).toFixed(1)) : 0
    }));

    res.json({
      periodo_dias: periodo,
      estadisticas_generales: statsQuery.rows[0],
      ingresos: ingresosQuery.rows[0],
      top_servicios: topServicios,
      top_estilistas: topEstilistasQuery.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/revenue', async (req, res) => {
  const db = req.app.get('db');
  const { start, end } = resolveDateRange(req.query);
  const estilistaId = req.query.estilista_id || null;
  const agrupacion = req.query.agrupacion || 'dia';

  if (!start || !end) {
    return res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos (formato: YYYY-MM-DD)' });
  }

  let groupBy = '';
  let selectDate = '';

  switch (agrupacion) {
    case 'dia':
      groupBy = 'DATE(c.fecha_inicio)';
      selectDate = 'DATE(c.fecha_inicio) AS fecha';
      break;
    case 'semana':
      groupBy = "DATE_TRUNC('week', c.fecha_inicio)";
      selectDate = "DATE_TRUNC('week', c.fecha_inicio) AS fecha";
      break;
    case 'mes':
      groupBy = "DATE_TRUNC('month', c.fecha_inicio)";
      selectDate = "DATE_TRUNC('month', c.fecha_inicio) AS fecha";
      break;
    default:
      return res.status(400).json({ error: 'agrupacion debe ser: dia, semana o mes' });
  }

  let whereClause = "WHERE c.estado = 'completada' AND DATE(c.fecha_inicio) BETWEEN $1 AND $2";
  const params = [start, end];

  if (estilistaId) {
    params.push(estilistaId);
    whereClause += ` AND c.estilista_id = $${params.length}`;
  }

  try {
    const result = await db.query(
      `SELECT
         ${selectDate},
         COUNT(DISTINCT c.id) AS total_citas,
         COALESCE(SUM(s.precio), 0) AS ingresos_totales,
         COALESCE(AVG(s.precio), 0) AS ingreso_promedio
       FROM citas c
       JOIN servicio_citas sc ON sc.cita_id = c.id
       JOIN servicios s ON s.id = sc.servicio_id
       ${whereClause}
       GROUP BY ${groupBy}
       ORDER BY fecha`,
      params
    );

    res.json({
      periodo: { fecha_inicio: start, fecha_fin: end },
      agrupacion,
      estilista_id: estilistaId,
      datos: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/appointments', async (req, res) => {
  const db = req.app.get('db');
  const { start, end } = resolveDateRange(req.query);
  const estado = req.query.estado || null;
  const estilistaId = req.query.estilista_id || null;

  if (!start || !end) {
    return res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos (formato: YYYY-MM-DD)' });
  }

  const conditions = ['DATE(c.fecha_inicio) BETWEEN $1 AND $2'];
  const params = [start, end];

  if (estado) {
    params.push(estado);
    conditions.push(`c.estado = $${params.length}`);
  }

  if (estilistaId) {
    params.push(estilistaId);
    conditions.push(`c.estilista_id = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  try {
    const resumenQuery = await db.query(
      `SELECT
         c.estado,
         COUNT(DISTINCT c.id) AS total,
         COALESCE(SUM(s.precio), 0) AS ingresos_potenciales
       FROM citas c
       LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
       LEFT JOIN servicios s ON s.id = sc.servicio_id
       ${whereClause}
       GROUP BY c.estado
       ORDER BY c.estado`,
      params
    );

    const estilistasQuery = await db.query(
      `SELECT
         u.nombre,
         u.email,
         COUNT(DISTINCT c.id) AS total_citas,
         COUNT(DISTINCT c.id) FILTER (WHERE c.estado = 'completada') AS completadas,
         COUNT(DISTINCT c.id) FILTER (WHERE c.estado = 'cancelada') AS canceladas,
         COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN s.precio ELSE 0 END), 0) AS ingresos_reales
       FROM users u
       JOIN citas c ON c.estilista_id = u.id
       LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
       LEFT JOIN servicios s ON s.id = sc.servicio_id
       ${whereClause}
       GROUP BY u.id, u.nombre, u.email
       ORDER BY total_citas DESC, ingresos_reales DESC`,
      params
    );

    const porDiaQuery = await db.query(
      `SELECT
         DATE(c.fecha_inicio) AS fecha,
         COUNT(*) AS total_citas,
         COUNT(*) FILTER (WHERE c.estado = 'completada') AS completadas,
         COUNT(*) FILTER (WHERE c.estado = 'cancelada') AS canceladas,
         COUNT(*) FILTER (WHERE c.estado IN ('pendiente', 'confirmada')) AS pendientes
       FROM citas c
       ${whereClause}
       GROUP BY DATE(c.fecha_inicio)
       ORDER BY fecha`,
      params
    );

    res.json({
      periodo: { fecha_inicio: start, fecha_fin: end },
      filtros: { estado, estilista_id: estilistaId },
      resumen_por_estado: resumenQuery.rows,
      resumen_por_estilista: estilistasQuery.rows,
      resumen_por_dia: porDiaQuery.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/clients', async (req, res) => {
  const db = req.app.get('db');
  const { start, end } = resolveDateRange(req.query);
  const incluirNuevos = (req.query.incluir_nuevos || 'true') === 'true';

  const hasPeriod = Boolean(start && end);
  const whereClause = hasPeriod ? 'WHERE DATE(c.fecha_inicio) BETWEEN $1 AND $2' : '';
  const params = hasPeriod ? [start, end] : [];

  try {
    const clientesFrecuentesQuery = await db.query(
      `SELECT
         cl.nombre,
         cl.email,
         cl.telefono,
         COUNT(DISTINCT c.id) AS total_citas,
         COUNT(DISTINCT c.id) FILTER (WHERE c.estado = 'completada') AS citas_completadas,
         MAX(c.fecha_inicio) AS ultima_visita,
         COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN s.precio ELSE 0 END), 0) AS total_gastado
       FROM clientes cl
       LEFT JOIN citas c ON c.cliente_id = cl.id
       LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
       LEFT JOIN servicios s ON s.id = sc.servicio_id
       ${whereClause}
       GROUP BY cl.id, cl.nombre, cl.email, cl.telefono
       HAVING COUNT(DISTINCT c.id) > 0
       ORDER BY total_gastado DESC, total_citas DESC
       LIMIT 20`,
      params
    );

    let clientesNuevos = [];
    if (hasPeriod && incluirNuevos) {
      const nuevosQuery = await db.query(
        `SELECT
           cl.nombre,
           cl.email,
           cl.telefono,
           MIN(c.fecha_inicio) AS primera_cita,
           COUNT(DISTINCT c.id) AS citas_en_periodo
         FROM clientes cl
         JOIN citas c ON c.cliente_id = cl.id
         WHERE DATE(c.fecha_inicio) BETWEEN $1 AND $2
         GROUP BY cl.id, cl.nombre, cl.email, cl.telefono
         HAVING MIN(DATE(c.fecha_inicio)) BETWEEN $1::date AND $2::date
         ORDER BY primera_cita DESC`,
        params
      );

      clientesNuevos = nuevosQuery.rows;
    }

    res.json({
      periodo: hasPeriod ? { fecha_inicio: start, fecha_fin: end } : null,
      clientes_frecuentes: clientesFrecuentesQuery.rows,
      clientes_nuevos: clientesNuevos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
