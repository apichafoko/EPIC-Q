'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Edit, Save, X, AlertTriangle } from 'lucide-react';

export interface BulkEditField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'boolean' | 'date';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
}

export interface BulkEditProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: string, value: any, selectedItems: string[]) => Promise<void>;
  selectedItems: string[];
  fields: BulkEditField[];
  itemType: string;
  isLoading?: boolean;
}

export function BulkEdit({
  isOpen,
  onClose,
  onSave,
  selectedItems,
  fields,
  itemType,
  isLoading = false
}: BulkEditProps) {
  const [selectedField, setSelectedField] = useState<string>('');
  const [fieldValue, setFieldValue] = useState<any>('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedFieldConfig = fields.find(f => f.key === selectedField);

  const handleSave = async () => {
    if (!selectedField || !fieldValue) {
      setErrors({ field: 'Selecciona un campo y un valor' });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      await onSave(selectedField, fieldValue, selectedItems);
      handleClose();
    } catch (error) {
      setErrors({ general: 'Error al guardar los cambios' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedField('');
    setFieldValue('');
    setErrors({});
    onClose();
  };

  const renderFieldInput = () => {
    if (!selectedFieldConfig) return null;

    switch (selectedFieldConfig.type) {
      case 'text':
        return (
          <Input
            placeholder={selectedFieldConfig.placeholder || `Nuevo ${selectedFieldConfig.label.toLowerCase()}`}
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={selectedFieldConfig.placeholder || `Nuevo ${selectedFieldConfig.label.toLowerCase()}`}
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value ? Number(e.target.value) : '')}
          />
        );

      case 'select':
        return (
          <Select value={fieldValue} onValueChange={setFieldValue}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${selectedFieldConfig.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {selectedFieldConfig.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <Select value={fieldValue} onValueChange={(value) => setFieldValue(value === 'true')}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${selectedFieldConfig.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sí</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            Edición Masiva
          </DialogTitle>
          <DialogDescription>
            Editar {selectedItems.length} {itemType.toLowerCase()}{selectedItems.length !== 1 ? 's' : ''} seleccionado{selectedItems.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de elementos seleccionados */}
          <div>
            <Label className="text-sm font-medium">Elementos seleccionados:</Label>
            <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
              <div className="flex flex-wrap gap-1">
                {selectedItems.map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Selección de campo */}
          <div>
            <Label htmlFor="field-select" className="text-sm font-medium">
              Campo a editar
            </Label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger id="field-select">
                <SelectValue placeholder="Seleccionar campo..." />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.key} value={field.key}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input del valor */}
          {selectedField && (
            <div>
              <Label htmlFor="field-value" className="text-sm font-medium">
                Nuevo valor para "{selectedFieldConfig?.label}"
              </Label>
              {renderFieldInput()}
            </div>
          )}

          {/* Errores */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <div className="text-sm text-red-800">
                  {Object.values(errors).map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Advertencia:</p>
                <p>Esta acción modificará {selectedItems.length} elemento{selectedItems.length !== 1 ? 's' : ''} de forma permanente. Esta acción no se puede deshacer.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedField || !fieldValue || isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : `Guardar en ${selectedItems.length} elemento${selectedItems.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
