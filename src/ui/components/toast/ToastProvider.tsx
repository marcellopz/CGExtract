import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import "./ToastProvider.css";
import {
  ToastContext,
  type ToastContextValue,
  type ToastType,
} from "./toastContext";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const DEFAULT_DURATION_MS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  error: 8000, // errors stay longer so they can be read
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: "✔",
  error: "✖",
  info: "ℹ",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue["showToast"]>(
    (message, type = "info", durationMs) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismissToast(id), durationMs ?? DEFAULT_DURATION_MS[type]);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
            onClick={() => dismissToast(toast.id)}
            title="Click to dismiss"
          >
            <span className="toast-icon">{TOAST_ICONS[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
