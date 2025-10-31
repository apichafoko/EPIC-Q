"use client";

import React, { useMemo, useRef } from "react";
import { VectorMap } from "@react-jvectormap/core";
import arMill from "@react-jvectormap/argentina/dist/arMill.json";

type ProvinceStats = {
  province: string;
  hospitals: number;
  ethicsApproved: number;
  formComplete: number;
  totalCasesLoaded: number;
  activeLoading: number;
  completedPeriods: number;
};

export function ProvinceChoropleth({
  data,
  title = "Hospitales por provincia",
  onProvinceClick,
}: {
  data: ProvinceStats[] | Record<string, ProvinceStats> | null | undefined;
  title?: string;
  onProvinceClick?: (province: string) => void;
}) {
  const mapRef = useRef<any>(null);

  // Preparar datos para el mapa de calor basado en casos cargados
  const mapData = useMemo(() => {
    const mapData: Record<string, number> = {};
    
    // Validación inicial de datos
    if (!data || (typeof data !== 'object')) {
      console.warn('ProvinceChoropleth: Invalid data provided', data);
      return mapData; // Retornar mapa vacío, no valores por defecto
    }
    
    // Mapear nombres de provincias a los códigos que usa la librería
    // CABA aparece como provincia separada con código AR-C
    const provinceMapping: Record<string, string> = {
      "Buenos Aires": "AR-B",
      "Ciudad Autónoma de Buenos Aires": "AR-C",
      "Ciudad Autonoma de Buenos Aires": "AR-C", // Sin tilde
      "Autonomous City of Buenos Aires": "AR-C", // Nombre en inglés del paquete
      "CABA": "AR-C",
      "Ciudad de Buenos Aires": "AR-C",
      "Catamarca": "AR-K",
      "Chaco": "AR-H",
      "Chubut": "AR-U",
      "Córdoba": "AR-X",
      "Corrientes": "AR-W",
      "Entre Ríos": "AR-E",
      "Formosa": "AR-P",
      "Jujuy": "AR-Y",
      "La Pampa": "AR-L",
      "La Rioja": "AR-F",
      "Mendoza": "AR-M",
      "Misiones": "AR-N",
      "Neuquén": "AR-Q",
      "Río Negro": "AR-R",
      "Salta": "AR-A",
      "San Juan": "AR-J",
      "San Luis": "AR-D",
      "Santa Cruz": "AR-Z",
      "Santa Fe": "AR-S",
      "Santiago del Estero": "AR-G",
      "Tierra del Fuego": "AR-V",
      "Tucumán": "AR-T",
    };

    try {
      // Convertir datos a array si es necesario
      let dataArray: any[] = [];
      
      if (Array.isArray(data)) {
        dataArray = data;
      } else if (data && typeof data === 'object') {
        dataArray = Object.values(data);
      }
      
      // Procesar cada elemento del array
      dataArray.forEach((stats) => {
        if (stats && typeof stats === 'object' && stats.province) {
          const provinceName = stats.province.trim();
          
          // Ignorar provincias inválidas
          if (provinceName === 'Sin provincia' || 
              provinceName === 'Desconocida' || 
              provinceName === '' ||
              !provinceName) {
            return; // Saltar provincias inválidas sin warning
          }
          
          let code = provinceMapping[provinceName];
          
          // Si no se encuentra el código exacto, buscar con normalización
          if (!code) {
            // Normalizar el nombre: quitar espacios extra, convertir a minúsculas para comparar
            const normalized = provinceName.toLowerCase().trim();
            
            // CABA aparece como provincia separada con código AR-C
            if (normalized.includes('ciudad autónoma') || 
                normalized.includes('ciudad autonoma') ||
                normalized.includes('autonomous city of buenos aires') ||
                normalized === 'caba' || 
                normalized === 'ciudad de buenos aires' ||
                normalized.includes('autónoma de buenos aires') ||
                normalized.includes('autonoma de buenos aires')) {
              code = 'AR-C'; // CABA como provincia separada
            }
            // Buscar Buenos Aires (provincia, sin "Ciudad")
            else if (normalized.includes('buenos aires') && 
                     !normalized.includes('ciudad') && 
                     !normalized.includes('autónoma') &&
                     !normalized.includes('autonoma') &&
                     !normalized.includes('autonomous')) {
              code = 'AR-B';
            }
          }
          
          if (code) {
            // Si ya existe un valor para este código, sumar (por si hay duplicados)
            const currentValue = mapData[code] || 0;
            // Usar hospitales como valor principal, luego casos cargados
            let newValue = stats.hospitals || stats.totalHospitals || stats.totalCasesLoaded || 0;
            
            // Para CABA (AR-C), asegurar que tenga al menos un valor mínimo para que sea visible
            // incluso si no tiene datos, así aparece en el mapa
            if (code === 'AR-C' && newValue === 0) {
              newValue = 0.1; // Valor mínimo para que aparezca en el mapa con color gris claro
            }
            
            // Agregar al mapa
            mapData[code] = currentValue + newValue;
          }
        }
      });
      
      
    } catch (error) {
      console.warn('Error processing map data in mapData:', error);
    }

    return mapData;
  }, [data]);

  // Extraer datos de CABA para mostrarla como entidad separada
  const cabaData = useMemo(() => {
    if (!data || typeof data !== 'object') return null;
    
    const dataArray = Array.isArray(data) ? data : Object.values(data);
    const caba = dataArray.find((d: any) => {
      if (!d || !d.province) return false;
      const normalized = d.province.toLowerCase().trim();
      return normalized.includes('ciudad autónoma') || 
             normalized.includes('ciudad autonoma') ||
             normalized.includes('autonomous city of buenos aires') ||
             normalized === 'caba' || 
             normalized === 'ciudad de buenos aires';
    });
    
    return caba || null;
  }, [data]);

  // Remover CABA del mapa principal (mostrar solo provincias continentales)
  const mainMapData = useMemo(() => {
    const filtered = { ...mapData };
    delete filtered['AR-C']; // Excluir CABA del mapa principal
    return filtered;
  }, [mapData]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-gray-500">Mapa de calor: casos cargados en REDCap</div>
      </div>
      
      {/* Contenedor principal con mapa y panel de CABA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Mapa principal (Argentina sin CABA) */}
        <div className="lg:col-span-3 border rounded-lg p-4 bg-gray-50">
          <div className="w-full h-64">
            <VectorMap
            map={arMill}
            backgroundColor="transparent"
            series={{
              regions: [
                {
                  attribute: "fill",
                  values: mainMapData, // Usar mapa sin CABA
                  scale: ["#e5e7eb", "#fbbf24", "#f59e0b", "#ea580c", "#dc2626"], // Empezar con gris claro para valor 0, luego amarillo/naranja/rojo
                  normalizeFunction: "linear",
                  min: 0,
                },
              ],
            }}
            regionStyle={{
              initial: { 
                fill: "#e5e7eb", 
                stroke: "#374151", // Borde más oscuro para mejor visibilidad
                strokeWidth: 1.5, 
                strokeOpacity: 1, 
                cursor: onProvinceClick ? 'pointer' : 'default',
                fillOpacity: 1
              },
              // Estilo especial para CABA (AR-C) para hacerla más visible
              // Nota: react-jvectormap puede no soportar estilos por código directamente
              // Usaremos un enfoque diferente: asegurar que tenga un valor mínimo visible
              hover: { 
                fill: "#16a34a", 
                cursor: onProvinceClick ? 'pointer' : 'default',
                fillOpacity: 0.8
              },
              selected: {
                fill: "#16a34a",
                fillOpacity: 0.6
              },
              selectedHover: {
                fill: "#16a34a",
                fillOpacity: 0.8
              }
            }}
            onRegionClick={(event, code) => {
              if (onProvinceClick) {
                // Ocultar tooltip después de un breve delay para permitir que se procese el click
                setTimeout(() => {
                  const tooltips = document.querySelectorAll('.jvectormap-tip');
                  tooltips.forEach((tip) => {
                    const el = tip as HTMLElement;
                    if (el) {
                      el.style.display = 'none';
                      el.style.visibility = 'hidden';
                      el.style.opacity = '0';
                    }
                  });
                }, 150); // Pequeño delay para que el tooltip se procese primero

                const codeToProvinceMapping: Record<string, string> = {
                  "AR-B": "Buenos Aires",
                  "AR-C": "Ciudad Autónoma de Buenos Aires",
                  "AR-K": "Catamarca",
                  "AR-H": "Chaco",
                  "AR-U": "Chubut",
                  "AR-X": "Córdoba",
                  "AR-W": "Corrientes",
                  "AR-E": "Entre Ríos",
                  "AR-P": "Formosa",
                  "AR-Y": "Jujuy",
                  "AR-L": "La Pampa",
                  "AR-F": "La Rioja",
                  "AR-M": "Mendoza",
                  "AR-N": "Misiones",
                  "AR-Q": "Neuquén",
                  "AR-R": "Río Negro",
                  "AR-A": "Salta",
                  "AR-J": "San Juan",
                  "AR-D": "San Luis",
                  "AR-Z": "Santa Cruz",
                  "AR-S": "Santa Fe",
                  "AR-G": "Santiago del Estero",
                  "AR-V": "Tierra del Fuego",
                  "AR-T": "Tucumán",
                };
                const provinceName = codeToProvinceMapping[code] || code;
                onProvinceClick(provinceName);
              }
            }}
            onRegionTipShow={(_, el, code) => {
              // Mapeo inverso de códigos a nombres de provincias
              const codeToProvinceMapping: Record<string, string> = {
                "AR-B": "Buenos Aires",
                "AR-C": "Ciudad Autónoma de Buenos Aires",
                "AR-K": "Catamarca",
                "AR-H": "Chaco",
                "AR-U": "Chubut",
                "AR-X": "Córdoba",
                "AR-W": "Corrientes",
                "AR-E": "Entre Ríos",
                "AR-P": "Formosa",
                "AR-Y": "Jujuy",
                "AR-L": "La Pampa",
                "AR-F": "La Rioja",
                "AR-M": "Mendoza",
                "AR-N": "Misiones",
                "AR-Q": "Neuquén",
                "AR-R": "Río Negro",
                "AR-A": "Salta",
                "AR-J": "San Juan",
                "AR-D": "San Luis",
                "AR-Z": "Santa Cruz",
                "AR-S": "Santa Fe",
                "AR-G": "Santiago del Estero",
                "AR-V": "Tierra del Fuego",
                "AR-T": "Tucumán",
              };
              
              const provinceName = codeToProvinceMapping[code] || "Provincia";
              
              let stats = {};
              try {
                if (data && typeof data === 'object') {
                  const dataArray = Array.isArray(data) ? data : Object.values(data);
                  if (Array.isArray(dataArray)) {
                    // Buscar por nombre exacto primero
                    stats = dataArray.find(s => s && s.province && s.province.trim() === provinceName) || {};
                    
                    // Si no se encuentra, buscar con normalización (para CABA y otras variaciones)
                    if (!stats || Object.keys(stats).length === 0) {
                      const normalizedProvinceName = provinceName.toLowerCase().trim();
                      
                      if (normalizedProvinceName === 'ciudad autónoma de buenos aires' || 
                          normalizedProvinceName.includes('ciudad autónoma') ||
                          normalizedProvinceName.includes('ciudad autonoma')) {
                        // Buscar cualquier variación de CABA
                        stats = dataArray.find(s => {
                          if (!s || !s.province) return false;
                          const normalized = s.province.toLowerCase().trim();
                          return normalized.includes('ciudad autónoma') ||
                                 normalized.includes('ciudad autonoma') ||
                                 normalized.includes('caba') ||
                                 normalized === 'ciudad de buenos aires';
                        }) || {};
                      } else if (normalizedProvinceName === 'buenos aires') {
                        // Para Buenos Aires, excluir CABA
                        stats = dataArray.find(s => {
                          if (!s || !s.province) return false;
                          const normalized = s.province.toLowerCase().trim();
                          return normalized === 'buenos aires' && 
                                 !normalized.includes('ciudad') &&
                                 !normalized.includes('autónoma') &&
                                 !normalized.includes('autonoma');
                        }) || {};
                      }
                    }
                  }
                }
              } catch (error) {
                console.warn('Error processing map data in tooltip:', error);
                stats = {};
              }
              
              // Debug para CABA
              if (provinceName === 'Ciudad Autónoma de Buenos Aires') {
                console.log('[DEBUG Tooltip CABA]', {
                  provinceName,
                  stats,
                  found: Object.keys(stats).length > 0,
                  hospitals: (stats as any)?.hospitals || (stats as any)?.totalHospitals,
                  casesLoaded: (stats as any)?.totalCasesLoaded
                });
              }
              
              const total = (stats as any)?.hospitals || (stats as any)?.totalHospitals || 0;
              const casesLoaded = (stats as any)?.totalCasesLoaded || 0;
              const activeLoading = (stats as any)?.activeLoading || 0;
              const completedPeriods = (stats as any)?.completedPeriods || 0;
              
              (el as any).html(`
                <div style="padding: 12px; background: white; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); min-width: 200px;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1f2937;">
                    ${provinceName}
                  </div>
                  <div style="font-size: 12px; line-height: 1.4; color: #4b5563;">
                    <div style="margin-bottom: 4px;">
                      <strong>Hospitales:</strong> ${total}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>Ética Aprobado:</strong> ${(stats as any)?.ethicsApproved || 0}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>Formulario Completo:</strong> ${(stats as any)?.formComplete || 0}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>Casos Cargados:</strong> ${casesLoaded}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>Cargando Activamente:</strong> ${activeLoading}
                    </div>
                    <div>
                      <strong>Períodos Completados:</strong> ${completedPeriods}
                    </div>
                  </div>
                </div>
              `);
            }}
            zoomOnScroll={false}
          />
          </div>
        </div>
        
        {/* Panel separado para CABA */}
        {cabaData && (
          <div className="lg:col-span-1">
            <div 
              className="border-2 border-orange-500 rounded-lg p-4 bg-white shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={() => onProvinceClick && onProvinceClick(cabaData.province)}
              title="Haz clic para ver ciudades de CABA"
            >
              <div className="text-center mb-3">
                <h3 className="font-bold text-sm text-orange-700 mb-1">
                  Ciudad Autónoma de Buenos Aires
                </h3>
                <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center border-2 border-orange-300">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700 mb-1">
                      {cabaData.hospitals || cabaData.totalHospitals || 0}
                    </div>
                    <div className="text-xs text-orange-600">Hospitales</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">Casos cargados:</span>
                  <span className="font-semibold">{cabaData.totalCasesLoaded || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">Ética aprobado:</span>
                  <span className="font-semibold">{cabaData.ethicsApproved || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">Formulario completo:</span>
                  <span className="font-semibold">{cabaData.formComplete || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Períodos completados:</span>
                  <span className="font-semibold">{cabaData.completedPeriods || 0}</span>
                </div>
              </div>
              
              {onProvinceClick && (
                <div className="mt-3 text-center">
                  <div className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                    Ver ciudades →
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 space-y-2">
          <div className="text-xs text-gray-500 text-center">
            {onProvinceClick 
              ? 'Tip: haz clic en una provincia para ver el detalle por ciudades'
              : 'Tip: pasa el mouse sobre una provincia para ver los detalles'}
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#dc2626" }}></div>
              <span>Sin casos</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ea580c" }}></div>
              <span>Pocos casos</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#eab308" }}></div>
              <span>Moderado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#84cc16" }}></div>
              <span>Muchos casos</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#16a34a" }}></div>
              <span>Máximo</span>
            </div>
          </div>
      </div>
    </div>
  );
}

export default ProvinceChoropleth;


