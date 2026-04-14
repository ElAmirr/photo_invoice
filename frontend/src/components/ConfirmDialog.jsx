import React, { useState, createContext, useContext } from 'react';
import Modal from './Modal';
import { AlertCircle, HelpCircle } from 'lucide-react';

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
    const [config, setConfig] = useState({
        isOpen: false,
        title: 'Confirmation',
        message: '',
        onConfirm: () => { },
        onCancel: () => { }
    });

    const confirm = (message, title = 'Confirmation') => {
        return new Promise((resolve) => {
            setConfig({
                isOpen: true,
                title,
                message,
                onConfirm: () => {
                    setConfig(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfig(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                }
            });
        });
    };

    const isDestructive = config.title.toLowerCase().includes('supprim') || config.title.toLowerCase().includes('retirer');

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <Modal
                isOpen={config.isOpen}
                onClose={config.onCancel}
                title={config.title}
                maxWidth="400px"
                hideHeader={true}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: isDestructive ? '#fee2e2' : '#eef2ff',
                        color: isDestructive ? '#ef4444' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px'
                    }}>
                        {isDestructive ? <AlertCircle size={32} /> : <HelpCircle size={32} />}
                    </div>

                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                            {config.title}
                        </h2>
                        <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            {config.message}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                        <button
                            className="btn btn-outline"
                            onClick={config.onCancel}
                            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700' }}
                        >
                            Annuler
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={config.onConfirm}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                backgroundColor: isDestructive ? '#ef4444' : 'var(--primary)',
                                border: 'none',
                                color: 'white'
                            }}
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </Modal>
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => useContext(ConfirmContext);
