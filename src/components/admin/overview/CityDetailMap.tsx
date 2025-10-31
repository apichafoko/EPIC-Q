'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CityData {
  city: string;
  province: string;
  hospitalCount: number;
  totalCases: number;
  averageProgress: number;
  averageCompletion: number;
  activeHospitals: number;
}

interface CityDetailMapProps {
  province: string;
  data: CityData[];
  onBack: () => void;
}

export function CityDetailMap({ province, data, onBack }: CityDetailMapProps) {
  const t = useTranslations();

  // Calcular tamaño de burbuja basado en total de casos
  const maxCases = useMemo(() => {
    return Math.max(...data.map((d) => d.totalCases), 1);
  }, [data]);

  // Calcular color basado en progreso promedio
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ciudades en {province}</h3>
          <p className="text-sm text-muted-foreground">
            {data.length > 0 ? (
              <>
                {data.length} {data.length === 1 ? 'ciudad encontrada' : 'ciudades encontradas'}
              </>
            ) : (
              'No se encontraron ciudades con datos para esta provincia'
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('geographic.backToProvinces')}
        </Button>
      </div>

      {/* Visualización de burbujas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Visualización por Ciudad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 p-6 min-h-[300px] items-center justify-center">
            {data.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-muted-foreground font-medium">No hay ciudades con datos</p>
                <p className="text-xs text-muted-foreground">
                  Esto puede deberse a que no hay hospitales asignados al proyecto en esta provincia,
                  o que los hospitales no tienen el campo 'city' completado.
                </p>
              </div>
            ) : (
              data.map((city) => {
                const size = Math.max(40, (city.totalCases / maxCases) * 120);
                return (
                  <div
                    key={city.city}
                    className="flex flex-col items-center group cursor-pointer relative"
                    style={{ minWidth: size + 40 }}
                  >
                    <div
                      className={`rounded-full ${getProgressColor(
                        city.averageProgress
                      )} text-white flex items-center justify-center font-bold shadow-lg transition-all hover:scale-110`}
                      style={{
                        width: size,
                        height: size,
                        fontSize: Math.max(10, size / 8),
                      }}
                      title={`${city.city}: ${city.totalCases} casos, ${city.averageProgress}% progreso`}
                    >
                      {city.totalCases}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium truncate max-w-[120px]">
                        {city.city}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {city.hospitalCount} {city.hospitalCount === 1 ? 'hospital' : 'hospitales'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Datos por Ciudad</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ciudad</TableHead>
                <TableHead className="text-center">Hospitales</TableHead>
                <TableHead className="text-center">Casos Totales</TableHead>
                <TableHead className="text-center">Progreso Promedio</TableHead>
                <TableHead className="text-center">Completitud Promedio</TableHead>
                <TableHead className="text-center">Activos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                data
                  .sort((a, b) => b.totalCases - a.totalCases)
                  .map((city) => (
                    <TableRow key={city.city}>
                      <TableCell className="font-medium">{city.city}</TableCell>
                      <TableCell className="text-center">{city.hospitalCount}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{city.totalCases}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={getProgressColor(city.averageProgress)}
                        >
                          {city.averageProgress}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{city.averageCompletion}%</TableCell>
                      <TableCell className="text-center">{city.activeHospitals}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

