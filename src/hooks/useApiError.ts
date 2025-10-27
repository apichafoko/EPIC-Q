import { toast } from 'sonner';

export interface ApiError {
  error: string;
  details?: string;
}

export const useApiError = () => {
  const handleApiError = (error: ApiError, defaultMessage: string = 'Ha ocurrido un error') => {
    const errorMessage = error.details || error.error || defaultMessage;
    
    toast.error(error.error || defaultMessage, {
      description: error.details || 'Inténtalo de nuevo más tarde'
    });
  };

  const handleApiSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description
    });
  };

  return {
    handleApiError,
    handleApiSuccess
  };
};
