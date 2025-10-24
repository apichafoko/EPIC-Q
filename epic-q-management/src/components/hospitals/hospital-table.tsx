'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MoreHorizontal, Eye, Edit, Mail, Phone, Settings, Trash2, Shield, CheckSquare, Square } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Hospital, statusConfig } from '../../types';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useConfirmation } from '../../hooks/useConfirmation';
import { ConfirmationToast } from '../../components/ui/confirmation-toast';
import { CascadeConfirmationModal } from '../../components/ui/cascade-confirmation-modal';
import { toast } from 'sonner';
import { safeFetch, formatApiError } from '../../lib/api-utils';

interface HospitalTableProps {
  hospitals: Hospital[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export function HospitalTable({ 
  hospitals, 
  currentPage, 
  totalPages,
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange,
  loading = false,
  onRefresh
}: HospitalTableProps) {
  const params = useParams();
  const locale = params.locale || 'es';
  const [sortField, setSortField] = useState<keyof Hospital>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Removed periods configuration - periods are project-specific
  
  // Estados para bulk actions
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [showBulkDeactivateModal, setShowBulkDeactivateModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showCascadeModal, setShowCascadeModal] = useState(false);
  const [cascadeData, setCascadeData] = useState<any>(null);
  
  // Estados de carga
  const { isLoading: isDeactivating, executeWithLoading: executeWithDeactivating } = useLoadingState();
  const { isLoading: isDeleting, executeWithLoading: executeWithDeleting } = useLoadingState();
  const { isLoading: isBulkDeactivating, executeWithLoading: executeWithBulkDeactivating } = useLoadingState();
  const { isLoading: isBulkDeleting, executeWithLoading: executeWithBulkDeleting } = useLoadingState();
  
  // Hook de confirmación
  const { confirm, isConfirming, confirmationData, handleConfirm, handleCancel } = useConfirmation();


  const handleSort = (field: keyof Hospital) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Removed period configuration functions - periods are project-specific

  // Funciones para bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedHospitals(hospitals.map(hospital => hospital.id));
    } else {
      setSelectedHospitals([]);
    }
  };

  const handleSelectHospital = (hospitalId: string, checked: boolean) => {
    if (checked) {
      setSelectedHospitals(prev => [...prev, hospitalId]);
    } else {
      setSelectedHospitals(prev => prev.filter(id => id !== hospitalId));
    }
  };

