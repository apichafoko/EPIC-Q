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

    const cities = await GeographicService.getCitiesByProvince(province, country);

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
      source: '@countrystatecity/countries',
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener ciudades',
        data: [], // Retornar lista vacía en caso de error
        source: 'fallback'
      },
      { status: 500 }
    );
  }
}

