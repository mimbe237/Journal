"use client";

import { useEffect, useRef, type PropsWithChildren } from "react";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  /** Full screen on mobile (default: true) */
  fullScreenMobile?: boolean;
  /** Max width on desktop */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidthClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  fullScreenMobile = true,
  maxWidth = "lg",
}: PropsWithChildren<ModalProps>) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={clsx(
          "bg-white shadow-xl w-full overflow-hidden flex flex-col",
          // Mobile: full screen (or bottom sheet style)
          fullScreenMobile
            ? "h-full sm:h-auto sm:rounded-lg max-h-screen sm:max-h-[90vh]"
            : "rounded-t-2xl sm:rounded-lg max-h-[90vh]",
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 shrink-0">
            <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-slate-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors -mr-2"
              aria-label="Fermer"
            >
              <svg
                className="w-5 h-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

/** Modal footer for action buttons */
export function ModalFooter({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        "flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0",
        className
      )}
    >
      {children}
    </div>
  );
}
