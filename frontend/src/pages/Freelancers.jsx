import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Search, Phone, Briefcase, Wallet, UserCog } from 'lucide-react';
import { useToast } from '../components/Toast';

const Freelancers = () => {
    const { addToast } = useToast();
    const [freelancers, setFreelancers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [detailModal, setDetailModal] = useState({ isOpen: false, data: null, analytics: null });
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

    const handleOpenDetail = async (data) => {
        try {
            const res = await api.get(`/freelancers/${data.id}/analytics`);
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
                await api.put(`/freelancers/${modal.data.id}`, form);
            } else {
                await api.post('/freelancers', form);
            }
            fetchFreelancers();
            handleClose();
            addToast('✅ Coéquiper enregistré avec succès !', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erreur lors de l\'enregistrement', 'error');
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

    const formatCurrency = (value) => {
        return Math.round(value || 0) + ' TND';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', padding: '20px 24px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>

                        <UserCog size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>Mon Équipe</h1>
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}><span style={{ fontWeight: '700', color: '#8b5cf6' }}>{freelancers.length}</span> coequipers enregistrés</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpen()}>
                    <Plus size={18} /> Nouveau Coequiper
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
                                        <button onClick={() => handleOpenDetail(f)} className="btn btn-outline" style={{ padding: '6px' }} title="Paiements">
                                            <Wallet size={16} />
                                        </button>
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

            <Modal
                isOpen={detailModal.isOpen}
                onClose={handleCloseDetail}
                title={`Détails - ${detailModal.data?.name}`}
            >
                {detailModal.analytics && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Missions</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                                    {detailModal.analytics.total_assignments_count}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Projets assignés
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Montant convenu</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                                    {formatCurrency(detailModal.analytics.total_agreed_amount)}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Total des missions
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Montant payé</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                                    {formatCurrency(detailModal.analytics.total_paid_amount)}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    {detailModal.analytics.total_agreed_amount > 0
                                        ? `${Math.round((detailModal.analytics.total_paid_amount / detailModal.analytics.total_agreed_amount) * 100)}% versé`
                                        : 'N/A'
                                    }
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>À payer</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                                    {formatCurrency(detailModal.analytics.balance_owed)}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Reste dû
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

export default Freelancers;
