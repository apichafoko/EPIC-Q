'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Download, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { HospitalFiltersComponent } from '../../components/hospitals/hospital-filters';
import { HospitalTable } from '../../components/hospitals/hospital-table';
import { HospitalFilters } from '../../types';
import { mockHospitals } from '../../lib/mock-data';

export default function HospitalsPage() {
  const [filters, setFilters] = useState<HospitalFilters>({
    search: '',
    province: 'all',
    status: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filtrar hospitales
  const filteredHospitals = useMemo(() => {
    return mockHospitals.filter(hospital => {
      const matchesSearch = !filters.search || 
        hospital.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        hospital.city.toLowerCase().includes(filters.search.toLowerCase()) ||
        hospital.projects?.[0]?.redcap_id?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesProvince = filters.province === 'all' || hospital.province === filters.province;
      const matchesStatus = filters.status === 'all' || hospital.status === filters.status;
      
      return matchesSearch && matchesProvince && matchesStatus;
    });
  }, [filters]);

  const handleFiltersChange = (newFilters: HospitalFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospitales</h1>
          <p className="text-gray-600 mt-2">
            Gestión de hospitales participantes en el estudio EPIC-Q
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email Masivo
          </Button>
          <Button asChild>
            <Link href="/hospitals/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Hospital
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{filteredHospitals.length}</div>
          <div className="text-sm text-gray-600">Total hospitales</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {filteredHospitals.filter(h => h.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Activos</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {filteredHospitals.filter(h => h.status === 'inactive').length}
          </div>
          <div className="text-sm text-gray-600">En aprobación ética</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredHospitals.filter(h => h.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Contacto inicial</div>
        </div>
      </div>

      {/* Filters */}
      <HospitalFiltersComponent 
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <HospitalTable
        hospitals={filteredHospitals}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredHospitals.length / itemsPerPage)}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
}
