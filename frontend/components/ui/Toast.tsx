"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  type?: ToastType;
  message: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = "info",
  message,
  duration = 4000,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const typeStyles = {
    success: "bg-surface border-success/40 text-ink-900",
    error: "bg-surface border-danger/40 text-ink-900",
    info: "bg-surface border-accent-500/40 text-ink-900",
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-success shrink-0" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-danger shrink-0" />;
      case "info":
        return <Info className="w-5 h-5 text-accent-500 shrink-0" />;
    }
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 p-4 rounded-btn border shadow-card max-w-sm w-full bg-surface transition-all duration-200 animate-in fade-in slide-in-from-bottom-3",
        typeStyles[type]
      )}
    >
      {getIcon()}
      <p className="text-sm font-medium flex-1 text-ink-900">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-ink-500 hover:text-ink-900 p-1 rounded-full hover:bg-ink-200/50 transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: Array<{ id: string; type?: ToastType; message: string }>;
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  );
};
