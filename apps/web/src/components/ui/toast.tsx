'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-900/90 text-green-200 border-green-700',
  error: 'bg-red-900/90 text-red-200 border-red-700',
  info: 'bg-gray-800/90 text-gray-200 border-gray-600',
};

let toastId = 0;
let addToastFn: ((text: string, variant?: ToastVariant) => void) | null = null;

/** Show a toast from anywhere in the app. */
export function showToast(text: string, variant: ToastVariant = 'info') {
  addToastFn?.(text, variant);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, variant: ToastVariant = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, text, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-lg border px-4 py-3 text-sm shadow-lg transition-opacity',
            variantStyles[t.variant],
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
