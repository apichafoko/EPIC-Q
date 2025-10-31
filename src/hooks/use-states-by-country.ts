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

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Error al cargar estados/provincias');
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          // Mostrar todas las provincias/estados sin filtrar
          const allStates = result.data
            .map((state: any) => ({
              name: state.name,
              code: state.code,
            }))
            .sort((a: StateOption, b: StateOption) => a.name.localeCompare(b.name));

          setStates(allStates);
        } else {
          setStates([]);
        }
      } catch (err) {
        console.error('Error loading states:', err);
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

