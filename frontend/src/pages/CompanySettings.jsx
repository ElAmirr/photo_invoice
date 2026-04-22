import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Save, Upload, Building2, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../components/Toast';

const CompanySettings = () => {
    const { addToast } = useToast();
    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        matricule_fiscale: '',
        patente: '',
        logo: null
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [licenseInfo, setLicenseInfo] = useState(null);
    const [appInfo, setAppInfo] = useState({ version: '...', os: '...' });
    const [updateStatus, setUpdateStatus] = useState({
        checking: false,
        available: null,
        latestVersion: null,
        releaseNotes: null,
        progress: 0,
        ready: false
    });

    const [activeTab, setActiveTab] = useState('studio');
    const [commsSettings, setCommsSettings] = useState({ smtp: {}, templates: [] });
    const [smtpForm, setSmtpForm] = useState({
        host: '', port: 587, user: '', pass: '', secure: 0, from_name: '', from_email: ''
    });

    useEffect(() => {
        // Fetch company info
        api.get('/company')
            .then(res => {
                if (res.data.id) {
                    setForm({ ...res.data, logo: null });
                    if (res.data.logo) setPreview(res.data.logo);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));

        // Fetch license info from Electron, then re-fetch after heartbeat completes
        if (window.electron) {
            window.electron.getAppInfo().then(setAppInfo);
            window.electron.checkLicense().then(info => {
                setLicenseInfo(info);
            });

            // Listen for update events
            window.electron.onUpdateProgress((percent) => {
                setUpdateStatus(prev => ({ ...prev, progress: Math.round(percent), available: true }));
            });
            window.electron.onUpdateReady(() => {
                setUpdateStatus(prev => ({ ...prev, progress: 100, ready: true }));
                addToast('Mise à jour prête à être installée !', 'success');
            });

            // Re-fetch after 5s
            setTimeout(() => {
                window.electron.checkLicense().then(info => {
                    setLicenseInfo(info);
                });
            }, 5000);
        }

        fetchComms();
    }, []);

    const fetchComms = async () => {
        try {
            const res = await api.get('/communications/settings');
            setCommsSettings(res.data);
            setSmtpForm(res.data.smtp);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCheckUpdate = async () => {
        if (!window.electron) return;
        setUpdateStatus(prev => ({ ...prev, checking: true }));
        try {
            const result = await window.electron.manualCheckUpdates();
            if (result.success) {
                setUpdateStatus({
                    checking: false,
                    available: result.updateAvailable,
                    latestVersion: result.version,
                    releaseNotes: result.releaseNotes,
                    progress: 0,
                    ready: false
                });
                if (result.updateAvailable) {
                    addToast(`Mise à jour disponible: v${result.version}`, 'info');
                } else {
                    if (result.releaseNotes === "Update check skipped in development mode.") {
                        addToast('Vérification ignorée en mode développement (nécessite une version installée).', 'info');
                    } else {
                        addToast('Votre application est à jour.', 'success');
                    }
                }
            } else {
                setUpdateStatus(prev => ({ ...prev, checking: false }));
                addToast(`Erreur de mise à jour: ${result.error}`, 'error');
            }
        } catch (err) {
            setUpdateStatus(prev => ({ ...prev, checking: false }));
            addToast('Erreur lors de la vérification', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({ ...prev, logo: file }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const data = new FormData();
        Object.keys(form).forEach(key => {
            if (form[key] !== null) data.append(key, form[key]);
        });

        try {
            const res = await api.put('/company', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast('Paramètres enregistrés !', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erreur lors de l\'enregistrement', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', padding: '20px 24px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>

                        <Building2 size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>Mon Studio</h1>
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>Informations et paramètres du studio</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('studio')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'studio' ? 'white' : 'transparent',
                            color: activeTab === 'studio' ? 'var(--primary)' : '#64748b',
                            boxShadow: activeTab === 'studio' ? '0 2px 8px rgba(139, 92, 246, 0.2)' : 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Profil Studio
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('comms')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'comms' ? 'white' : 'transparent',
                            color: activeTab === 'comms' ? 'var(--primary)' : '#64748b',
                            boxShadow: activeTab === 'comms' ? '0 2px 8px rgba(139, 92, 246, 0.2)' : 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Messagerie
                    </button>
                </div>
            </div>

            {activeTab === 'studio' ? (
                <form className="card" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '50px', marginBottom: '20px' }}>
                        <div style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '12px',
                            border: '2px dashed var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            backgroundColor: '#f8fafc'
                        }}>
                            {preview ? (
                                <img src={preview.startsWith('blob') ? preview : `http://127.0.0.1:5055${preview}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <Upload size={32} color="#94a3b8" />
                            )}
                        </div>
                        <div>
                            <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                                Choisir un logo
                                <input type="file" hidden onChange={handleFile} accept="image/*" />
                            </label>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>PNG, JPG ou WEBP. Max 2MB.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Nom du studio</label>
                        <input className="input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            name="name" value={form.name} onChange={handleChange} required />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Email professionnel</label>
                        <input className="input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            type="email" name="email" value={form.email} onChange={handleChange} required />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Adresse</label>
                        <input className="input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            name="address" value={form.address} onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Téléphone</label>
                        <input className="input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            name="phone" value={form.phone} onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Matricule fiscale</label>
                        <input className="input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            name="matricule_fiscale" value={form.matricule_fiscale} onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px', color: 'var(--primary)' }}>Informations Bancaires</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '600' }}>Nom de la banque</label>
                                <input className="input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    name="bank_name" value={form.bank_name || ''} onChange={handleChange} placeholder="ex: Amen Bank" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '600' }}>Numéro de compte (RIB)</label>
                                <input className="input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    name="account_number" value={form.account_number || ''} onChange={handleChange} placeholder="00 000 0000000000000 00" />
                            </div>
                        </div>
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>Payment Plan</h2>
                            <div style={{
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                Active
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Type de plan</span>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                                    {(licenseInfo?.expiresAt || licenseInfo?.expires_at) ? 'Abonnement Mensuel' : 'Licence à vie (Lifetime)'}
                                </span>
                            </div>
                            {(licenseInfo?.expiresAt || licenseInfo?.expires_at) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Date d'expiration</span>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#e11d48' }}>
                                        {format(new Date(licenseInfo.expiresAt || licenseInfo.expires_at), 'dd/MM/yy')}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Clé de licence</span>
                                <code style={{ fontSize: '11px', color: '#64748b' }}>{licenseInfo?.key || 'N/A'}</code>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>ID Machine (HWID)</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>{licenseInfo?.hwid || 'Chargement...'}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Version de l'application</span>
                                    <span style={{ padding: '2px 8px', backgroundColor: '#e2e8f0', borderRadius: '10px', fontSize: '11px', fontWeight: '600', color: '#475569' }}>v{appInfo.version}</span>
                                </div>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                                    {updateStatus.available === true
                                        ? `Nouvelle version disponible : v${updateStatus.latestVersion}`
                                        : updateStatus.available === false
                                            ? 'Votre application est à jour'
                                            : 'Vérifiez si une nouvelle version est disponible'}
                                </p>
                                {updateStatus.releaseNotes && (
                                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '6px', borderLeft: '3px solid #A855F7' }}>
                                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Nouveautés :</span>
                                        <div
                                            style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}
                                            dangerouslySetInnerHTML={{ __html: typeof updateStatus.releaseNotes === 'string' ? updateStatus.releaseNotes : Array.isArray(updateStatus.releaseNotes) ? updateStatus.releaseNotes.map(n => n.note).join('<br/>') : '' }}
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={updateStatus.ready ? () => window.electron.quitAndInstall() : handleCheckUpdate}
                                disabled={updateStatus.checking || (updateStatus.progress > 0 && updateStatus.progress < 100)}
                                className={`btn ${updateStatus.available === true ? 'btn-primary' : 'btn-outline'}`}
                                style={{ padding: '8px 16px', fontSize: '12px', height: 'auto', minWidth: '100px' }}
                            >
                                <RefreshCw size={14} className={(updateStatus.checking || (updateStatus.progress > 0 && updateStatus.progress < 100)) ? 'spin' : ''} />
                                {updateStatus.checking
                                    ? 'Vérification...'
                                    : updateStatus.progress > 0 && updateStatus.progress < 100
                                        ? `${updateStatus.progress}%`
                                        : updateStatus.ready
                                            ? 'Installer'
                                            : updateStatus.available === true
                                                ? 'Mettre à jour'
                                                : 'Vérifier'}
                            </button>
                        </div>
                        {updateStatus.progress > 0 && updateStatus.progress < 100 && (
                            <div style={{ marginTop: '10px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${updateStatus.progress}%`, backgroundColor: '#A855F7', transition: 'width 0.3s ease' }}></div>
                            </div>
                        )}
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                            <Save size={18} />
                            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres du studio'}
                        </button>
                    </div>
                </form>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Messaging Tab Content */}
                    <div className="card">
                        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Building2 size={20} /> Configuration SMTP (Email)
                        </h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            api.post('/communications/settings/smtp', smtpForm)
                                .then(() => addToast('SMTP configuré !', 'success'))
                                .catch(err => addToast('Erreur SMTP', 'error'));
                        }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Serveur SMTP</label>
                                <input className="input" placeholder="smtp.gmail.com" value={smtpForm.host} onChange={e => setSmtpForm({ ...smtpForm, host: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Port</label>
                                <input className="input" type="number" placeholder="587" value={smtpForm.port} onChange={e => setSmtpForm({ ...smtpForm, port: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Utilisateur / Email</label>
                                <input className="input" placeholder="votre@email.com" value={smtpForm.user} onChange={e => setSmtpForm({ ...smtpForm, user: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Mot de passe (App Password)</label>
                                <input className="input" type="password" value={smtpForm.pass} onChange={e => setSmtpForm({ ...smtpForm, pass: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Nom de l'expéditeur</label>
                                <input className="input" placeholder="Mon Studio Photo" value={smtpForm.from_name} onChange={e => setSmtpForm({ ...smtpForm, from_name: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Email de l'expéditeur</label>
                                <input className="input" placeholder="noreply@studio.com" value={smtpForm.from_email} onChange={e => setSmtpForm({ ...smtpForm, from_email: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                <input type="checkbox" checked={smtpForm.secure === 1} onChange={e => setSmtpForm({ ...smtpForm, secure: e.target.checked ? 1 : 0 })} />
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Utiliser SSL/TLS (Port 465)</label>
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ height: '42px', flex: 1 }}>Enregistrer les paramètres SMTP</button>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ height: '42px', flex: 1, borderColor: '#8b5cf6', color: '#8b5cf6' }}
                                    onClick={() => {
                                        api.post('/communications/settings/smtp/test', smtpForm)
                                            .then(res => addToast(res.data.message || 'Succès !', 'success'))
                                            .catch(err => addToast(err.response?.data?.error || 'Erreur de test SMTP', 'error'));
                                    }}
                                >
                                    Tester la connexion
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Building2 size={20} /> Modèles de Messages
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {commsSettings.templates.map(tpl => (
                                <div key={tpl.id} style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '15px', color: '#1e293b' }}>
                                        {tpl.type === 'email_devis' ? '📧 Email : Envoi de Devis' : tpl.type === 'email_facture' ? '📧 Email : Envoi de Facture' : '📱 WhatsApp : Rappel Shooting'}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {tpl.type.startsWith('email') && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Objet du mail</label>
                                                <input className="input" value={tpl.subject} onChange={e => {
                                                    const next = [...commsSettings.templates];
                                                    next.find(t => t.id === tpl.id).subject = e.target.value;
                                                    setCommsSettings({ ...commsSettings, templates: next });
                                                }} />
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Message Body</label>
                                            <textarea className="input" rows={4} style={{ resize: 'vertical', minHeight: '100px' }} value={tpl.body} onChange={e => {
                                                const next = [...commsSettings.templates];
                                                next.find(t => t.id === tpl.id).body = e.target.value;
                                                setCommsSettings({ ...commsSettings, templates: next });
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                                            Variables : {"{{client_name}}"}, {"{{studio_name}}"}, {"{{reference}}"}, {"{{date}}"}
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '12px' }}
                                            onClick={() => {
                                                api.post('/communications/settings/template', tpl)
                                                    .then(() => addToast('Modèle mis à jour !', 'success'))
                                                    .catch(() => addToast('Erreur template', 'error'));
                                            }}
                                        >
                                            Sauvegarder ce modèle
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanySettings;
