'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Mail, Download } from 'lucide-react';

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onBulkAction: (action: string, items: string[]) => void;
  availableActions?: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    variant?: 'default' | 'destructive';
  }>;
}

export function BulkActions({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  availableActions = [
    { id: 'delete', label: 'Eliminar', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive' as const },
    { id: 'export', label: 'Exportar', icon: <Download className="h-4 w-4" /> },
    { id: 'email', label: 'Enviar Email', icon: <Mail className="h-4 w-4" /> },
  ]
}: BulkActionsProps) {
  const [isAllSelected, setIsAllSelected] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setIsAllSelected(checked);
    onSelectAll(checked);
  };

  const handleBulkAction = (actionId: string) => {
    onBulkAction(actionId, selectedItems);
  };

  if (selectedItems.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id="select-all"
          checked={isAllSelected}
          onCheckedChange={handleSelectAll}
        />
        <label htmlFor="select-all" className="text-sm font-medium">
          Seleccionar todos ({totalItems})
        </label>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-blue-900">
          {selectedItems.length} elemento{selectedItems.length !== 1 ? 's' : ''} seleccionado{selectedItems.length !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-blue-600 hover:text-blue-800"
        >
          Limpiar selección
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Acciones masivas
              <MoreHorizontal className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones disponibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => handleBulkAction(action.id)}
                className={action.variant === 'destructive' ? 'text-red-600' : ''}
              >
                {action.icon}
                <span className="ml-2">{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
