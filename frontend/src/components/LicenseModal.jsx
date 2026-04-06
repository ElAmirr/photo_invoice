import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, Smartphone, ShieldCheck, Clock, Key } from 'lucide-react';

const LicenseModal = ({ onAuthenticated }) => {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hwid, setHwid] = useState('');
    const [trialStatus, setTrialStatus] = useState(null);

    useEffect(() => {
        const init = async () => {
            if (!window.electron) return;
            const id = await window.electron.getHwid();
            setHwid(id);
            const status = await window.electron.checkLicense();
            if (status.trialStartedAt) {
                const start = new Date(status.trialStartedAt);
                const now = new Date();
                const diffTime = Math.abs(now - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setTrialStatus({
                    remaining: Math.max(0, 5 - diffDays),
                    isExpired: diffDays > 5
                });
            }
        };
        init();
    }, []);

    const handleActivate = async (e) => {
        e.preventDefault();
        if (!key) return setError('Veuillez entrer une clé de licence');

        setLoading(true);
        setError('');

        try {
            // Note: The URL will be replaced with the real Render URL later
            const response = await axios.post('https://shootix-license-server.onrender.com/api/activate', {
                key: key,
                hwid: hwid
            });

            if (response.data.success) {
                await window.electron.saveLicense({
                    activated: true,
                    key: key,
                    hwid: hwid,
                    activatedAt: new Date().toISOString()
                });
                onAuthenticated();
            } else {
                setError(response.data.message || 'Clé de licence invalide');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur de licence');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTrial = async () => {
        setLoading(true);
        const res = await window.electron.startTrial();
        setTrialStatus({ remaining: 5, isExpired: false });
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(10, 10, 26, 0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                backgroundColor: '#1a1a2e', width: '450px', borderRadius: '24px',
                padding: '40px', border: '1px solid rgba(108, 99, 255, 0.3)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: 'white', textAlign: 'center'
            }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '16px',
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px', border: '1px solid rgba(108, 99, 255, 0.2)'
                }}>
                    <Lock size={32} color="#6C63FF" />
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Activation de Shootix</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>
                    Veuillez entrer votre clé de licence pour continuer ou démarrer votre essai gratuit.
                </p>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171', padding: '12px', borderRadius: '12px',
                        fontSize: '13px', marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleActivate}>
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                            <Key size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            style={{
                                width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155',
                                borderRadius: '12px', padding: '14px 14px 14px 44px', color: 'white',
                                fontSize: '15px', outline: 'none', transition: 'border-color 0.2s'
                            }}
                            value={key}
                            onChange={(e) => setKey(e.target.value.toUpperCase())}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', backgroundColor: '#6C63FF', color: 'white',
                            border: 'none', borderRadius: '12px', padding: '14px',
                            fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'transform 0.1s, opacity 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Vérification...' : (
                            <>
                                <ShieldCheck size={18} />
                                Activer maintenant
                            </>
                        )}
                    </button>
                </form>

                <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>OU</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
                </div>

                {!trialStatus ? (
                    <button
                        onClick={handleStartTrial}
                        disabled={loading}
                        style={{
                            width: '100%', backgroundColor: 'transparent', color: '#94a3b8',
                            border: '1px solid #334155', borderRadius: '12px', padding: '12px',
                            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        Démarrer l'essai gratuit (5 jours)
                    </button>
                ) : (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        color: trialStatus.isExpired ? '#f87171' : '#10b981', fontSize: '13px', fontWeight: '600'
                    }}>
                        <Clock size={16} />
                        {trialStatus.isExpired
                            ? "Votre essai gratuit a expiré."
                            : `Période d'essai : ${trialStatus.remaining} jours restants`
                        }
                    </div>
                )}

                <div style={{ marginTop: '32px', fontSize: '11px', color: '#475569' }}>
                    ID Machine: {hwid || 'Chargement...'}
                </div>
            </div>
        </div>
    );
};

export default LicenseModal;
