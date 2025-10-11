import { Router } from 'express';
const router = Router();

// GET /reports/dashboard - Estadísticas del dashboard
router.get('/dashboard', async (req, res) => {
  const db = req.app.get('db');
  const { periodo = '30' } = req.query; // días
  
  try {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));
    
    // Estadísticas generales
    const statsQuery = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM clientes) as total_clientes,
        (SELECT COUNT(*) FROM users WHERE role = 'estilista' AND activo = true) as total_estilistas,
        (SELECT COUNT(*) FROM servicios WHERE activo = true) as total_servicios,
        (SELECT COUNT(*) FROM citas WHERE fecha_inicio >= $1) as citas_periodo,
        (SELECT COUNT(*) FROM citas WHERE estado = 'pendiente') as citas_pendientes,
        (SELECT COUNT(*) FROM citas WHERE estado = 'confirmada') as citas_confirmadas,
        (SELECT COUNT(*) FROM citas WHERE estado = 'completada' AND fecha_inicio >= $1) as citas_completadas_periodo,
        (SELECT COUNT(*) FROM citas WHERE estado = 'cancelada' AND fecha_inicio >= $1) as citas_canceladas_periodo
    `, [fechaInicio]);
    
    // Ingresos del período
    const ingresosQuery = await db.query(`
      SELECT 
        COALESCE(SUM(s.precio), 0) as ingresos_totales,
        COALESCE(AVG(s.precio), 0) as ingreso_promedio_cita,
        COUNT(DISTINCT c.id) as citas_facturadas
      FROM citas c
      JOIN servicio_citas sc ON sc.cita_id = c.id
      JOIN servicios s ON s.id = sc.servicio_id
      WHERE c.estado = 'completada' AND c.fecha_inicio >= $1
    `, [fechaInicio]);
    
    // Top servicios
    const topServiciosQuery = await db.query(`
      SELECT s.nombre, s.precio, COUNT(sc.cita_id) as total_citas
      FROM servicios s
      JOIN servicio_citas sc ON sc.servicio_id = s.id
      JOIN citas c ON c.id = sc.cita_id
      WHERE c.estado = 'completada' AND c.fecha_inicio >= $1
      GROUP BY s.id, s.nombre, s.precio
      ORDER BY total_citas DESC
      LIMIT 5
    `, [fechaInicio]);
    
    // Top estilistas
    const topEstilistasQuery = await db.query(`
      SELECT u.nombre, u.email, COUNT(c.id) as total_citas,
             COALESCE(SUM(s.precio), 0) as ingresos_generados
      FROM users u
      JOIN citas c ON c.estilista_id = u.id
      LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
      LEFT JOIN servicios s ON s.id = sc.servicio_id
      WHERE u.role = 'estilista' AND c.estado = 'completada' AND c.fecha_inicio >= $1
      GROUP BY u.id, u.nombre, u.email
      ORDER BY total_citas DESC
      LIMIT 5
    `, [fechaInicio]);
    
    res.json({
      periodo_dias: parseInt(periodo),
      estadisticas_generales: statsQuery.rows[0],
      ingresos: ingresosQuery.rows[0],
      top_servicios: topServiciosQuery.rows,
      top_estilistas: topEstilistasQuery.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /reports/revenue - Reporte de ingresos
router.get('/revenue', async (req, res) => {
  const db = req.app.get('db');
  const { fecha_inicio, fecha_fin, estilista_id, agrupacion = 'dia' } = req.query;
  
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ 
      error: 'fecha_inicio y fecha_fin son requeridos (formato: YYYY-MM-DD)' 
    });
  }
  
  try {
    let groupBy = '';
    let selectDate = '';
    
    switch (agrupacion) {
      case 'dia':
        groupBy = 'DATE(c.fecha_inicio)';
        selectDate = 'DATE(c.fecha_inicio) as fecha';
        break;
      case 'semana':
        groupBy = 'DATE_TRUNC(\'week\', c.fecha_inicio)';
        selectDate = 'DATE_TRUNC(\'week\', c.fecha_inicio) as fecha';
        break;
      case 'mes':
        groupBy = 'DATE_TRUNC(\'month\', c.fecha_inicio)';
        selectDate = 'DATE_TRUNC(\'month\', c.fecha_inicio) as fecha';
        break;
      default:
        return res.status(400).json({ error: 'agrupacion debe ser: dia, semana o mes' });
    }
    
    let whereClause = 'WHERE c.estado = \'completada\' AND DATE(c.fecha_inicio) BETWEEN $1 AND $2';
    let params = [fecha_inicio, fecha_fin];
    
    if (estilista_id) {
      whereClause += ' AND c.estilista_id = $3';
      params.push(estilista_id);
    }
    
    const query = `
      SELECT ${selectDate},
             COUNT(DISTINCT c.id) as total_citas,
             COALESCE(SUM(s.precio), 0) as ingresos_totales,
             COALESCE(AVG(s.precio), 0) as ingreso_promedio
      FROM citas c
      JOIN servicio_citas sc ON sc.cita_id = c.id
      JOIN servicios s ON s.id = sc.servicio_id
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY fecha
    `;
    
    const result = await db.query(query, params);
    
    res.json({
      periodo: { fecha_inicio, fecha_fin },
      agrupacion,
      estilista_id: estilista_id || null,
      datos: result.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /reports/appointments - Reporte de citas
router.get('/appointments', async (req, res) => {
  const db = req.app.get('db');
  const { fecha_inicio, fecha_fin, estado, estilista_id } = req.query;
  
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ 
      error: 'fecha_inicio y fecha_fin son requeridos (formato: YYYY-MM-DD)' 
    });
  }
  
  try {
    let whereConditions = ['DATE(c.fecha_inicio) BETWEEN $1 AND $2'];
    let params = [fecha_inicio, fecha_fin];
    let paramCount = 2;
    
    if (estado) {
      paramCount++;
      whereConditions.push(`c.estado = $${paramCount}`);
      params.push(estado);
    }
    
    if (estilista_id) {
      paramCount++;
      whereConditions.push(`c.estilista_id = $${paramCount}`);
      params.push(estilista_id);
    }
    
    const whereClause = 'WHERE ' + whereConditions.join(' AND ');
    
    // Resumen por estado
    const resumenQuery = await db.query(`
      SELECT c.estado, COUNT(*) as total,
             COALESCE(SUM(s.precio), 0) as ingresos_potenciales
      FROM citas c
      LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
      LEFT JOIN servicios s ON s.id = sc.servicio_id
      ${whereClause}
      GROUP BY c.estado
      ORDER BY c.estado
    `, params);
    
    // Resumen por estilista
    const estilistasQuery = await db.query(`
      SELECT u.nombre, u.email, COUNT(c.id) as total_citas,
             COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as completadas,
             COUNT(CASE WHEN c.estado = 'cancelada' THEN 1 END) as canceladas,
             COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN s.precio END), 0) as ingresos_reales
      FROM users u
      JOIN citas c ON c.estilista_id = u.id
      LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
      LEFT JOIN servicios s ON s.id = sc.servicio_id
      ${whereClause}
      GROUP BY u.id, u.nombre, u.email
      ORDER BY total_citas DESC
    `, params);
    
    // Resumen por día
    const porDiaQuery = await db.query(`
      SELECT DATE(c.fecha_inicio) as fecha,
             COUNT(*) as total_citas,
             COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as completadas,
             COUNT(CASE WHEN c.estado = 'cancelada' THEN 1 END) as canceladas,
             COUNT(CASE WHEN c.estado IN ('pendiente', 'confirmada') THEN 1 END) as pendientes
      FROM citas c
      ${whereClause}
      GROUP BY DATE(c.fecha_inicio)
      ORDER BY fecha
    `, params);
    
    res.json({
      periodo: { fecha_inicio, fecha_fin },
      filtros: { estado: estado || null, estilista_id: estilista_id || null },
      resumen_por_estado: resumenQuery.rows,
      resumen_por_estilista: estilistasQuery.rows,
      resumen_por_dia: porDiaQuery.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /reports/clients - Reporte de clientes
router.get('/clients', async (req, res) => {
  const db = req.app.get('db');
  const { fecha_inicio, fecha_fin, incluir_nuevos = 'true' } = req.query;
  
  try {
    let params = [];
    let whereClause = '';
    
    if (fecha_inicio && fecha_fin) {
      whereClause = 'WHERE DATE(c.fecha_inicio) BETWEEN $1 AND $2';
      params = [fecha_inicio, fecha_fin];
    }
    
    // Clientes más frecuentes
    const clientesFrecuentesQuery = await db.query(`
      SELECT cl.nombre, cl.email, cl.telefono,
             COUNT(c.id) as total_citas,
             COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as citas_completadas,
             MAX(c.fecha_inicio) as ultima_cita,
             COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN s.precio END), 0) as total_gastado
      FROM clientes cl
      LEFT JOIN citas c ON c.cliente_id = cl.id
      LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
      LEFT JOIN servicios s ON s.id = sc.servicio_id
      ${whereClause}
      GROUP BY cl.id, cl.nombre, cl.email, cl.telefono
      HAVING COUNT(c.id) > 0
      ORDER BY total_citas DESC, total_gastado DESC
      LIMIT 20
    `, params);
    
    // Clientes nuevos (si se solicita)
    let clientesNuevos = [];
    if (incluir_nuevos === 'true' && fecha_inicio && fecha_fin) {
      const nuevosQuery = await db.query(`
        SELECT cl.nombre, cl.email, cl.telefono,
               MIN(c.fecha_inicio) as primera_cita,
               COUNT(c.id) as citas_en_periodo
        FROM clientes cl
        JOIN citas c ON c.cliente_id = cl.id
        WHERE DATE(c.fecha_inicio) BETWEEN $1 AND $2
        GROUP BY cl.id, cl.nombre, cl.email, cl.telefono
        HAVING MIN(c.fecha_inicio) BETWEEN $1::date AND $2::date
        ORDER BY primera_cita DESC
      `, params);
      
      clientesNuevos = nuevosQuery.rows;
    }
    
    res.json({
      periodo: fecha_inicio && fecha_fin ? { fecha_inicio, fecha_fin } : null,
      clientes_frecuentes: clientesFrecuentesQuery.rows,
      clientes_nuevos: clientesNuevos
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
