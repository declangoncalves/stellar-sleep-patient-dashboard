// frontend/src/components/Modal.tsx
'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

import styles from './Modal.module.css';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ children, onClose }: ModalProps) {
  const [isExiting, setIsExiting] = useState(false);
  const el = document.createElement('div');

  useEffect(() => {
    document.body.append(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match the exit animation duration
  }, [onClose]);

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
        className={`${styles.modal} ${isExiting ? styles.modalExit : ''} bg-white p-6 rounded-lg shadow-lg`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    el,
  );
}
