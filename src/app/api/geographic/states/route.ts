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

    const states = await GeographicService.getStatesByCountry(country);

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
      source: '@countrystatecity/countries',
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener estados/provincias',
        data: [],
        source: 'fallback'
      },
      { status: 500 }
    );
  }
}

