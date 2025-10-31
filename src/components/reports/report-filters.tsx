'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ReportFiltersProps {
  projects?: Array<{ id: string; name: string }>;
  hospitals?: Array<{ id: string; name: string }>;
  provinces?: string[];
  onFiltersChange: (filters: ReportFilters) => void;
  showGranularity?: boolean;
  showLevel?: boolean;
}

export interface ReportFilters {
  projectId?: string;
  hospitalId?: string;
  province?: string;
  dateFrom?: string;
  dateTo?: string;
  granularity?: 'day' | 'week' | 'month';
  level?: 'hospital' | 'province' | 'global';
}

export function ReportFilters({
  projects,
  hospitals,
  provinces,
  onFiltersChange,
  showGranularity = false,
  showLevel = false,
}: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    granularity: 'day',
    level: 'global',
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onFiltersChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.projectId,
    filters.hospitalId,
    filters.province,
    filters.dateFrom,
    filters.dateTo,
    filters.granularity,
    filters.level,
  ]);

  const updateFilter = (key: keyof ReportFilters, value: string | undefined) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value || undefined };
      return updated;
    });
  };

  const clearFilters = () => {
    setFilters({
      granularity: 'day',
      level: 'global',
    });
  };

  const hasActiveFilters = Boolean(
    filters.projectId || filters.hospitalId || filters.province || 
    filters.dateFrom || filters.dateTo
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {Object.values(filters).filter(Boolean).length - (showGranularity ? 1 : 0) - (showLevel ? 1 : 0)} activos
              </Badge>
            )}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 px-2"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects && projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project">Proyecto</Label>
                <Select
                  value={filters.projectId || 'all'}
                  onValueChange={(value) => updateFilter('projectId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Todos los proyectos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hospitals && hospitals.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="hospital">Hospital</Label>
                <Select
                  value={filters.hospitalId || 'all'}
                  onValueChange={(value) => updateFilter('hospitalId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger id="hospital">
                    <SelectValue placeholder="Todos los hospitales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los hospitales</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {provinces && provinces.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Select
                  value={filters.province || 'all'}
                  onValueChange={(value) => updateFilter('province', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger id="province">
                    <SelectValue placeholder="Todas las provincias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las provincias</SelectItem>
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showGranularity && (
              <div className="space-y-2">
                <Label htmlFor="granularity">Granularidad</Label>
                <Select
                  value={filters.granularity || 'day'}
                  onValueChange={(value) => updateFilter('granularity', value)}
                >
                  <SelectTrigger id="granularity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Diario</SelectItem>
                    <SelectItem value="week">Semanal</SelectItem>
                    <SelectItem value="month">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showLevel && (
              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Select
                  value={filters.level || 'global'}
                  onValueChange={(value) => updateFilter('level', value)}
                >
                  <SelectTrigger id="level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="province">Por Provincia</SelectItem>
                    <SelectItem value="hospital">Por Hospital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Fecha Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Fecha Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

