import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Search, Phone, Mail, MapPin } from 'lucide-react';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null });
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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Gestion des Clients</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{clients.length} clients enregistrés</p>
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
        </div>
    );
};

export default Clients;
