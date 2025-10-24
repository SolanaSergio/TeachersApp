import React, { useEffect, useState } from 'react';
import { XIcon } from '../Icons';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(toast.id), 300); // Wait for fade out animation
  };

  const baseClasses = "flex items-center justify-between w-full max-w-xs p-4 text-brand-text rounded-lg shadow-lg transition-all duration-300";
  const typeClasses = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`${baseClasses} ${typeClasses[toast.type]} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="text-sm font-semibold">{toast.message}</div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-full hover:bg-black/20"
        aria-label="Dismiss"
      >
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
