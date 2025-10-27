'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { HospitalFilters, statusConfig } from '../../types';

interface HospitalFiltersProps {
  filters: HospitalFilters;
  onFiltersChange: (filters: HospitalFilters) => void;
  provinces?: string[];
  statuses?: string[];
}

export function HospitalFiltersComponent({ filters, onFiltersChange, provinces = [], statuses = [] }: HospitalFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onFiltersChange({ ...filters, search: value });
  };

  const handleProvinceChange = (value: string) => {
    onFiltersChange({ ...filters, province: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({ search: '', province: 'all', status: 'all' });
  };

  const hasActiveFilters = filters.search || (filters.province && filters.province !== 'all') || (filters.status && filters.status !== 'all');

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar hospitales..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Provincia */}
        <Select value={filters.province} onValueChange={handleProvinceChange}>
          <SelectTrigger>
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

        {/* Estado */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statuses.map((status) => {
              const config = statusConfig[status as keyof typeof statusConfig];
              return (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center space-x-2">
                    <span>{config?.icon}</span>
                    <span>{config?.label || status}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Filtros activos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
              <span>Búsqueda: &quot;{filters.search}&quot;</span>
              <button
                onClick={() => handleSearchChange('')}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.province && (
            <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
              <span>Provincia: {filters.province}</span>
              <button
                onClick={() => handleProvinceChange('')}
                className="ml-1 hover:text-green-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.status && (
            <div className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm">
              <span>Estado: {statusConfig[filters.status as keyof typeof statusConfig]?.label}</span>
              <button
                onClick={() => handleStatusChange('')}
                className="ml-1 hover:text-purple-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
