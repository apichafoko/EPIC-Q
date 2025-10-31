/**
 * Script para probar las nuevas APIs de Fase 2
 * Ejecutar con: node scripts/test-new-apis.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';

// Obtener el token de auth desde las cookies o variable de entorno
const getAuthToken = () => {
  // En un script real, necesitarías obtener el token de una sesión activa
  // Por ahora, asumimos que está en una variable de entorno o cookie
  return process.env.AUTH_TOKEN || '';
};

const testApi = async (name, method, url, body = null, token = null) => {
  console.log(`\n🧪 Probando: ${name}`);
  console.log(`   ${method} ${url}`);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Cookie: `auth-token=${token}` }),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📦 Response:`, JSON.stringify(data, null, 2).slice(0, 200));
      return { success: true, data };
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   ⚠️  Error:`, data.error || data.message);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`   ❌ Error de conexión:`, error.message);
    return { success: false, error: error.message };
  }
};

const runTests = async () => {
  console.log('🚀 Iniciando pruebas de APIs de Fase 2\n');
  console.log('='.repeat(60));
  
  // Verificar que el servidor esté disponible
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      console.log('⚠️  ADVERTENCIA: El servidor no está corriendo en', BASE_URL);
      console.log('   Inicia el servidor con: npm run dev');
      console.log('   O ajusta BASE_URL si el servidor está en otra URL\n');
    }
  } catch (e) {
    console.log('⚠️  ADVERTENCIA: No se pudo conectar al servidor');
    console.log('   Asegúrate de que el servidor esté corriendo en', BASE_URL);
    console.log('   Inicia con: npm run dev\n');
  }

  const token = getAuthToken();
  if (!token) {
    console.log('⚠️  No se encontró token de autenticación.');
    console.log('   Establece AUTH_TOKEN como variable de entorno o');
    console.log('   modifica el script para obtener el token de las cookies.');
    console.log('   Ejemplo: AUTH_TOKEN=tu-token npm run test:new-apis\n');
  }

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // 1. Probar API de Reportes Programados
  console.log('\n📊 1. REPORTES PROGRAMADOS');
  console.log('-'.repeat(60));

  // GET - Listar reportes programados
  const listReports = await testApi(
    'Listar reportes programados',
    'GET',
    `${BASE_URL}/api/reports/schedule`,
    null,
    token
  );
  if (listReports.success) results.passed++;
  else if (listReports.error === 'Unauthorized') results.skipped++;
  else results.failed++;

  // POST - Crear un reporte programado (ejemplo)
  const createReport = await testApi(
    'Crear reporte programado',
    'POST',
    `${BASE_URL}/api/reports/schedule`,
    {
      name: 'Reporte de Prueba',
      description: 'Reporte de prueba generado automáticamente',
      reportType: 'executive_summary',
      frequency: 'daily',
      format: 'pdf',
      recipients: ['admin@example.com'],
    },
    token
  );
  if (createReport.success) {
    results.passed++;
    const reportId = createReport.data?.data?.id;

    if (reportId) {
      // GET - Obtener reporte específico
      await testApi(
        'Obtener reporte específico',
        'GET',
        `${BASE_URL}/api/reports/schedule/${reportId}`,
        null,
        token
      );

      // GET - Obtener historial
      await testApi(
        'Obtener historial de reporte',
        'GET',
        `${BASE_URL}/api/reports/schedule/${reportId}/history`,
        null,
        token
      );
    }
  } else if (createReport.error === 'Unauthorized') {
    results.skipped++;
  } else {
    results.failed++;
  }

  // 2. Probar API de Analytics
  console.log('\n📈 2. ANALYTICS');
  console.log('-'.repeat(60));

  const analyticsTests = [
    { metric: 'case_trends', name: 'Tendencias de casos' },
    { metric: 'completion_trends', name: 'Tendencias de completitud' },
    { metric: 'activity_heatmap', name: 'Heatmap de actividad' },
    { metric: 'bubble_chart', name: 'Gráfico de burbujas' },
    { metric: 'coordinator_performance', name: 'Performance de coordinadores' },
    {
      metric: 'geographic_distribution',
      name: 'Distribución geográfica',
      params: 'distributionType=cases',
    },
  ];

  for (const test of analyticsTests) {
    const url = `${BASE_URL}/api/analytics?metric=${test.metric}${
      test.params ? `&${test.params}` : ''
    }`;
    const result = await testApi(test.name, 'GET', url, null, token);
    if (result.success) results.passed++;
    else if (result.error === 'Unauthorized') results.skipped++;
    else results.failed++;
  }

  // Predicciones
  const predictions = await testApi(
    'Predicciones de casos',
    'GET',
    `${BASE_URL}/api/analytics?metric=predictions&predictionType=cases&days=30`,
    null,
    token
  );
  if (predictions.success) results.passed++;
  else if (predictions.error === 'Unauthorized') results.skipped++;
  else results.failed++;

  // 3. Probar API de Exportación
  console.log('\n📤 3. EXPORTACIÓN');
  console.log('-'.repeat(60));

  const exportTests = [
    { reportType: 'executive_summary', format: 'csv' },
    { reportType: 'hospital_status', format: 'csv' },
    { reportType: 'province_distribution', format: 'csv' },
  ];

  for (const test of exportTests) {
    const result = await testApi(
      `Exportar ${test.reportType} en ${test.format}`,
      'POST',
      `${BASE_URL}/api/export`,
      {
        reportType: test.reportType,
        format: test.format,
      },
      token
    );
    if (result.success) results.passed++;
    else if (result.error === 'Unauthorized') results.skipped++;
    else results.failed++;
  }

  // 4. Probar API de Security Logs
  console.log('\n🔒 4. SECURITY LOGS');
  console.log('-'.repeat(60));

  // GET - Listar logs de seguridad
  const securityLogs = await testApi(
    'Listar logs de seguridad',
    'GET',
    `${BASE_URL}/api/security/logs?limit=10`,
    null,
    token
  );
  if (securityLogs.success) results.passed++;
  else if (securityLogs.error === 'Unauthorized') results.skipped++;
  else results.failed++;

  // GET - Estadísticas de seguridad
  const securityStats = await testApi(
    'Estadísticas de seguridad',
    'GET',
    `${BASE_URL}/api/security/stats`,
    null,
    token
  );
  if (securityStats.success) results.passed++;
  else if (securityStats.error === 'Unauthorized') results.skipped++;
  else results.failed++;

  // 5. Probar Cron Job de Reportes
  console.log('\n⏰ 5. CRON JOB DE REPORTES');
  console.log('-'.repeat(60));

  const cronSecret = process.env.CRON_SECRET || '';
  const cronTest = await testApi(
    'Ejecutar cron de reportes',
    'GET',
    `${BASE_URL}/api/cron/reports`,
    null,
    cronSecret ? `Bearer ${cronSecret}` : null
  );
  if (cronTest.success) results.passed++;
  else if (cronTest.error === 'Unauthorized') results.skipped++;
  else results.failed++;

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN DE PRUEBAS');
  console.log('-'.repeat(60));
  console.log(`✅ Pasadas: ${results.passed}`);
  console.log(`❌ Fallidas: ${results.failed}`);
  console.log(`⏭️  Omitidas (requieren auth): ${results.skipped}`);
  console.log(
    `\n💡 Para probar con autenticación, establece AUTH_TOKEN en las variables de entorno`
  );
  console.log(`💡 Para probar el cron job, establece CRON_SECRET en las variables de entorno\n`);
};

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testApi };

