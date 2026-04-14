import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Search, Phone, Mail, MapPin, Wallet, Users } from 'lucide-react';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [detailModal, setDetailModal] = useState({ isOpen: false, data: null, analytics: null });
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', matricule_fiscale: '' });

    const fetchClients = () => {
        api.get('/clients')
            .then(res => setClients(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleOpen = (data = null) => {
        if (data) setForm(data);
        else setForm({ name: '', email: '', phone: '', address: '', matricule_fiscale: '' });
        setModal({ isOpen: true, data });
    };

    const handleClose = () => setModal({ isOpen: false, data: null });

    const handleOpenDetail = async (data) => {
        try {
            const res = await api.get(`/clients/${data.id}/analytics`);
            setDetailModal({ isOpen: true, data, analytics: res.data });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseDetail = () => setDetailModal({ isOpen: false, data: null, analytics: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modal.data) {
                await api.put(`/clients/${modal.data.id}`, form);
            } else {
                await api.post('/clients', form);
            }
            fetchClients();
            handleClose();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'enregistrement');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer ce client ?')) {
            await api.delete(`/clients/${id}`);
            fetchClients();
        }
    };

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (value) => {
        return Math.round(value || 0) + ' TND';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', padding: '20px 24px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                        <Users size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>Mes Clients</h1>
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}><span style={{ fontWeight: '700', color: '#8b5cf6' }}>{clients.length}</span> clients enregistrés</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpen()}>
                    <Plus size={18} /> Nouveau Client
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        placeholder="Rechercher un client..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
                    />
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Contact</th>
                            <th>Localisation</th>
                            <th>Matricule Fiscale</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id}>
                                <td>
                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{c.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: #{c.id}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px' }}>
                                        <Mail size={14} color="var(--primary)" /> {c.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                        <Phone size={14} color="var(--primary)" /> {c.phone}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                        <MapPin size={14} color="var(--text-muted)" /> {c.address}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontSize: '13px', fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                        {c.matricule_fiscale}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleOpenDetail(c)} className="btn btn-outline" style={{ padding: '6px' }} title="Paiements">
                                            <Wallet size={16} />
                                        </button>
                                        <button onClick={() => handleOpen(c)} className="btn btn-outline" style={{ padding: '6px' }} title="Modifier">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(c.id)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444' }} title="Supprimer">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={handleClose}
                title={modal.data ? 'Modifier le Client' : 'Nouveau Client'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Nom complet</label>
                        <input
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Email</label>
                            <input
                                type="email"
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                            />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Téléphone</label>
                            <input
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Adresse</label>
                        <input
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Matricule Fiscale</label>
                        <input
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            value={form.matricule_fiscale} onChange={e => setForm({ ...form, matricule_fiscale: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }}>
                        {modal.data ? 'Mettre à jour' : 'Créer le client'}
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={detailModal.isOpen}
                onClose={handleCloseDetail}
                title={`Détails - ${detailModal.data?.name}`}
            >
                {detailModal.analytics && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Factures</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                                    {detailModal.analytics.total_factures_count}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    {formatCurrency(detailModal.analytics.total_factures_amount)}
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Payé</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                                    {formatCurrency(detailModal.analytics.total_paid)}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    {detailModal.analytics.total_factures_amount > 0
                                        ? `${Math.round((detailModal.analytics.total_paid / detailModal.analytics.total_factures_amount) * 100)}% payé`
                                        : 'N/A'
                                    }
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>À payer</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                                    {formatCurrency(detailModal.analytics.balance_due)}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Reste à percevoir
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Shootings</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                                    {detailModal.analytics.shooting_count}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Projets liés
                                </div>
                            </div>
                        </div>
                        <button onClick={handleCloseDetail} className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                            Fermer
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Clients;
