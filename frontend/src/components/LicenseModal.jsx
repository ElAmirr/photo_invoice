import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, Smartphone, ShieldCheck, Clock, Key, Shield } from 'lucide-react';

const LicenseModal = ({ onAuthenticated }) => {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hwid, setHwid] = useState('');

    useEffect(() => {
        const init = async () => {
            if (!window.electron) return;
            const id = await window.electron.getHwid();
            setHwid(id);
        };
        init();
    }, []);

    const handleActivate = async (e) => {
        e.preventDefault();
        if (!key) return setError('Veuillez entrer une clé de licence');

        setLoading(true);
        setError('');

        try {
            const appInfo = await window.electron.getAppInfo();
            const response = await axios.post(
                'https://photo-invoice-licence-sever.onrender.com/api/activate',
                {
                    key: key.trim(),
                    hwid: hwid,
                    version: appInfo.version,
                    os: appInfo.os
                },
                { timeout: 40000 } // 40s timeout for Render cold starts
            );

            if (response.data.success) {
                // DEBUG: Show what the server actually sent
                console.log('Server activation response:', response.data);

                const expiryDate = response.data.expiresAt || response.data.expires_at || null;
                await window.electron.saveLicense({
                    activated: true,
                    key: key.trim(),
                    hwid: hwid,
                    activatedAt: new Date().toISOString(),
                    expiresAt: expiryDate
                });
                onAuthenticated();
            } else {
                setError(response.data.message || 'Clé de licence invalide');
            }
        } catch (err) {
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                setError('Le serveur se réveille, veuillez réessayer dans 30 secondes...');
            } else {
                setError('Erreur de connexion au serveur de licence');
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(10, 10, 26, 0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                backgroundColor: '#1a1a2e',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '440px',
                padding: '40px',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
            }}>
                {/* Background Decorative Gradient */}
                <div style={{
                    position: 'absolute',
                    top: '-100px',
                    right: '-100px',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 50%, #C026D3 100%)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 10px 20px rgba(147, 51, 234, 0.3)'
                        }}>
                            <img src="/logo.png" alt="Logo" style={{ width: '64px', height: '64px' }} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Activation Shootix</h2>
                        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Entrez votre clé pour débloquer votre studio</p>
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            padding: '12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleActivate}>
                        <div style={{ marginBottom: '24px', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }}>
                                <Key size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                style={{
                                    width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155',
                                    borderRadius: '12px', padding: '14px 14px 14px 44px', color: 'white',
                                    fontSize: '14px', outline: 'none', transition: 'all 0.2s',
                                    fontFamily: 'monospace'
                                }}
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 50%, #C026D3 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '14px',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 15px rgba(147, 51, 234, 0.4)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
                            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                            {loading ? 'Vérification...' : 'Activer maintenant'}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                            Pas de clé ? <a href="https://shootix.tn" target="_blank" rel="noopener noreferrer" style={{ color: '#A855F7', fontWeight: '600', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); window.open('https://shootix.tn', '_blank'); }}>Obtenir une clé d'essai</a>
                        </p>
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '4px' }}>Identifiant Machine (HWID):</p>
                        <code style={{ color: '#9333EA', fontSize: '10px', backgroundColor: 'rgba(147, 51, 234, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                            {hwid || 'Génération...'}
                        </code>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LicenseModal;
