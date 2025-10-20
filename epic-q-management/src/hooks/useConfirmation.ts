'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function useConfirmation() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    options: ConfirmationOptions;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  } | null>(null);

  const confirm = useCallback((
    options: ConfirmationOptions,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    console.log('🔧 useConfirmation: confirm called with options:', options);
    setConfirmationData({ options, onConfirm, onCancel });
    // Al abrir el modal, NO debe estar en estado de "procesando"
    setIsConfirming(false);
    console.log('🔧 useConfirmation: confirmationData set, isConfirming:', false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmationData) return;
    
    setIsConfirming(true); // Establecer como true cuando se inicia la acción
    
    try {
      await confirmationData.onConfirm();
      // No mostrar toast automático aquí, dejar que cada función maneje sus propios mensajes
    } catch (error) {
      console.error('Error in confirmation action:', error);
      toast.error('Error al completar la acción');
    } finally {
      setIsConfirming(false);
      setConfirmationData(null);
    }
  }, [confirmationData]);

  const handleCancel = useCallback(() => {
    if (confirmationData?.onCancel) {
      confirmationData.onCancel();
    }
    setIsConfirming(false);
    setConfirmationData(null);
  }, [confirmationData]);

  return {
    confirm,
    isConfirming,
    confirmationData,
    handleConfirm,
    handleCancel,
  };
}
