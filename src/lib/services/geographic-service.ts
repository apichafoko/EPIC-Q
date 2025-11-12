/**
 * Servicio para obtener datos geográficos (ciudades, provincias, etc.)
 * Utiliza el paquete @countrystatecity/countries
 * https://www.npmjs.com/package/@countrystatecity/countries
 * 
 * Este servicio se usa exclusivamente en el servidor (API routes), no requiere 'use server'
 */

// Importación dinámica para mejor compatibilidad con serverless
// El paquete puede fallar en producción serverless, por lo que usamos importación dinámica
type ICity = any;
type IState = any;

interface City {
  id: number;
  name: string;
  state_code?: string;
  country_code: string;
  latitude?: string;
  longitude?: string;
  wikiDataId?: string;
}

interface State {
  id: number;
  name: string;
  country_code: string;
  country_id: number;
  state_code?: string;
  type?: string;
  latitude?: string;
  longitude?: string;
}

/**
 * Servicio principal de geografía usando @countrystatecity/countries
 */

const cache: {
  cities?: Map<string, City[]>;
  states?: Map<string, State[]>;
  provinceCodeMap?: Map<string, string>; // Mapeo nombre provincia -> código ISO2
} = {};

// Cache TTL: 24 horas
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Obtener mapeo de nombres de provincias a códigos ISO2
 * @param country Código del país (ISO 3166-1 alpha-2), default 'AR' para Argentina
 * @returns Map con nombre de provincia como key y código ISO2 como value
 */
async function getProvinceCodeMap(country: string = 'AR'): Promise<Map<string, string>> {
  // Si ya está en cache, retornar
  if (cache.provinceCodeMap) {
    return cache.provinceCodeMap;
  }

  try {
    // Importación dinámica para mejor compatibilidad con serverless
    const { getStatesOfCountry } = await import('@countrystatecity/countries');
    const states = await getStatesOfCountry(country);
    const provinceMap = new Map<string, string>();

    // Crear mapeo: nombre -> código ISO2
    states.forEach(state => {
      if (state.iso2 && state.name) {
        const stateName = state.name.trim();
        const normalizedName = stateName.toLowerCase();
        
        // Mapeo básico: nombre exacto y normalizado
        provinceMap.set(stateName, state.iso2);
        provinceMap.set(normalizedName, state.iso2);
        
        // Mapeo especial para Buenos Aires (provincia)
        if (stateName === 'Buenos Aires' && !stateName.includes('Autonomous') && !stateName.includes('City')) {
          provinceMap.set('Buenos Aires', state.iso2);
          provinceMap.set('buenos aires', state.iso2);
        }
        
        // Mapeo especial para CABA - mapear todas las variaciones posibles
        if (stateName.includes('Autonomous') || stateName.includes('City')) {
          // Mapear el nombre oficial del paquete
          provinceMap.set('Autonomous City of Buenos Aires', state.iso2);
          provinceMap.set('autonomous city of buenos aires', state.iso2);
          // Mapear variaciones en español
          provinceMap.set('Ciudad Autónoma de Buenos Aires', state.iso2);
          provinceMap.set('Ciudad de Buenos Aires', state.iso2);
          provinceMap.set('ciudad autónoma de buenos aires', state.iso2);
          provinceMap.set('ciudad de buenos aires', state.iso2);
          // Mapear CABA (abreviatura común)
          provinceMap.set('CABA', state.iso2);
          provinceMap.set('caba', state.iso2);
        }
      }
    });

    // Guardar en cache
    cache.provinceCodeMap = provinceMap;
    return provinceMap;
  } catch (error) {
    console.error('Error fetching province code map:', error);
    // Retornar mapeo estático como fallback
    return getStaticProvinceCodeMap();
  }
}

/**
 * Mapeo estático de provincias argentinas a códigos ISO2 (fallback)
 * NOTA: Estos códigos deben coincidir con los que usa el paquete @countrystatecity/countries
 */
