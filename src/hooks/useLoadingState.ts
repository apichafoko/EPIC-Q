import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  executeWithLoading: <T>(asyncFunction: () => Promise<T>) => Promise<T>;
}

export function useLoadingState(initialState: boolean = false): LoadingState {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const executeWithLoading = useCallback(async <T>(asyncFunction: () => Promise<T>): Promise<T> => {
    try {
      startLoading();
      return await asyncFunction();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    executeWithLoading
  };
}
