import { createContext, useContext } from 'react';

export const ToastContext = createContext<(message: string) => void>(() => undefined);

/** Affiche une confirmation brève (voir ToastProvider). */
export function useToast() {
  return useContext(ToastContext);
}
