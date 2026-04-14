import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '800px', hideHeader = false }) => {
    const previousFocusRef = useRef(null);
    // ... existing useEffect ...
    if (!isOpen) return null;

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                cursor: 'pointer'
            }}
        >
            <div className="card" style={{
                width: '90%',
                maxWidth: maxWidth,
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                cursor: 'default',
                padding: hideHeader ? '40px' : '24px'
            }}>
                {!hideHeader && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{title}</h2>
                        <button onClick={onClose} style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)'
                        }}>
                            <X size={24} />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};

export default Modal;
