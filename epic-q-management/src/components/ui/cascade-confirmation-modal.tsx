'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Building, Trash2, UserX } from 'lucide-react';

interface CascadeAction {
  type: 'unassign' | 'delete' | 'notify';
  description: string;
  data?: any;
}

interface CascadeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteCoordinators: boolean) => void;
  title: string;
  description: string;
  actions: CascadeAction[];
  warnings?: string[];
  isLoading?: boolean;
}

export function CascadeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actions,
  warnings = [],
  isLoading = false
}: CascadeConfirmationModalProps) {
  const [deleteCoordinators, setDeleteCoordinators] = useState(false);

  const handleConfirm = () => {
    onConfirm(deleteCoordinators);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'unassign':
        return <UserX className="h-4 w-4 text-orange-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'notify':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <User className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActionBadgeVariant = (type: string) => {
    switch (type) {
      case 'unassign':
        return 'secondary';
      case 'delete':
        return 'destructive';
      case 'notify':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'unassign':
        return 'Desasignar';
      case 'delete':
        return 'Eliminar';
      case 'notify':
        return 'Notificar';
      default:
        return 'Acción';
    }
  };

  const hasDeleteActions = actions.some(action => action.type === 'delete');
  const hasUnassignActions = actions.some(action => action.type === 'unassign');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Advertencias */}
          {warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {warnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Acciones que se realizarán */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Acciones que se realizarán:</h4>
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getActionIcon(action.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getActionBadgeVariant(action.type)}>
                        {getActionLabel(action.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                    {action.data && (
                      <div className="mt-2 text-xs text-gray-500">
                        {action.type === 'unassign' && action.data.otherHospitals && (
                          <div>
                            <strong>Otros hospitales asignados:</strong> {action.data.otherHospitals.join(', ')}
                          </div>
                        )}
                        {action.type === 'notify' && action.data.hospitals && (
                          <div>
                            <strong>Hospitales afectados:</strong> {action.data.hospitals.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opción para eliminar coordinadores */}
          {hasDeleteActions && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Checkbox
                id="delete-coordinators"
                checked={deleteCoordinators}
                onCheckedChange={(checked) => setDeleteCoordinators(checked as boolean)}
              />
              <div className="space-y-1">
                <label
                  htmlFor="delete-coordinators"
                  className="text-sm font-medium text-yellow-800 cursor-pointer"
                >
                  Eliminar coordinadores que solo están asignados a este hospital
                </label>
                <p className="text-xs text-yellow-700">
                  Los coordinadores que están asignados a otros hospitales solo serán desasignados de este hospital.
                </p>
              </div>
            </div>
          )}

          {/* Información adicional */}
          {hasUnassignActions && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Los coordinadores que están asignados a otros hospitales solo serán desasignados de este hospital, 
                manteniendo sus asignaciones en otros hospitales.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Procesando...' : 'Confirmar Eliminación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
