'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HospitalFiltersComponent } from '@/components/hospitals/hospital-filters';
import { HospitalTable } from '@/components/hospitals/hospital-table';
import { HospitalFilters, Hospital } from '@/types';
import { getHospitals, getProvinces, getStatuses } from '@/lib/services/hospital-service';

export default function HospitalsPage() {
  const [filters, setFilters] = useState<HospitalFilters>({
    search: '',
    province: 'all',
    status: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalHospitals, setTotalHospitals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [hospitalsData, provincesData, statusesData] = await Promise.all([
          getHospitals(filters, currentPage, itemsPerPage),
          getProvinces(),
          getStatuses()
        ]);
        
        setHospitals(hospitalsData.hospitals);
        setTotalPages(hospitalsData.totalPages);
        setTotalHospitals(hospitalsData.total);
        setProvinces(provincesData);
        setStatuses(statusesData);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters, currentPage, itemsPerPage]);

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

  // Calcular estadísticas
  const stats = {
    total: totalHospitals,
    active: hospitals.filter(h => h.status === 'active').length,
    pending: hospitals.filter(h => h.status === 'pending').length,
    inactive: hospitals.filter(h => h.status === 'inactive').length
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

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
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total hospitales</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Activos</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          <div className="text-sm text-gray-600">Inactivos</div>
        </div>
      </div>

      {/* Filters */}
      <HospitalFiltersComponent 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        provinces={provinces}
        statuses={statuses}
      />

      {/* Table */}
      <HospitalTable
        hospitals={hospitals}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />
    </div>
  );
}