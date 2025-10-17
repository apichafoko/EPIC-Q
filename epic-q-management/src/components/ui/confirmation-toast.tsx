'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useConfirmation, ConfirmationOptions } from '@/hooks/useConfirmation';

interface ConfirmationToastProps {
  isOpen: boolean;
  options: ConfirmationOptions;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationToast({ 
  isOpen, 
  options, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: ConfirmationToastProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Alert className={`max-w-md ${options.variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
        <AlertDescription className="font-medium mb-3">
          <div className="font-semibold mb-1">{options.title}</div>
          <div className="text-sm opacity-90">{options.description}</div>
        </AlertDescription>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {options.cancelText || 'Cancelar'}
          </Button>
          <Button 
            size="sm" 
            variant={options.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Procesando...
              </>
            ) : (
              options.confirmText || 'Confirmar'
            )}
          </Button>
        </div>
      </Alert>
    </div>
  );
}
