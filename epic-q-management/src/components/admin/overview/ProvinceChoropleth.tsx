"use client";

import React, { useMemo } from "react";
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
}: {
  data: ProvinceStats[] | Record<string, ProvinceStats> | null | undefined;
  title?: string;
}) {
  // Preparar datos para el mapa de calor basado en casos cargados
  const mapData = useMemo(() => {
    const mapData: Record<string, number> = {};
    
    // Validación inicial de datos
    if (!data || (typeof data !== 'object')) {
      console.warn('ProvinceChoropleth: Invalid data provided', data);
      return mapData;
    }
    
    // Mapear nombres de provincias a los códigos que usa la librería
    const provinceMapping: Record<string, string> = {
      "Buenos Aires": "AR-B",
      "Ciudad Autónoma de Buenos Aires": "AR-C",
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
          const code = provinceMapping[stats.province];
          if (code) {
            // Usar casos cargados para el mapa de calor, con fallback a hospitales
            mapData[code] = stats.totalCasesLoaded || stats.hospitals || 0;
          }
        }
      });
    } catch (error) {
      console.warn('Error processing map data in mapData:', error);
    }

    return mapData;
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-gray-500">Mapa de calor: casos cargados en REDCap</div>
      </div>
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="w-full h-64">
          <VectorMap
            map={arMill}
            backgroundColor="transparent"
            series={{
              regions: [
                {
                  values: mapData,
                  scale: ["#dc2626", "#ea580c", "#eab308", "#84cc16", "#16a34a"],
                  normalizeFunction: "polynomial",
                },
              ],
            }}
            regionStyle={{
              initial: { fill: "#f3f4f6" },
              hover: { fill: "#16a34a" },
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
                    stats = dataArray.find(s => s && s.province === provinceName) || {};
                  }
                }
              } catch (error) {
                console.warn('Error processing map data in tooltip:', error);
                stats = {};
              }
              
              const total = stats?.hospitals || 0;
              const casesLoaded = stats?.totalCasesLoaded || 0;
              const activeLoading = stats?.activeLoading || 0;
              const completedPeriods = stats?.completedPeriods || 0;
              
              el.html(`
                <div style="padding: 12px; background: white; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); min-width: 200px;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1f2937;">
                    ${provinceName}
                  </div>
                  <div style="font-size: 12px; line-height: 1.4; color: #4b5563;">
                    <div style="margin-bottom: 4px;">
                      <strong>Hospitales:</strong> ${total}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>Ética Aprobado:</strong> ${stats?.ethicsApproved || 0}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>Formulario Completo:</strong> ${stats?.formComplete || 0}
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
        <div className="mt-3 space-y-2">
          <div className="text-xs text-gray-500 text-center">
            Tip: pasa el mouse sobre una provincia para ver los detalles
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
    </div>
  );
}

export default ProvinceChoropleth;


