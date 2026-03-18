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

    useEffect(() => {
        api.get('/company')
            .then(res => {
                if (res.data.id) {
                    setForm({ ...res.data, logo: null });
                    if (res.data.logo) setPreview(res.data.logo);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
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
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px' }}>Paramètres de l'entreprise</h1>

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
                            <img src={preview.startsWith('blob') ? preview : `http://localhost:5001${preview}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                    <label style={{ fontSize: '14px', fontWeight: '600' }}>Nom de l'entreprise</label>
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
                    <label style={{ fontSize: '14px', fontWeight: '600' }}>Matricule Fiscale</label>
                    <input className="input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        name="matricule_fiscale" value={form.matricule_fiscale} onChange={handleChange} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600' }}>Patente</label>
                    <input className="input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        name="patente" value={form.patente} onChange={handleChange} />
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                        <Save size={18} />
                        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanySettings;
