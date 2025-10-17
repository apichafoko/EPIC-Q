'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Eye, Edit, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Hospital, statusConfig } from '@/types';

interface HospitalTableProps {
  hospitals: Hospital[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  loading?: boolean;
}

export function HospitalTable({ 
  hospitals, 
  currentPage, 
  totalPages,
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange,
  loading = false
}: HospitalTableProps) {
  const [sortField, setSortField] = useState<keyof Hospital>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Hospital) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedHospitals = [...hospitals].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getCoordinator = (hospital: Hospital) => {
    return hospital.coordinator || 'No asignado';
  };

  const getStatusBadge = (status: Hospital['status']) => {
    // Manejar valores null/undefined
    if (!status) {
      return (
        <Badge className="bg-gray-100 text-gray-800 flex items-center space-x-1">
          <span>❓</span>
          <span>Sin estado</span>
        </Badge>
      );
    }
    
    const config = statusConfig[status];
    
    // Si el estado no está definido en statusConfig, usar un estado por defecto
    if (!config) {
      console.warn(`Estado no definido: ${status}`);
      return (
        <Badge className="bg-gray-100 text-gray-800 flex items-center space-x-1">
          <span>❓</span>
          <span>{status}</span>
        </Badge>
      );
    }
    
    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getProgressColor = (completionRate: number) => {
    if (completionRate >= 80) return 'bg-green-500';
    if (completionRate >= 60) return 'bg-yellow-500';
    if (completionRate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('redcap_id')}
              >
                ID RedCap
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('name')}
              >
                Hospital
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('province')}
              >
                Provincia
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                Estado
              </TableHead>
              <TableHead>Coordinador</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('progress_percentage')}
              >
                Progreso
              </TableHead>
              <TableHead>Casos</TableHead>
              <TableHead>Completitud</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('updated_at')}
              >
                Última Actividad
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-8"></div></TableCell>
                </TableRow>
              ))
            ) : (
              hospitals.map((hospital) => {
                const coordinator = getCoordinator(hospital);

              return (
                <TableRow key={hospital.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">
                    {hospital.redcap_id || '-'}
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/hospitals/${hospital.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {hospital.name}
                    </Link>
                    <div className="text-sm text-gray-500">{hospital.city}</div>
                  </TableCell>
                  <TableCell className="text-sm">{hospital.province}</TableCell>
                  <TableCell>{getStatusBadge(hospital.status)}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{coordinator}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={hospital.progress || 0} 
                        className="flex-1 h-2"
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {hospital.progress || 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{hospital.cases || 0}</div>
                    <div className="text-xs text-gray-500">creados</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getProgressColor(hospital.completion || 0)}`} />
                      <span className="text-sm font-medium">{hospital.completion || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(hospital.updated_at).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/hospitals/${hospital.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/hospitals/${hospital.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Llamar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Mostrar</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">hospitales</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