function getStaticProvinceCodeMap(): Map<string, string> {
  const staticMap = new Map<string, string>([
    // Buenos Aires (provincia) - código B en el paquete
    ['Buenos Aires', 'B'],
    ['buenos aires', 'B'],
    // CABA - código C en el paquete
    ['Ciudad Autónoma de Buenos Aires', 'C'],
    ['CABA', 'C'],
    ['Ciudad de Buenos Aires', 'C'],
    ['Autonomous City of Buenos Aires', 'C'],
    ['ciudad autónoma de buenos aires', 'C'],
    ['caba', 'C'],
    ['autonomous city of buenos aires', 'C'],
    // Resto de provincias con códigos correctos del paquete
    ['Catamarca', 'K'],
    ['catamarca', 'K'],
    ['Chaco', 'H'],
    ['chaco', 'H'],
    ['Chubut', 'U'],
    ['chubut', 'U'],
    ['Córdoba', 'X'],
    ['córdoba', 'X'],
    ['Corrientes', 'W'],
    ['corrientes', 'W'],
    ['Entre Ríos', 'E'],
    ['Entre Rios', 'E'],
    ['entre ríos', 'E'],
    ['entre rios', 'E'],
    ['Formosa', 'P'],
    ['formosa', 'P'],
    ['Jujuy', 'Y'],
    ['jujuy', 'Y'],
    ['La Pampa', 'L'],
    ['la pampa', 'L'],
    ['La Rioja', 'F'],
    ['la rioja', 'F'],
    ['Mendoza', 'M'],
    ['mendoza', 'M'],
    ['Misiones', 'N'],
    ['misiones', 'N'],
    ['Neuquén', 'Q'],
    ['Neuquen', 'Q'],
    ['neuquén', 'Q'],
    ['neuquen', 'Q'],
    ['Río Negro', 'R'],
    ['Rio Negro', 'R'],
    ['río negro', 'R'],
    ['rio negro', 'R'],
    ['Salta', 'A'],
    ['salta', 'A'],
    ['San Juan', 'J'],
    ['san juan', 'J'],
    ['San Luis', 'D'],
    ['san luis', 'D'],
    ['Santa Cruz', 'Z'],
    ['santa cruz', 'Z'],
    ['Santa Fe', 'S'],
    ['santa fe', 'S'],
    ['Santiago del Estero', 'G'],
    ['santiago del estero', 'G'],
    ['Tierra del Fuego', 'V'],
    ['tierra del fuego', 'V'],
    ['Tucumán', 'T'],
    ['Tucuman', 'T'],
    ['tucumán', 'T'],
    ['tucuman', 'T'],
  ]);
  return staticMap;
}

/**
 * Adaptar ICity del paquete a nuestra interfaz City
 */
function adaptCity(packageCity: ICity, countryCode: string, stateCode?: string): City {
  return {
    id: packageCity.id || 0,
    name: packageCity.name || '',
    state_code: stateCode || packageCity.state_code || undefined,
    country_code: countryCode || packageCity.country_code,
    latitude: packageCity.latitude || undefined,
    longitude: packageCity.longitude || undefined,
    wikiDataId: undefined, // El paquete no incluye este campo
  };
}

/**
 * Adaptar IState del paquete a nuestra interfaz State
 * Traduce nombres de provincias al español cuando sea necesario
 */
function adaptState(packageState: IState, countryCode: string): State {
  // Traducir nombre de CABA del inglés al español
  let stateName = packageState.name || '';
  if (stateName.includes('Autonomous City of Buenos Aires')) {
    stateName = 'Ciudad Autónoma de Buenos Aires';
  }
  
  return {
    id: packageState.id || 0,
    name: stateName,
    country_code: countryCode || packageState.country_code || 'AR',
    country_id: packageState.country_id || 0,
    state_code: packageState.iso2 || undefined,
    type: packageState.type || undefined,
    latitude: packageState.latitude || undefined,
    longitude: packageState.longitude || undefined,
  };
}

/**
 * Obtener ciudades de una provincia/estado
 * @param province Nombre de la provincia/estado
 * @param country Código del país (ISO 3166-1 alpha-2), default 'AR' para Argentina
 * @returns Lista de ciudades
 */
