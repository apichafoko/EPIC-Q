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
    setConfirmationData({ options, onConfirm, onCancel });
    setIsConfirming(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmationData) return;
    
    try {
      await confirmationData.onConfirm();
      toast.success('Acción completada');
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
