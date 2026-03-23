import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import ItemsTable from '../components/ItemsTable';
import {
    Plus,
    Edit,
    Search,
    FileDown,
    RefreshCw,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Devis = () => {
    const [devis, setDevis] = useState([]);
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null });

    // Form
    const [form, setForm] = useState({
        client_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        status: 'pending'
    });
    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, total_price: 0 }]);

    const fetchData = async () => {
        try {
            const [dRes, cRes] = await Promise.all([
                api.get('/devis'),
                api.get('/clients')
            ]);
            setDevis(dRes.data);
            setClients(cRes.data);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'enregistrement du devis: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = async (data = null) => {
        if (data) {
            const res = await api.get(`/devis/${data.id}`);
            setForm({
                client_id: res.data.client_id,
                date: format(new Date(res.data.date), 'yyyy-MM-dd'),
                valid_until: format(new Date(res.data.valid_until), 'yyyy-MM-dd'),
                status: res.data.status
            });
            setItems(res.data.items);
        } else {
            setForm({
                client_id: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                status: 'pending'
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
                await api.put(`/devis/${modal.data.id}`, { ...form, items });
            } else {
                await api.post('/devis', { ...form, items });
            }
            fetchData();
            handleClose();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'enregistrement du devis: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer ce devis ?')) {
            await api.delete(`/devis/${id}`);
            fetchData();
        }
    };

    const convertToFacture = async (id) => {
        if (window.confirm('Voulez-vous vraiment convertir ce devis en facture finale ? Cette action est irréversible.')) {
            try {
                await api.post(`/devis/${id}/convert`);
                alert('✅ Facture générée avec succès ! Retrouvez-la dans la section Factures.');
                fetchData();
            } catch (err) {
                console.error(err);
                alert('Erreur lors de la conversion: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const downloadPdf = async (id, ref) => {
        try {
            const response = await api.get(`/pdf/devis/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `devis-${ref}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            console.error(err);
            alert('Erreur lors du téléchargement du PDF');
        }
    };

    const filtered = devis.filter(d =>
        d.reference.toLowerCase().includes(search.toLowerCase()) ||
        d.client_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Gestion des Devis</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{devis.length} devis enregistrés</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpen()}>
                    <Plus size={18} /> Nouveau Devis
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
                            <th>Date / Validité</th>
                            <th style={{ textAlign: 'right' }}>Montant Total</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(d => (
                            <tr key={d.id}>
                                <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{d.reference}</td>
                                <td>{d.client_name}</td>
                                <td>
                                    <div style={{ fontSize: '13px' }}>{d.date ? format(new Date(d.date), 'dd/MM/yyyy') : '-'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expire le: {d.valid_until ? format(new Date(d.valid_until), 'dd/MM/yyyy') : '-'}</div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700' }}>{Number(d.total_amount || 0).toFixed(3)} DT</td>
                                <td>
                                    <span className={`badge badge-${d.status}`}>
                                        {d.status === 'pending' ? 'En attente' : d.status === 'accepted' ? 'Accepté' : 'Rejeté'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {!d.facture_id ? (
                                            <button
                                                onClick={() => convertToFacture(d.id)}
                                                className="btn"
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#10b981',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    border: 'none',
                                                    borderRadius: '6px'
                                                }}
                                                title="Convertir en facture"
                                            >
                                                <RefreshCw size={14} /> <span>Convertir</span>
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '4px' }}>
                                                <CheckCircle size={12} /> Converti
                                            </span>
                                        )}
                                        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)', margin: '0 4px' }}></div>
                                        <button onClick={() => downloadPdf(d.id, d.reference)} className="btn btn-outline" style={{ padding: '6px' }} title="Télécharger PDF">
                                            <FileDown size={16} />
                                        </button>
                                        <button onClick={() => handleOpen(d)} className="btn btn-outline" style={{ padding: '6px' }} title="Modifier">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(d.id)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444' }} title="Supprimer">
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
                title={modal.data ? `Modifier Devis ${modal.data.reference}` : 'Nouveau Devis'}
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
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
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Date du devis</label>
                            <input type="date" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Valide jusqu'au</label>
                            <input type="date" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Status</label>
                            <select style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="pending">En attente</option>
                                <option value="accepted">Accepté</option>
                                <option value="rejected">Rejeté</option>
                            </select>
                        </div>
                    </div>

                    <ItemsTable items={items} setItems={setItems} />

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '30px', width: '100%', justifyContent: 'center', padding: '14px' }}>
                        {modal.data ? 'Mettre à jour le devis' : 'Créer le devis'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Devis;
