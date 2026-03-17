import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Search, Phone, Briefcase } from 'lucide-react';

const Freelancers = () => {
    const [freelancers, setFreelancers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [form, setForm] = useState({ name: '', phone: '', specialty: '' });

    const fetchFreelancers = () => {
        api.get('/freelancers')
            .then(res => setFreelancers(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchFreelancers();
    }, []);

    const handleOpen = (data = null) => {
        if (data) setForm(data);
        else setForm({ name: '', phone: '', specialty: '' });
        setModal({ isOpen: true, data });
    };

    const handleClose = () => setModal({ isOpen: false, data: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modal.data) {
                await api.put(`/freelancers/${modal.data.id}`, form);
            } else {
                await api.post('/freelancers', form);
            }
            fetchFreelancers();
            handleClose();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'enregistrement');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer ce freelancer ?')) {
            await api.delete(`/freelancers/${id}`);
            fetchFreelancers();
        }
    };

    const filtered = freelancers.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.specialty.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Gestion des Freelancers</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{freelancers.length} freelancers enregistrés</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpen()}>
                    <Plus size={18} /> Nouveau Freelancer
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        placeholder="Rechercher par nom ou spécialité..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
                    />
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Freelancer</th>
                            <th>Contact</th>
                            <th>Spécialité</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(f => (
                            <tr key={f.id}>
                                <td>
                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{f.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: #{f.id}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                        <Phone size={14} color="var(--primary)" /> {f.phone}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                        <Briefcase size={14} color="var(--text-muted)" /> {f.specialty}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleOpen(f)} className="btn btn-outline" style={{ padding: '6px' }} title="Modifier">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(f.id)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444' }} title="Supprimer">
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
                title={modal.data ? 'Modifier le Freelancer' : 'Nouveau Freelancer'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Nom complet</label>
                        <input
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Téléphone</label>
                        <input
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Spécialité (ex: Vidéaste, Monteur, Second Photographe)</label>
                        <input
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }}>
                        {modal.data ? 'Mettre à jour' : 'Créer le freelancer'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Freelancers;
