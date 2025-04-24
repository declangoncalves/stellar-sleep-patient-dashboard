// frontend/src/components/Modal.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

import styles from './Modal.module.css';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ children, onClose }: ModalProps) {
  // Create a div for the portal
  const el = document.createElement('div');

  useEffect(() => {
    document.body.append(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50`}
      onClick={onClose}
    >
      <div
        className={`${styles.modal} bg-white p-6 rounded-lg shadow-lg`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    el,
  );
}
