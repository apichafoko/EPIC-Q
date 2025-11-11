import { NextRequest, NextResponse } from 'next/server';
import { GeographicService } from '@/lib/services/geographic-service';

/**
 * API endpoint para obtener ciudades por provincia/estado
 * Utiliza el paquete @countrystatecity/countries
 * https://www.npmjs.com/package/@countrystatecity/countries
 * 
 * GET /api/geographic/cities?province=Buenos Aires&country=AR
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');
    const country = searchParams.get('country') || 'AR';

    if (!province) {
      return NextResponse.json(
        { error: 'Parámetro "province" es requerido' },
        { status: 400 }
      );
    }

    console.log(`[API Cities] Obteniendo ciudades para provincia: ${province}, país: ${country}`);

    const cities = await GeographicService.getCitiesByProvince(province, country);

    console.log(`[API Cities] Ciudades obtenidas: ${cities.length} para ${province}`);
    if (cities.length > 0) {
      console.log(`[API Cities] Primeras 5 ciudades:`, cities.slice(0, 5).map(c => c.name));
    }

    // Determinar la fuente basándose en la cantidad de ciudades
    // Si hay muy pocas ciudades, probablemente se usó el fallback
    const source = cities.length < 10 ? 'fallback' : '@countrystatecity/countries';

    return NextResponse.json({
      success: true,
      data: cities.map(city => ({
        name: city.name,
        province: province,
        country: country,
        // Incluir datos adicionales si están disponibles
        ...(city.latitude && { latitude: city.latitude }),
        ...(city.longitude && { longitude: city.longitude }),
      })),
      province,
      country,
      count: cities.length,
      source: source,
    });
  } catch (error) {
    console.error('[API Cities] Error fetching cities:', error);
    console.error('[API Cities] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[API Cities] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // En caso de error, intentar usar fallback directamente
    try {
      const province = new URL(request.url).searchParams.get('province');
      const country = new URL(request.url).searchParams.get('country') || 'AR';
      if (province) {
        const fallbackCities = await GeographicService.getCitiesByProvince(province, country);
        if (fallbackCities.length > 0) {
          return NextResponse.json({
            success: true,
            data: fallbackCities.map(city => ({
              name: city.name,
              province: province,
              country: country,
            })),
            province,
            country,
            count: fallbackCities.length,
            source: 'fallback',
          });
        }
      }
    } catch (fallbackError) {
      console.error('[API Cities] Error en fallback:', fallbackError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener ciudades',
        data: [],
        source: 'error'
      },
      { status: 500 }
    );
  }
}

