'use client';

import { useState, useEffect } from 'react';

interface StateOption {
  name: string;
  code: string;
}

/**
 * Hook para obtener estados/provincias de un país
 * Usa el paquete @countrystatecity/countries
 * https://www.npmjs.com/package/@countrystatecity/countries
 */
export function useStatesByCountry(country: string = 'AR') {
  const [states, setStates] = useState<StateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!country || country.trim() === '') {
      setStates([]);
      setError(null);
      return;
    }

    const loadStates = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('country', country);

        const url = `/api/geographic/states?${params.toString()}`;

        console.log('[Hook] Cargando estados desde:', url);

        const response = await fetch(url);

        const result = await response.json();

        console.log('[Hook] Respuesta del API:', { 
          success: result.success, 
          count: result.data?.length || 0,
          source: result.source 
        });

        // Aceptar datos incluso si success es false pero hay datos
        if (Array.isArray(result.data) && result.data.length > 0) {
          // Mostrar todas las provincias/estados sin filtrar
          const allStates = result.data
            .map((state: any) => ({
              name: state.name,
              code: state.code,
            }))
            .sort((a: StateOption, b: StateOption) => a.name.localeCompare(b.name));

          console.log('[Hook] Estados procesados:', allStates.length);
          setStates(allStates);
          setError(null);
        } else if (!response.ok || !result.success) {
          // Si no hay datos y la respuesta no es exitosa, mostrar error
          console.error('[Hook] Error en respuesta:', result.error || 'Error desconocido');
          setError(result.error || 'Error al cargar provincias');
          setStates([]);
        } else {
          // Respuesta exitosa pero sin datos
          console.warn('[Hook] Respuesta exitosa pero sin datos');
          setStates([]);
          setError(null);
        }
      } catch (err) {
        console.error('[Hook] Error loading states:', err);
        setError('Error al cargar provincias');
        setStates([]);
      } finally {
        setLoading(false);
      }
    };

    loadStates();
  }, [country]);

  return { states, loading, error };
}