export async function getCitiesByProvince(province: string, country: string = 'AR'): Promise<City[]> {
  try {
    const cacheKey = `${country}-${province}`.toLowerCase();

    // Verificar cache
    if (cache.cities && cache.cities.has(cacheKey)) {
      const cached = cache.cities.get(cacheKey);
      if (cached) {
        console.log(`[GeographicService] Usando ciudades en caché para ${province}: ${cached.length} ciudades`);
        return cached;
      }
    }

    console.log(`[GeographicService] Obteniendo ciudades para provincia: ${province}`);

    // Obtener mapeo de provincias a códigos ISO2
    const provinceCodeMap = await getProvinceCodeMap(country);
    
    // Obtener código ISO2 de la provincia
    const normalizedProvince = province.trim();
    const provinceCode = provinceCodeMap.get(normalizedProvince) || 
                         provinceCodeMap.get(normalizedProvince.toLowerCase());

    if (!provinceCode) {
      console.warn(`[GeographicService] No se encontró código ISO2 para provincia: ${province}, usando fallback`);
      const fallbackCities = getFallbackCities(province, country);
      console.log(`[GeographicService] Fallback para ${province}: ${fallbackCities.length} ciudades`);
      return fallbackCities;
    }

    console.log(`[GeographicService] Código ISO2 encontrado para ${province}: ${provinceCode}`);

    // Obtener ciudades usando el paquete (importación dinámica)
    // Con outputFileTracingIncludes configurado, los archivos JSON deberían estar disponibles en producción
    try {
      const { getCitiesOfState } = await import('@countrystatecity/countries');
      const packageCities = await getCitiesOfState(country, provinceCode);
      
      if (Array.isArray(packageCities) && packageCities.length > 0) {
        console.log(`[GeographicService] ✅ Paquete funcionó correctamente: ${packageCities.length} ciudades para ${province}`);
        
        // Adaptar ciudades del paquete a nuestra interfaz
        const cities: City[] = packageCities.map(city => adaptCity(city, country, provinceCode));

        // Guardar en cache
        if (!cache.cities) {
          cache.cities = new Map();
        }
        cache.cities.set(cacheKey, cities);

        console.log(`[GeographicService] Retornando ${cities.length} ciudades del paquete para ${province}`);
        return cities;
      } else {
        console.error(`[GeographicService] ❌ Paquete retornó array vacío para ${province} (código ${provinceCode})`);
        throw new Error(`Paquete retornó array vacío`);
      }
    } catch (packageError) {
      const errorMessage = packageError instanceof Error ? packageError.message : String(packageError);
      const errorStack = packageError instanceof Error ? packageError.stack : undefined;
      
      console.error(`[GeographicService] ❌ Error al usar paquete @countrystatecity/countries para ${province}:`, errorMessage);
      if (errorStack) {
        console.error(`[GeographicService] Stack trace:`, errorStack);
      }
      console.error(`[GeographicService] Esto puede indicar que los archivos JSON no están disponibles en producción.`);
      console.error(`[GeographicService] Verifica que outputFileTracingIncludes esté configurado correctamente en next.config.js`);
      
      // Solo usar fallback si realmente falló el paquete
      const fallbackCities = getFallbackCities(province, country);
      console.warn(`[GeographicService] ⚠️ Usando fallback temporal para ${province}: ${fallbackCities.length} ciudades`);
      console.warn(`[GeographicService] ⚠️ Esto es una solución temporal. Deberías arreglar el acceso al paquete en producción.`);
      
      // Guardar fallback en cache también
      if (!cache.cities) {
        cache.cities = new Map();
      }
      cache.cities.set(cacheKey, fallbackCities);
      
      return fallbackCities;
    }
  } catch (error) {
    console.error(`[GeographicService] Error fetching cities from @countrystatecity/countries para ${province}:`, error);
    console.error(`[GeographicService] Error details:`, error instanceof Error ? error.message : String(error));
    const fallbackCities = getFallbackCities(province, country);
    console.log(`[GeographicService] Usando fallback para ${province}: ${fallbackCities.length} ciudades`);
    return fallbackCities;
  }
}

/**
 * Obtener provincias estáticas de Argentina (fallback)
 * @returns Lista de estados/provincias de Argentina
 */
