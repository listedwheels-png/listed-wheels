"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  asBottomSheetOnMobile?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  asBottomSheetOnMobile = true,
  maxWidth = "md",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-900/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          "w-full bg-surface border-t sm:border border-ink-200 shadow-xl overflow-hidden transition-transform duration-200 ease-out flex flex-col max-h-[90vh]",
          asBottomSheetOnMobile
            ? "rounded-t-[20px] sm:rounded-card"
            : "rounded-card",
          maxWidthStyles[maxWidth]
        )}
      >
        {/* Mobile Pull Handle for Bottom Sheet */}
        {asBottomSheetOnMobile && (
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 bg-ink-200 rounded-full" />
          </div>
        )}

        {/* Modal Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 pb-3 border-b border-ink-200/60">
            <div>
              {title && (
                <h3 id="modal-title" className="font-display font-bold text-lg text-ink-900 leading-snug">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-ink-500 mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-1 text-ink-500 hover:text-ink-900 rounded-full hover:bg-ink-200/50 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-ink-200/60 bg-paper/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
