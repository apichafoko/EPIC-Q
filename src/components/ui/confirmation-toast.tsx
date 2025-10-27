'use client';

import { Button } from '../../components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useConfirmation, ConfirmationOptions } from '../../hooks/useConfirmation';
import { useState, useEffect } from 'react';

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
  const [confirmationWord, setConfirmationWord] = useState('');
  const [isWordValid, setIsWordValid] = useState(false);

  // console.log('🔧 ConfirmationToast: isOpen:', isOpen, 'options:', options);

  // Validar palabra de confirmación - SIEMPRE ejecutar los hooks
  useEffect(() => {
    if (options?.confirmationWord) {
      setIsWordValid(confirmationWord === options.confirmationWord);
    } else {
      setIsWordValid(true);
    }
  }, [confirmationWord, options?.confirmationWord]);
  
  // Early return DESPUÉS de todos los hooks
  if (!isOpen || !options) {
    // console.log('🔧 ConfirmationToast: Not rendering - isOpen:', isOpen, 'options:', !!options);
    return null;
  }

  const handleConfirm = () => {
    if (options.confirmationWord && !isWordValid) {
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay con blur sutil */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Modal de confirmación */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Icono de advertencia */}
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-full ${options.variant === 'destructive' ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle className={`h-6 w-6 ${options.variant === 'destructive' ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <h3 className={`ml-3 text-lg font-semibold ${options.variant === 'destructive' ? 'text-red-900' : 'text-yellow-900'}`}>
            {options.title}
          </h3>
        </div>

        {/* Descripción */}
        <p className="text-gray-700 mb-6">
          {options.description}
        </p>

        {/* Campo de confirmación de palabra si es necesario */}
        {options.confirmationWord && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para confirmar, escribe: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{options.confirmationWord}</span>
            </label>
            <input
              type="text"
              value={confirmationWord}
              onChange={(e) => setConfirmationWord(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Escribe "${options.confirmationWord}"`}
              disabled={isLoading}
            />
            {confirmationWord && !isWordValid && (
              <p className="text-red-600 text-sm mt-1">La palabra no coincide</p>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {options.cancelText || 'Cancelar'}
          </Button>
          <Button 
            variant={options.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading || !isWordValid}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              options.confirmText || 'Confirmar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
