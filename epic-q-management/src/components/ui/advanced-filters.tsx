'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Search, RotateCcw } from 'lucide-react';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FilterValue {
  key: string;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
}

export interface AdvancedFiltersProps {
  filters: FilterOption[];
  onFiltersChange: (filters: FilterValue[]) => void;
  onClearFilters: () => void;
  className?: string;
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  className = '' 
}: AdvancedFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: any, operator: string = 'equals') => {
    const newFilters = activeFilters.filter(f => f.key !== key);
    
    if (value !== null && value !== undefined && value !== '') {
      newFilters.push({ key, value, operator: operator as any });
    }
    
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeFilter = (key: string) => {
    const newFilters = activeFilters.filter(f => f.key !== key);
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    onClearFilters();
  };

  const renderFilterInput = (filter: FilterOption) => {
    const currentValue = activeFilters.find(f => f.key === filter.key)?.value;

    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder={filter.placeholder || `Buscar ${filter.label.toLowerCase()}...`}
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value, 'contains')}
          />
        );

      case 'select':
        return (
          <Select
            value={currentValue || ''}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${filter.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );

      case 'dateRange':
        const startValue = currentValue?.start || '';
        const endValue = currentValue?.end || '';
        
        return (
          <div className="flex space-x-2">
            <Input
              type="date"
              placeholder="Desde"
              value={startValue}
              onChange={(e) => {
                const newValue = { ...currentValue, start: e.target.value };
                handleFilterChange(filter.key, newValue, 'between');
              }}
            />
            <Input
              type="date"
              placeholder="Hasta"
              value={endValue}
              onChange={(e) => {
                const newValue = { ...currentValue, end: e.target.value };
                handleFilterChange(filter.key, newValue, 'between');
              }}
            />
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={filter.placeholder || `Ingresar ${filter.label.toLowerCase()}...`}
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value ? Number(e.target.value) : null)}
          />
        );

      case 'boolean':
        return (
          <Select
            value={currentValue !== undefined ? String(currentValue) : ''}
            onValueChange={(value) => handleFilterChange(filter.key, value === 'true')}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${filter.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sí</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros Avanzados
          </CardTitle>
          <div className="flex items-center space-x-2">
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activeFilters.length} activo{activeFilters.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Filtros activos */}
          {activeFilters.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filtros Aplicados:</Label>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => {
                  const filterOption = filters.find(f => f.key === filter.key);
                  return (
                    <Badge
                      key={filter.key}
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <span>
                        {filterOption?.label}: {String(filter.value)}
                      </span>
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFilter(filter.key)}
                      />
                    </Badge>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-800"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Limpiar todo
                </Button>
              </div>
            </div>
          )}

          {/* Formulario de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <Label htmlFor={filter.key} className="text-sm font-medium">
                  {filter.label}
                </Label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