function getFallbackStates(): State[] {
  return [
    { id: 1, name: 'Buenos Aires', country_code: 'AR', state_code: 'B', country_id: 1 },
    { id: 2, name: 'Ciudad Autónoma de Buenos Aires', country_code: 'AR', state_code: 'C', country_id: 1 },
    { id: 3, name: 'Catamarca', country_code: 'AR', state_code: 'K', country_id: 1 },
    { id: 4, name: 'Chaco', country_code: 'AR', state_code: 'H', country_id: 1 },
    { id: 5, name: 'Chubut', country_code: 'AR', state_code: 'U', country_id: 1 },
    { id: 6, name: 'Córdoba', country_code: 'AR', state_code: 'X', country_id: 1 },
    { id: 7, name: 'Corrientes', country_code: 'AR', state_code: 'W', country_id: 1 },
    { id: 8, name: 'Entre Ríos', country_code: 'AR', state_code: 'E', country_id: 1 },
    { id: 9, name: 'Formosa', country_code: 'AR', state_code: 'P', country_id: 1 },
    { id: 10, name: 'Jujuy', country_code: 'AR', state_code: 'Y', country_id: 1 },
    { id: 11, name: 'La Pampa', country_code: 'AR', state_code: 'L', country_id: 1 },
    { id: 12, name: 'La Rioja', country_code: 'AR', state_code: 'F', country_id: 1 },
    { id: 13, name: 'Mendoza', country_code: 'AR', state_code: 'M', country_id: 1 },
    { id: 14, name: 'Misiones', country_code: 'AR', state_code: 'N', country_id: 1 },
    { id: 15, name: 'Neuquén', country_code: 'AR', state_code: 'Q', country_id: 1 },
    { id: 16, name: 'Río Negro', country_code: 'AR', state_code: 'R', country_id: 1 },
    { id: 17, name: 'Salta', country_code: 'AR', state_code: 'A', country_id: 1 },
    { id: 18, name: 'San Juan', country_code: 'AR', state_code: 'J', country_id: 1 },
    { id: 19, name: 'San Luis', country_code: 'AR', state_code: 'D', country_id: 1 },
    { id: 20, name: 'Santa Cruz', country_code: 'AR', state_code: 'Z', country_id: 1 },
    { id: 21, name: 'Santa Fe', country_code: 'AR', state_code: 'S', country_id: 1 },
    { id: 22, name: 'Santiago del Estero', country_code: 'AR', state_code: 'G', country_id: 1 },
    { id: 23, name: 'Tierra del Fuego', country_code: 'AR', state_code: 'V', country_id: 1 },
    { id: 24, name: 'Tucumán', country_code: 'AR', state_code: 'T', country_id: 1 },
  ];
}

/**
 * Obtener todas las provincias/estados de un país
 * @param country Código del país (ISO 3166-1 alpha-2), default 'AR' para Argentina
 * @returns Lista de estados/provincias
 */
export async function getStatesByCountry(country: string = 'AR'): Promise<State[]> {
  try {
    // Verificar cache
    if (cache.states && cache.states.has(country)) {
      const cached = cache.states.get(country);
      if (cached) {
        return cached;
      }
    }

    // Obtener estados usando el paquete (importación dinámica)
    const { getStatesOfCountry } = await import('@countrystatecity/countries');
    const packageStates = await getStatesOfCountry(country);

    if (!Array.isArray(packageStates) || packageStates.length === 0) {
      console.warn('No se encontraron estados del paquete, usando fallback');
      // Si es Argentina, usar fallback estático
      if (country === 'AR') {
        const fallbackStates = getFallbackStates();
        // Guardar en cache
        if (!cache.states) {
          cache.states = new Map();
        }
        cache.states.set(country, fallbackStates);
        return fallbackStates;
      }
      return [];
    }

    // Adaptar estados del paquete a nuestra interfaz
    const states: State[] = packageStates.map(state => adaptState(state, country));

    // Guardar en cache
    if (!cache.states) {
      cache.states = new Map();
    }
    cache.states.set(country, states);

    return states;
  } catch (error) {
    console.error('Error fetching states from @countrystatecity/countries:', error);
    // Si es Argentina, usar fallback estático
    if (country === 'AR') {
      console.log('Usando fallback estático para provincias argentinas');
      const fallbackStates = getFallbackStates();
      // Guardar en cache para evitar llamadas repetidas
      if (!cache.states) {
        cache.states = new Map();
      }
      cache.states.set(country, fallbackStates);
      return fallbackStates;
    }
    return [];
  }
}

