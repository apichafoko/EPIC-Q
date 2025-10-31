/**
 * Netlify Function para ejecutar reportes programados
 * Esta función hace un HTTP request al endpoint de Next.js API route
 * ya que las Netlify Functions tienen mejor soporte para esto
 */

exports.handler = async (event, context) => {
  // Verificar secret de cron
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  try {
    // Obtener la URL base de la aplicación
    // En Netlify, DEPLOY_PRIME_URL está disponible durante builds
    // Para runtime, usa el dominio del sitio
    const baseUrl =
      process.env.DEPLOY_PRIME_URL ||
      process.env.URL ||
      process.env.NETLIFY_DEV 
        ? 'http://localhost:8888'
        : 'https://tu-dominio.netlify.app'; // Cambiar por tu dominio real

    // Llamar al endpoint de Next.js API route
    const response = await fetch(`${baseUrl}/api/cron/reports`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error ejecutando cron de reportes:', data);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Error ejecutando cron',
          details: data,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Cron job ejecutado exitosamente',
        data,
      }),
    };
  } catch (error) {
    console.error('Error en cron-reports function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Error interno',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