  const handleBulkDeactivate = () => {
    if (selectedHospitals.length === 0) return;
    setShowBulkDeactivateModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedHospitals.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDeactivate = async () => {
    if (selectedHospitals.length === 0) return;

    await executeWithBulkDeactivating(async () => {
      const response = await fetch('/api/hospitals/bulk-deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hospitalIds: selectedHospitals }),
      });

      // Verificar si la respuesta tiene contenido JSON
      const contentType = response.headers.get('content-type');
      let data = null;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          if (text.trim()) {
            data = JSON.parse(text);
          }
        } catch (error) {
          console.error('Error parsing JSON response:', error);
          toast.error('Error al procesar la respuesta del servidor');
          return;
        }
      }
      
      if (response.ok) {
        toast.success(`${selectedHospitals.length} hospitales desactivados exitosamente`, {
          description: 'Los hospitales ya no aparecerán como activos en el sistema'
        });
        onRefresh?.();
        setSelectedHospitals([]);
        setShowBulkDeactivateModal(false);
      } else {
        const errorMessage = data?.details || data?.error || data?.message || `Error ${response.status}: ${response.statusText}`;
        toast.error('Error al desactivar hospitales', {
          description: errorMessage || 'Inténtalo de nuevo más tarde'
        });
      }
    });
  };

  const confirmBulkDelete = async () => {
    if (selectedHospitals.length === 0) return;

    await executeWithBulkDeleting(async () => {
      const response = await fetch('/api/hospitals/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hospitalIds: selectedHospitals }),
      });

      // Verificar si la respuesta tiene contenido JSON
      const contentType = response.headers.get('content-type');
      let data = null;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          if (text.trim()) {
            data = JSON.parse(text);
          }
        } catch (error) {
          console.error('Error parsing JSON response:', error);
          toast.error('Error al procesar la respuesta del servidor');
          return;
        }
      }
      
      if (response.ok) {
        toast.success(`${selectedHospitals.length} hospitales eliminados permanentemente`, {
          description: 'Todos los datos de los hospitales han sido borrados de la base de datos'
        });
        onRefresh?.();
        setSelectedHospitals([]);
        setShowBulkDeleteModal(false);
      } else {
        const errorMessage = data?.details || data?.error || data?.message || `Error ${response.status}: ${response.statusText}`;
        toast.error('Error al eliminar hospitales', {
          description: errorMessage || 'Inténtalo de nuevo más tarde'
        });
      }
    });
  };

  // Funciones para acciones individuales
  const handleDeactivateHospital = (hospital: Hospital) => {
    console.log('🔧 handleDeactivateHospital called for:', hospital.name);
    confirm(
      {
        title: 'Desactivar Hospital',
        description: `¿Estás seguro de que quieres desactivar el hospital "${hospital.name}"?`,
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        variant: 'destructive'
      },
      async () => {
        console.log('🔧 Confirmation confirmed, starting deactivation for:', hospital.name);
        try {
          await executeWithDeactivating(async () => {
            console.log('🔧 executeWithDeactivating started for:', hospital.name);
            const response = await fetch(`/api/hospitals/${hospital.id}/deactivate`, {
              method: 'POST',
              credentials: 'include'
            });

            console.log('🔧 Response received:', response.status, response.statusText);
            console.log('🔧 Response ok:', response.ok);

            // Verificar si la respuesta tiene contenido JSON
            const contentType = response.headers.get('content-type');
            console.log('🔧 Content-Type:', contentType);
            let data = null;
            
            if (contentType && contentType.includes('application/json')) {
              try {
                const text = await response.text();
                console.log('🔧 Response text:', text);
                if (text.trim()) {
                  data = JSON.parse(text);
                  console.log('🔧 Response data:', data);
                }
              } catch (error) {
                console.error('Error parsing JSON response:', error);
                toast.error('Error al procesar la respuesta del servidor');
                return;
              }
            } else {
              console.log('🔧 No JSON content type, trying to parse anyway');
              try {
                const text = await response.text();
                console.log('🔧 Response text (non-JSON):', text);
                if (text.trim()) {
                  data = JSON.parse(text);
                  console.log('🔧 Response data (parsed):', data);
                }
              } catch (error) {
                console.log('🔧 Could not parse as JSON:', error);
              }
            }

            if (response.ok) {
              console.log('🔧 Hospital deactivated successfully');
              toast.success('Hospital desactivado exitosamente', {
                description: `El hospital "${hospital.name}" ha sido desactivado`
              });
              onRefresh?.();
            } else {
              const errorMessage = data?.details || data?.error || data?.message || `Error ${response.status}: ${response.statusText}`;
              console.log('🔧 Error deactivating hospital:', errorMessage);
              console.log('🔧 About to show toast with message:', errorMessage);
              
              // Agregar un pequeño delay para asegurar que el toast se muestre
              setTimeout(() => {
                toast.error('Error al desactivar hospital', {
                  description: errorMessage || 'Inténtalo de nuevo más tarde'
                });
                console.log('🔧 Toast error called with delay');
              }, 100);
            }
          });
        } catch (error) {
          console.error('🔧 Error in deactivation process:', error);
          toast.error('Error al desactivar hospital', {
            description: 'Ocurrió un error inesperado'
          });
        }
      }
    );
  };

  const handleDeleteHospital = (hospital: Hospital) => {
    console.log('handleDeleteHospital called for:', hospital.name);
    
    confirm(
      {
        title: 'Eliminar Hospital Permanentemente',
        description: `¿Estás seguro de que quieres eliminar permanentemente el hospital "${hospital.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'destructive',
      },
      async () => {
        await executeWithDeleting(async () => {
      const response = await fetch(`/api/hospitals/${hospital.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      // Verificar si la respuesta tiene contenido JSON
      const contentType = response.headers.get('content-type');
      let data = null;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          if (text.trim()) {
            data = JSON.parse(text);
          }
        } catch (error) {
          console.error('Error parsing JSON response:', error);
          toast.error('Error al procesar la respuesta del servidor');
          return;
        }
      }

      if (response.ok) {
        if (data && data.requiresConfirmation) {
          // Mostrar modal de confirmación de cascada
          setCascadeData({
            hospitalId: hospital.id,
            hospitalName: hospital.name,
            ...data
          });
          setShowCascadeModal(true);
        } else {
          // Eliminación directa exitosa
          toast.success('Hospital eliminado exitosamente', {
            description: `El hospital "${hospital.name}" ha sido eliminado permanentemente`
          });
          onRefresh?.();
        }
      } else {
        const errorMessage = data?.details || data?.error || data?.message || `Error ${response.status}: ${response.statusText}`;
        toast.error('Error al eliminar hospital', {
          description: errorMessage || 'Inténtalo de nuevo más tarde'
        });
      }
    });
      }
    );
  };

  const handleConfirmCascadeDeletion = async (deleteCoordinators: boolean) => {
    if (!cascadeData) return;

    await executeWithDeleting(async () => {
      const response = await fetch(`/api/hospitals/${cascadeData.hospitalId}/confirm-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteCoordinators }),
        credentials: 'include'
      });

      // Verificar si la respuesta tiene contenido JSON
      const contentType = response.headers.get('content-type');
      let data = null;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          if (text.trim()) {
            data = JSON.parse(text);
          }
        } catch (error) {
          console.error('Error parsing JSON response:', error);
          toast.error('Error al procesar la respuesta del servidor');
          return;
        }
      }

      if (response.ok) {
        toast.success('Hospital eliminado exitosamente', {
          description: `El hospital "${cascadeData.hospitalName}" ha sido eliminado permanentemente`
        });
        onRefresh?.();
        setShowCascadeModal(false);
        setCascadeData(null);
      } else {
        const errorMessage = data?.details || data?.error || data?.message || `Error ${response.status}: ${response.statusText}`;
        toast.error('Error al eliminar hospital', {
          description: errorMessage || 'Inténtalo de nuevo más tarde'
        });
      }
    });
  };

  const sortedHospitals = [...hospitals].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
    if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
    
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
      {/* Bulk Actions Bar */}
      {selectedHospitals.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedHospitals.length} hospital{selectedHospitals.length !== 1 ? 'es' : ''} seleccionado{selectedHospitals.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDeactivate}
                disabled={isBulkDeactivating}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isBulkDeactivating ? 'Desactivando...' : 'Desactivar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isBulkDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedHospitals([])}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedHospitals.length === hospitals.length && hospitals.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Seleccionar todos los hospitales"
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('name')}
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
              <TableHead>Proyectos</TableHead>
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
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
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
                  <TableCell>
                    <Checkbox
                      checked={selectedHospitals.includes(hospital.id)}
                      onCheckedChange={(checked) => handleSelectHospital(hospital.id, checked as boolean)}
                      aria-label={`Seleccionar ${hospital.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {hospital.projects?.[0]?.redcap_id || '-'}
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
                    <div className="text-sm">
                      <div className="font-medium">{hospital.active_projects || 0} proyecto{(hospital.active_projects || 0) !== 1 ? 's' : ''} activo{(hospital.active_projects || 0) !== 1 ? 's' : ''}</div>
                      <div className="text-xs text-gray-500">{(hospital.historical_projects || 0)} proyecto{(hospital.historical_projects || 0) !== 1 ? 's' : ''} histórico{(hospital.historical_projects || 0) !== 1 ? 's' : ''}</div>
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
                          <Link href={`/${locale}/hospitals/${hospital.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/hospitals/${hospital.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeactivateHospital(hospital)}
                          disabled={isDeactivating}
                          className="text-orange-600"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {isDeactivating ? 'Desactivando...' : 'Desactivar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteHospital(hospital)}
                          disabled={isDeleting}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting ? 'Eliminando...' : 'Eliminar'}
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

      {/* Removed periods configuration modal - periods are project-specific */}

      {/* Modal de confirmación para desactivar múltiples hospitales */}
      <Dialog open={showBulkDeactivateModal} onOpenChange={setShowBulkDeactivateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactivar Hospitales</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres desactivar {selectedHospitals.length} hospital{selectedHospitals.length !== 1 ? 'es' : ''}? 
              Los hospitales desactivados no aparecerán como activos en el sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeactivateModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmBulkDeactivate}
              disabled={isBulkDeactivating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isBulkDeactivating ? 'Desactivando...' : 'Desactivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar múltiples hospitales */}
      <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Hospitales Permanentemente</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar permanentemente {selectedHospitals.length} hospital{selectedHospitals.length !== 1 ? 'es' : ''}? 
              Esta acción no se puede deshacer y todos los datos serán borrados de la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              variant="destructive"
            >
              {isBulkDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast de confirmación */}
      <ConfirmationToast
        isOpen={!!confirmationData}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        options={confirmationData?.options || { title: '', description: '' }}
        isLoading={isDeactivating || isDeleting}
      />

      {/* Modal de confirmación de cascada */}
      {cascadeData && (
        <CascadeConfirmationModal
          isOpen={showCascadeModal}
          onClose={() => {
            setShowCascadeModal(false);
            setCascadeData(null);
          }}
          onConfirm={handleConfirmCascadeDeletion}
          title={`Eliminar Hospital: ${cascadeData.hospitalName}`}
          description={cascadeData.message}
          actions={cascadeData.actions || []}
          warnings={cascadeData.warnings || []}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
