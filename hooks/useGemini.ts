import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

type AsyncFunction<T, P extends any[]> = (...params: P) => Promise<T>;

export const useGemini = <T, P extends any[]>(
  apiFunction: AsyncFunction<T, P>,
  successMessage?: string,
  errorMessagePrefix: string = 'An error occurred'
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { showToast } = useToast();

  const execute = useCallback(async (...params: P) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await apiFunction(...params);
      setData(result);
      if (successMessage) {
        showToast(successMessage, 'success');
      }
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      console.error(`${errorMessagePrefix}:`, err);
      showToast(`${errorMessagePrefix}. ${err.message}`, 'error');
      // Re-throw the error so that the caller can handle it if needed
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, showToast, successMessage, errorMessagePrefix]);

  return { isLoading, error, data, execute, setData };
};