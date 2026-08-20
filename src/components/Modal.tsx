import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          className={`relative w-full ${sizeClasses[size]} animate-slide-up rounded-t-3xl bg-white shadow-xl sm:animate-fade-in-up sm:rounded-2xl`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
            <h3 className="min-w-0 truncate font-display text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
