import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Save, Upload } from 'lucide-react';

const CompanySettings = () => {
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

        // Fetch license info from Electron
        if (window.electron) {
            window.electron.checkLicense().then(info => {
                setLicenseInfo(info);
            });
        }
    }, []);

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
            alert('Paramètres enregistrés !');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px' }}>Mon Studio</h1>

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
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>Licence & Abonnement</h2>
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
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Clé de licence</span>
                            <code style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{licenseInfo?.key || 'N/A'}</code>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Type de plan</span>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                                {licenseInfo?.expiresAt ? 'Abonnement Mensuel' : 'Licence à vie (Lifetime)'}
                            </span>
                        </div>
                        {licenseInfo?.expiresAt && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Date d'expiration</span>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#e11d48' }}>
                                    {new Date(licenseInfo.expiresAt).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>ID Machine (HWID)</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{licenseInfo?.hwid || 'Chargement...'}</span>
                        </div>
                    </div>
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                        <Save size={18} />
                        {saving ? 'Enregistrement...' : 'Enregistrer les paramètres du studio'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanySettings;
