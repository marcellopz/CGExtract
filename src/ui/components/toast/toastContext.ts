import { createContext } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastContextValue {
  /** Shows a non-blocking toast. durationMs defaults depend on the type. */
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined
);
