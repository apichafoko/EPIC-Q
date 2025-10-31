'use client';

import { useState, useEffect } from 'react';

interface CityOption {
  city: string;
  hospitalCount: number;
}

/**
 * Hook para obtener ciudades disponibles por provincia
 * Usa el paquete @countrystatecity/countries
 * https://www.npmjs.com/package/@countrystatecity/countries
 * También incluye ciudades de hospitales existentes en la BD como referencia
 */
export function useCitiesByProvince(province: string | null | undefined, projectId?: string) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si no hay provincia seleccionada, limpiar ciudades
    if (!province || province.trim() === '') {
      setCities([]);
      setError(null);
      return;
    }

    const loadCities = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Primero intentar obtener ciudades de @countrystatecity/countries
        const geographicParams = new URLSearchParams();
        geographicParams.append('province', province);
        geographicParams.append('country', 'AR');

        const geographicResponse = await fetch(`/api/geographic/cities?${geographicParams.toString()}`);
        let geographicCities: string[] = [];

        if (geographicResponse.ok) {
          const geographicResult = await geographicResponse.json();
          if (geographicResult.success && Array.isArray(geographicResult.data)) {
            geographicCities = geographicResult.data.map((c: any) => c.name);
          }
        }

        // 2. También obtener ciudades de hospitales existentes (para mostrar conteo)
        const params = new URLSearchParams();
        params.append('metric', 'cities_by_province');
        params.append('province', province);
        if (projectId) {
          params.append('projectId', projectId);
        }

        const hospitalResponse = await fetch(`/api/analytics?${params.toString()}`, {
          credentials: 'include',
        });

        let hospitalCitiesMap = new Map<string, number>();

        if (hospitalResponse.ok) {
          const hospitalResult = await hospitalResponse.json();
          if (hospitalResult.success && Array.isArray(hospitalResult.data)) {
            hospitalResult.data.forEach((item: any) => {
              if (item.city) {
                hospitalCitiesMap.set(item.city.trim(), item.hospitalCount || 0);
              }
            });
          }
        }

        // 3. Combinar ciudades: de API pública + de hospitales
        const allCitiesSet = new Set<string>();
        
        // Agregar ciudades de API pública
        geographicCities.forEach(city => allCitiesSet.add(city));
        
        // Agregar ciudades de hospitales (pueden tener nombres diferentes)
        Array.from(hospitalCitiesMap.keys()).forEach(city => allCitiesSet.add(city));

        // 4. Crear lista final ordenada
        const uniqueCities = Array.from(allCitiesSet).sort();
        
        const cityOptions: CityOption[] = uniqueCities.map((city) => ({
          city: city.trim(),
          hospitalCount: hospitalCitiesMap.get(city) || 0,
        }));

        setCities(cityOptions);
      } catch (err) {
        console.error('Error loading cities:', err);
        setError('Error al cargar ciudades');
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, [province, projectId]);

  return { cities, loading, error };
}

