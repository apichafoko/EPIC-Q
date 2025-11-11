import { NextRequest, NextResponse } from 'next/server';
import { GeographicService } from '@/lib/services/geographic-service';

/**
 * API endpoint para obtener estados/provincias de un país
 * Utiliza el paquete @countrystatecity/countries
 * https://www.npmjs.com/package/@countrystatecity/countries
 * 
 * GET /api/geographic/states?country=AR
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'AR';

    console.log(`[API] Obteniendo estados para país: ${country}`);

    const states = await GeographicService.getStatesByCountry(country);

    console.log(`[API] Estados obtenidos: ${states.length}`);

    // Si no hay estados y es Argentina, intentar usar fallback directamente
    if (states.length === 0 && country === 'AR') {
      console.warn('[API] No se obtuvieron estados, el servicio debería haber usado fallback');
      // El servicio ya debería haber usado fallback, pero por si acaso retornamos error
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al obtener estados/provincias',
          data: [],
          source: 'error'
        },
        { status: 500 }
      );
    }

    const mappedStates = states.map(state => ({
      name: state.name,
      code: state.state_code || state.country_code,
      country: country,
      // Incluir datos adicionales si están disponibles
      ...(state.latitude && { latitude: state.latitude }),
      ...(state.longitude && { longitude: state.longitude }),
    }));

    return NextResponse.json({
      success: true,
      data: mappedStates,
      country,
      count: mappedStates.length,
      source: mappedStates.length > 0 ? '@countrystatecity/countries' : 'fallback',
    });
  } catch (error) {
    console.error('[API] Error fetching states:', error);
    console.error('[API] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // En caso de error, intentar obtener fallback directamente
    try {
      const country = new URL(request.url).searchParams.get('country') || 'AR';
      if (country === 'AR') {
        // El servicio ya debería manejar el fallback, pero por si acaso
        const fallbackStates = await GeographicService.getStatesByCountry(country);
        if (fallbackStates.length > 0) {
          const mappedStates = fallbackStates.map(state => ({
            name: state.name,
            code: state.state_code || state.country_code,
            country: country,
          }));
          return NextResponse.json({
            success: true,
            data: mappedStates,
            country,
            count: mappedStates.length,
            source: 'fallback',
          });
        }
      }
    } catch (fallbackError) {
      console.error('[API] Error en fallback:', fallbackError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener estados/provincias',
        data: [],
        source: 'error'
      },
      { status: 500 }
    );
  }
}

