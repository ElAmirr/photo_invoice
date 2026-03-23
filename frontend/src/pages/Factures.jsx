import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import ItemsTable from '../components/ItemsTable';
import {
    Plus,
    Edit,
    Search,
    FileDown,
    Trash2,
    Camera
} from 'lucide-react';
import { format } from 'date-fns';

const Factures = () => {
    const [factures, setFactures] = useState([]);
    const [clients, setClients] = useState([]);
    const [shootings, setShootings] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null });

    // Form
    const [form, setForm] = useState({
        client_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'unpaid',
        shooting_id: ''
    });
    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, total_price: 0 }]);

    const fetchData = async () => {
        try {
            const [fRes, cRes, sRes] = await Promise.all([
                api.get('/factures'),
                api.get('/clients'),
                api.get('/shootings')
            ]);
            setFactures(fRes.data);
            setClients(cRes.data);
            setShootings(sRes.data);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'enregistrement de la facture: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = async (data = null) => {
        if (data) {
            const res = await api.get(`/factures/${data.id}`);
            setForm({
                client_id: res.data.client_id,
                date: format(new Date(res.data.date), 'yyyy-MM-dd'),
                status: res.data.status,
                shooting_id: res.data.shooting_id || ''
            });
            setItems(res.data.items);
        } else {
            setForm({
                client_id: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                status: 'unpaid',
                shooting_id: ''
            });
            setItems([{ description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
        }
        setModal({ isOpen: true, data });
    };

    const handleClose = () => {
        setModal({ isOpen: false, data: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.client_id) return alert('Veuillez choisir un client');
        if (items.length === 0) return alert('Veuillez ajouter au moins une ligne');

        try {
            if (modal.data) {
                await api.put(`/factures/${modal.data.id}`, { ...form, items });
            } else {
                await api.post('/factures', { ...form, items });
            }
            fetchData();
            handleClose();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'enregistrement de la facture: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer cette facture ?')) {
            await api.delete(`/factures/${id}`);
            fetchData();
        }
    };

    const downloadPdf = async (id, ref) => {
        try {
            const response = await api.get(`/pdf/factures/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `facture-${ref}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            console.error(err);
            alert('Erreur lors du téléchargement du PDF');
        }
    };

    const filtered = factures.filter(f =>
        f.reference.toLowerCase().includes(search.toLowerCase()) ||
        f.client_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Gestion des Factures</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{factures.length} factures au total</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpen()}>
                    <Plus size={18} /> Nouvelle Facture
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        placeholder="Rechercher par référence ou client..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
                    />
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Référence</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Montant Total (TTC)</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(f => (
                            <tr key={f.id}>
                                <td>{f.reference}</td>
                                <td>{f.client_name}</td>
                                <td>{f.date ? format(new Date(f.date), 'dd/MM/yyyy') : '-'}</td>
                                <td style={{ textAlign: 'right', fontWeight: '700' }}>{Number(f.total_amount || 0).toFixed(3)} DT</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => downloadPdf(f.id, f.reference)} className="btn btn-outline" style={{ padding: '6px' }} title="Télécharger PDF">
                                            <FileDown size={16} />
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
                title={modal.data ? `Modifier Facture ${modal.data.reference}` : 'Nouvelle Facture'}
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Client</label>
                            <select
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required
                            >
                                <option value="">Sélectionner un client</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Date de facture</label>
                            <input type="date" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                        </div>


                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Camera size={16} /> Lier à un shooting (optionnel)
                            </label>
                            <select
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={form.shooting_id} onChange={e => setForm({ ...form, shooting_id: e.target.value })}
                            >
                                <option value="">Aucun shooting</option>
                                {shootings.map(s => <option key={s.id} value={s.id}>{s.title} ({format(new Date(s.shooting_date), 'dd/MM/yyyy')})</option>)}
                            </select>
                        </div>
                    </div>

                    <ItemsTable items={items} setItems={setItems} />

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '30px', width: '100%', justifyContent: 'center', padding: '14px' }}>
                        {modal.data ? 'Mettre à jour la facture' : 'Créer la facture'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Factures;
