import { useCallback, useMemo, useState } from "react";

export type Toast = {
  id: number;
  message: string;
  type?: "info" | "success" | "error";
  durationMs?: number;
};

// Contexto en archivo separado (toast-context.ts) para cumplir regla fast-refresh
export type ToastContextValue = {
  show: (
    message: string,
    opts?: { type?: Toast["type"]; durationMs?: number }
  ) => void;
};

import { ToastContext } from "./toast-context";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback(
    (message: string, opts?: { type?: Toast["type"]; durationMs?: number }) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const t: Toast = {
        id,
        message,
        type: opts?.type ?? "info",
        durationMs: opts?.durationMs ?? 1800,
      };
      setToasts((prev) => [...prev, t]);
      // autodescartar
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, t.durationMs);
    },
    []
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Contenedor visual */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[1000]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={
              "rounded panel px-3 py-2 text-sm shadow " +
              (t.type === "success"
                ? "border-green-500"
                : t.type === "error"
                ? "border-red-500"
                : "")
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook extraído a hooks/useToast.ts para satisfacer la regla react-refresh/only-export-components
