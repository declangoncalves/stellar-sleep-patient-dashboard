// frontend/src/components/Modal.tsx
'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

import styles from './Modal.module.css';
import { Button } from '../Button/Button';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
}

export function Modal({ children, onClose, title }: ModalProps) {
  const [isExiting, setIsExiting] = useState(false);
  const el = document.createElement('div');

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match the exit animation duration
  }, [onClose]);

  useEffect(() => {
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${
        isExiting ? styles.backdropExit : styles.modalBackdrop
      }`}
      onClick={handleClose}
    >
      <div
        className={`${styles.modal} ${isExiting ? styles.modalExit : ''} px-10 pt-12 pb-6 bg-white rounded-lg shadow-lg flex flex-col max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex-none flex justify-between items-center pb-4">
            <h2 className="text-3xl font-regular text-gray-900 text-black">
              {title}
            </h2>
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 absolute top-4 right-4"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>,
    el,
  );
}