/**
 * Datos estáticos de fallback (ciudades principales por provincia de Argentina)
 */
function getFallbackCities(province: string, country: string): City[] {
    const fallbackData: Record<string, string[]> = {
      'Buenos Aires': [
        'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Quilmes', 'Lanús',
        'Banfield', 'Temperley', 'Lomas de Zamora', 'Avellaneda', 'San Isidro',
        'Tigre', 'Pilar', 'Merlo', 'Morón', 'San Martín', 'San Miguel',
        'Malvinas Argentinas', 'Ituzaingó', 'Hurlingham', 'Tres de Febrero',
        'Berazategui', 'Florencio Varela', 'Moreno', 'San Fernando', 'Vicente López',
        'Zárate', 'Campana', 'Escobar', 'Pergamino', 'Junín', 'Chivilcoy',
        'Luján', 'Mercedes', 'San Nicolás', 'Ramallo', 'Baradero', 'Salto',
        'Rojas', 'Colón', 'Olavarría', 'Tandil', 'Azul', 'Olavarría',
        'Necochea', 'Balcarce', 'General Pueyrredón', 'Dolores', 'Chascomús',
        'La Matanza', 'Esteban Echeverría', 'Ezeiza', 'Cañuelas', 'Lobos',
        'San Vicente', 'Brandsen', 'Ensenada', 'Berisso', 'La Plata'
      ],
      'Ciudad Autónoma de Buenos Aires': [
        'CABA', 'Buenos Aires', 'Palermo', 'Recoleta', 'San Telmo', 'La Boca',
        'Belgrano', 'Villa Crespo', 'Caballito', 'Almagro', 'Flores', 'Villa Devoto',
        'Villa Urquiza', 'Nuñez', 'Saavedra', 'Coghlan', 'Villa Pueyrredón',
        'Villa Ortúzar', 'Chacarita', 'Colegiales', 'Barracas', 'Parque Patricios',
        'Nueva Pompeya', 'Boedo', 'San Cristóbal', 'Balvanera', 'Monserrat',
        'San Nicolás', 'Retiro', 'Puerto Madero', 'Constitución'
      ],
      'CABA': [
        'CABA', 'Buenos Aires', 'Palermo', 'Recoleta', 'San Telmo', 'La Boca',
        'Belgrano', 'Villa Crespo', 'Caballito', 'Almagro', 'Flores', 'Villa Devoto',
        'Villa Urquiza', 'Nuñez', 'Saavedra', 'Coghlan', 'Villa Pueyrredón',
        'Villa Ortúzar', 'Chacarita', 'Colegiales', 'Barracas', 'Parque Patricios',
        'Nueva Pompeya', 'Boedo', 'San Cristóbal', 'Balvanera', 'Monserrat',
        'San Nicolás', 'Retiro', 'Puerto Madero', 'Constitución'
      ],
      'Córdoba': [
        'Córdoba', 'Villa María', 'Río Cuarto', 'San Francisco', 'Villa Carlos Paz',
        'Jesús María', 'Villa Allende', 'La Calera', 'Unquillo', 'Morteros',
        'Marcos Juárez', 'Bell Ville', 'Leones', 'Arroyito', 'Monte Cristo',
        'Río Segundo', 'Pilar', 'Colonia Caroya', 'Villa del Totoral', 'Jesús María',
        'Cruz del Eje', 'Deán Funes', 'Villa Dolores', 'San Marcos Sierras', 'La Falda',
        'Villa General Belgrano', 'Alta Gracia', 'Río Tercero', 'General Cabrera', 'Monte Buey',
        'Laboulaye', 'Huinca Renancó', 'General Roca', 'Adelia María', 'Vicuña Mackenna'
      ],
      'Santa Fe': [
        'Rosario', 'Santa Fe', 'Rafaela', 'Venado Tuerto', 'Reconquista',
        'Santo Tomé', 'Sunchales', 'Villa Constitución', 'Esperanza', 'Gálvez',
        'Casilda', 'San Lorenzo', 'Villa Gobernador Gálvez', 'Pérez', 'Firmat',
        'Arroyo Seco', 'Cañada de Gómez', 'Las Parejas', 'Totoras', 'San Jorge',
        'San Cristóbal', 'Rufino', 'Villa Cañás', 'Funes', 'Granadero Baigorria',
        'Capitán Bermúdez', 'Puerto General San Martín', 'Alvear', 'Coronda', 'El Trébol'
      ],
      'Mendoza': [
        'Mendoza', 'San Rafael', 'Godoy Cruz', 'Guaymallén', 'Luján de Cuyo',
        'Maipú', 'Rivadavia', 'Tunuyán', 'San Martín', 'General Alvear',
        'Las Heras', 'Lavalle', 'Malargüe', 'San Carlos', 'Tupungato',
        'La Paz', 'Santa Rosa', 'Junín', 'Rivadavia', 'La Consulta',
        'Villa Nueva', 'Palmira', 'Rodeo del Medio', 'Coquimbito', 'Villa Tulumaya',
        'Cacheuta', 'Potrerillos', 'Uspallata', 'Los Molles', 'El Sosneado'
      ],
      'Tucumán': [
        'San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Concepción',
        'Aguilares', 'Monteros', 'Famaillá', 'Banda del Río Salí', 'Simoca',
        'Tafí del Valle', 'Amaicha del Valle', 'Colombres', 'La Cocha', 'Graneros',
        'Villa Alberdi', 'La Madrid', 'Juan Bautista Alberdi', 'Leales', 'Burruyacú',
        'Cruz Alta', 'Río Chico', 'San Pedro de Colalao', 'Trancas', 'Villa Quinteros'
      ],
      'Salta': [
        'Salta', 'San Salvador de Jujuy', 'Orán', 'Tartagal', 'General Güemes',
        'Metán', 'Rosario de la Frontera', 'Cafayate', 'Cerrillos',
        'San Antonio de los Cobres', 'Cachi', 'Molinos', 'Angastaco', 'Animaná',
        'La Viña', 'Chicoana', 'Cerrillos', 'La Merced', 'El Carril',
        'Campo Quijano', 'Rosario de Lerma', 'Cachi', 'Payogasta', 'Seclantás'
      ],
      'Misiones': [
        'Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apóstoles',
        'Leandro N. Alem', 'San Vicente', 'Aristóbulo del Valle',
        'Puerto Rico', 'Montecarlo', 'Jardín América', 'Candelaria', 'Santa Ana',
        'San Ignacio', 'Concepción de la Sierra', 'Garupá', 'Capioví', 'El Soberbio',
        'San Pedro', 'Bernardo de Irigoyen', 'Andresito', 'Wanda', 'Puerto Esperanza'
      ],
      'Entre Ríos': [
        'Paraná', 'Concordia', 'Gualeguaychú', 'Gualeguay', 'Villaguay',
        'Concepción del Uruguay', 'Nogoyá', 'Federación', 'Colón',
        'Victoria', 'Diamante', 'La Paz', 'San José de Feliciano', 'Federal',
        'Federación', 'Chajarí', 'Villa Elisa', 'Basavilbaso', 'Crespo',
        'San Benito', 'Villa Paranacito', 'Ibicuy', 'General Campos', 'San Salvador'
      ],
      'Corrientes': [
        'Corrientes', 'Goya', 'Mercedes', 'Paso de los Libres', 'Curuzú Cuatiá',
        'Monte Caseros', 'Esquina', 'Bella Vista', 'Empedrado',
        'Santo Tomé', 'Ituzaingó', 'Bella Vista', 'San Roque', 'Saladas',
        'San Luis del Palmar', 'Riachuelo', 'Santa Lucía', 'Yapeyú', 'Loreto',
        'Mburucuyá', 'Concepción', 'San Cosme', 'Paso de la Patria', 'Itatí'
      ],
      'Chaco': [
        'Resistencia', 'Barranqueras', 'Presidencia Roque Sáenz Peña', 'Villa Ángela',
        'Charata', 'General San Martín', 'Quitilipi', 'Las Breñas',
        'Villa Berthet', 'Machagai', 'La Leonesa', 'General Pinedo', 'Tres Isletas',
        'Castelli', 'Pampa del Indio', 'Colonia Benítez', 'Fontana', 'Margarita Belén',
        'Colonia Popular', 'Laguna Blanca', 'Misión Nueva Pompeya', 'El Sauzalito', 'Fuerte Esperanza'
      ],
      'Formosa': [
        'Formosa', 'Clorinda', 'Pirané', 'El Colorado', 'Las Lomitas',
        'Ibarreta', 'Comandante Fontana',
        'Laguna Yema', 'Pozo del Tigre', 'Villa General Güemes', 'Riacho He Hé',
        'Estanislao del Campo', 'San Martín 2', 'Buena Vista', 'Colonia Pastoril',
        'Ingeniero Guillermo N. Juárez', 'Laguna Naick Neck', 'Palo Santo', 'Villa Dos Trece'
      ],
      'Neuquén': [
        'Neuquén', 'Cutral-Có', 'Plottier', 'Zapala', 'San Martín de los Andes',
        'Villa La Angostura', 'Junín de los Andes', 'Chos Malal',
        'Centenario', 'Añelo', 'Rincón de los Sauces', 'Las Lajas', 'Aluminé',
        'Villa Traful', 'Caviahue', 'Copahue', 'El Huecú', 'Loncopué',
        'Buta Ranquil', 'Barrancas', 'Picún Leufú', 'Piedra del Águila', 'Santo Tomé'
      ],
      'Río Negro': [
        'Bariloche', 'Viedma', 'General Roca', 'Cipolletti', 'San Antonio Oeste',
        'El Bolsón', 'Choele Choel', 'Allen', 'Cinco Saltos',
        'Villa Regina', 'Ingeniero Jacobacci', 'Sierra Grande', 'Luis Beltrán',
        'Comallo', 'Pilcaniyeu', 'Ñorquincó', 'Maquinchao', 'Los Menucos',
        'Valcheta', 'Ramos Mexía', 'Comallo', 'Dina Huapi', 'Villa Mascardi'
      ],
      'Chubut': [
        'Comodoro Rivadavia', 'Trelew', 'Rawson', 'Puerto Madryn', 'Esquel',
        'Sarmiento', 'Gaiman', 'Dolavon', 'Trevelin',
        'Rada Tilly', 'Caleta Olivia', 'Pico Truncado', 'Las Heras', 'Perito Moreno',
        'Gobernador Costa', 'Tecka', 'El Maitén', 'Lago Puelo', 'El Hoyo',
        'Cholila', 'Epuyén', 'Corcovado', 'Aldea Beleiro', 'Río Mayo'
      ],
      'Santa Cruz': [
        'Río Gallegos', 'Caleta Olivia', 'El Calafate', 'Pico Truncado',
        'Puerto Deseado', 'Las Heras', 'Perito Moreno', 'Comandante Luis Piedra Buena',
        'Río Turbio', 'El Chaltén', 'Gobernador Gregores', 'Puerto San Julián',
        '28 de Noviembre', 'Yacimientos Río Turbio', 'Tres Lagos', 'Los Antiguos',
        'Pico Truncado', 'Jaramillo', 'Fitz Roy', 'Koluel Kaike', 'Tellier'
      ],
      'Tierra del Fuego': [
        'Ushuaia', 'Río Grande', 'Tolhuin',
        'San Sebastián', 'Lago Escondido', 'Lago Fagnano', 'Estancia Harberton',
        'Puerto Almanza', 'Bahía Thetis', 'Cabo San Pablo', 'Estancia Moat'
      ],
      'La Pampa': [
        'Santa Rosa', 'General Pico', 'Toay', 'Realicó', 'Eduardo Castex',
        'Macachín', 'Intendente Alvear', 'Victorica',
        'General Acha', 'Guatraché', 'Trenel', 'Quemú Quemú', 'Anguil',
        'Colonia Barón', 'Winifreda', 'Bernasconi', 'Jacinto Arauz', 'Alta Italia',
        'Bernardo Larroudé', 'Caleufú', 'Ingeniero Luiggi', 'Lonquimay', 'Metileo'
      ],
      'La Rioja': [
        'La Rioja', 'Chilecito', 'Arauco', 'Chamical', 'Aimilco',
        'Chepes', 'Vinchina', 'Famatina',
        'Aminga', 'Anillaco', 'Castro Barros', 'Chañar', 'Nonogasta',
        'Sanagasta', 'Villa Unión', 'Vinchina', 'Guandacol', 'Jagüé',
        'Olta', 'Malanzán', 'Ulapes', 'Villa Castelli', 'Villa Sanagasta'
      ],
      'San Juan': [
        'San Juan', 'Rivadavia', 'Rawson', 'Chimbas', 'Santa Lucía',
        'Pocito', 'Caucete', 'Albardón', 'Jáchal',
        'San Martín', 'Angaco', '9 de Julio', 'Calingasta', 'Iglesia',
        'Ullum', 'Zonda', 'Pocito', 'Sarmiento', '25 de Mayo',
        'Valle Fértil', 'Calingasta', 'Barreal', 'Tamberías', 'Villa Pituil'
      ],
      'San Luis': [
        'San Luis', 'Villa Mercedes', 'Merlo', 'La Toma', 'Concarán',
        'Tilisarao', 'San Francisco del Monte de Oro', 'Justo Daract',
        'Villa de la Quebrada', 'Nueva Galia', 'Arizona', 'Buena Esperanza',
        'Unión', 'Luján', 'Quines', 'San Martín', 'Naschel',
        'Villa del Carmen', 'El Trapiche', 'Potrero de los Funes', 'La Florida'
      ],
      'Santiago del Estero': [
        'Santiago del Estero', 'La Banda', 'Frías', 'Añatuya', 'Termas de Río Hondo',
        'Loreto', 'Monte Quemado', 'Suncho Corral',
        'Villa Ojo de Agua', 'Villa Atamisqui', 'Selva', 'Colonia Dora',
        'Sumampa', 'Villa Unión', 'Pozo Hondo', 'Los Juríes', 'Tintina',
        'Villa La Punta', 'Villa San Martín', 'El Bobadal', 'Villa General Mitre'
      ],
      'Catamarca': [
        'San Fernando del Valle de Catamarca', 'Valle Viejo', 'San Antonio',
        'Santa María', 'Fiambalá', 'Andalgalá', 'Belén', 'Tinogasta',
        'Recreo', 'La Merced', 'El Rodeo', 'Los Varela', 'Icaño',
        'Ancasti', 'La Puerta', 'Pomán', 'Mutquín', 'Saujil',
        'Hualfín', 'Antofagasta de la Sierra', 'El Alto', 'Paclín', 'El Rodeo'
      ],
      'Jujuy': [
        'San Salvador de Jujuy', 'Palpalá', 'Ledesma', 'San Pedro', 'Libertador General San Martín',
        'Perico', 'La Quiaca', 'Humahuaca', 'Tilcara',
        'El Carmen', 'Monterrico', 'Yala', 'Volcán', 'Tumbaya',
        'Purmamarca', 'Maimará', 'Susques', 'Abra Pampa', 'La Esperanza',
        'Fraile Pintado', 'Calilegua', 'Caimancito', 'Vinalito', 'Santa Clara'
      ],
    };

    const cities = fallbackData[province] || fallbackData[province.split(' ')[0]] || [];
    
    return cities.map((name, index) => ({
      id: index + 1,
      name,
      country_code: country,
      state_code: undefined,
    }));
}

/**
 * Obtener ciudades con caché (para usar en producción)
 */
export async function getCitiesByProvinceCached(
  province: string, 
  country: string = 'AR',
  ttl: number = 24 * 60 * 60 * 1000
): Promise<City[]> {
  // Por ahora, el caché está en memoria
  // En producción, implementar Redis o similar
  return getCitiesByProvince(province, country);
}

// Exportar todas las funciones como GeographicService para mantener compatibilidad
export const GeographicService = {
  getCitiesByProvince,
  getStatesByCountry,
  getCitiesByProvinceCached,
};

