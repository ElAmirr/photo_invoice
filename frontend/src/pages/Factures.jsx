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
    Camera,
    Eye,
    ChevronRight,
    DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const Factures = () => {
    const [factures, setFactures] = useState([]);
    const [clients, setClients] = useState([]);
    const [shootings, setShootings] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });

    // Form
    const [form, setForm] = useState({
        client_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'unpaid',
        shooting_id: ''
    });
    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
    const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: format(new Date(), 'yyyy-MM-dd'), method: 'cash', note: '' });

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

    // Sync client with shooting
    useEffect(() => {
        if (form.shooting_id) {
            const selectedShot = shootings.find(s => String(s.id) === String(form.shooting_id));
            if (selectedShot) {
                setForm(prev => ({ ...prev, client_id: selectedShot.client_id }));
            }
        }
    }, [form.shooting_id, shootings]);

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

    const loadPaymentsForFacture = async (factureId, shootingId) => {
        if (!factureId && !shootingId) return [];
        try {
            if (factureId) {
                const res = await api.get(`/payments/facture/${factureId}`);
                return res.data;
            }
            const res = await api.get(`/payments/shooting/${shootingId}`);
            return res.data;
        } catch (err) {
            console.error('Erreur chargement paiements:', err);
            return [];
        }
    };

    const handleOpenDetail = async (id) => {
        try {
            const res = await api.get(`/factures/${id}`);
            const payments = await loadPaymentsForFacture(res.data.id, res.data.shooting_id);
            setDetailModal({ isOpen: true, data: { ...res.data, payments } });
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        if (!detailModal.data?.shooting_id && !detailModal.data?.id) {
            return alert('Impossible d\'ajouter un paiement: facture non valide.');
        }
        try {
            await api.post('/payments', {
                shooting_id: detailModal.data.shooting_id || null,
                facture_id: detailModal.data.id || null,
                amount: Number(paymentForm.amount),
                payment_date: paymentForm.payment_date,
                method: paymentForm.method,
                note: paymentForm.note
            });
            const refreshed = await api.get(`/factures/${detailModal.data.id}`);
            const payments = await loadPaymentsForFacture(refreshed.data.id, refreshed.data.shooting_id);
            setDetailModal({ isOpen: true, data: { ...refreshed.data, payments } });
            setPaymentForm({ amount: '', payment_date: format(new Date(), 'yyyy-MM-dd'), method: 'cash', note: '' });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'ajout du paiement : ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeletePayment = async (id) => {
        if (!window.confirm('Supprimer ce paiement ?')) return;
        try {
            await api.delete(`/payments/${id}`);
            const refreshed = await api.get(`/factures/${detailModal.data.id}`);
            const payments = await loadPaymentsForFacture(refreshed.data.id, refreshed.data.shooting_id);
            setDetailModal({ isOpen: true, data: { ...refreshed.data, payments } });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la suppression du paiement : ' + (err.response?.data?.error || err.message));
        }
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
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '700' }}>{Math.round(f.total_amount || 0)} TND</div>
                                    <div style={{ fontSize: '11px', color: '#10b981' }}>Payé: {Math.round(f.total_paid || 0)} TND</div>
                                    {Number(f.total_amount || 0) - Number(f.total_paid || 0) > 0 && (
                                        <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>
                                            Reste: {Math.round(Number(f.total_amount || 0) - Number(f.total_paid || 0))} TND
                                        </div>
                                    )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleOpenDetail(f.id)} className="btn btn-outline" style={{ padding: '6px' }} title="Détails">
                                            <Eye size={16} />
                                        </button>
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
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: form.shooting_id ? '#f8fafc' : 'white', cursor: form.shooting_id ? 'not-allowed' : 'default' }}
                                value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
                                required disabled={!!form.shooting_id}
                            >
                                <option value="">Sélectionner un client</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {form.shooting_id && <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>Client verrouillé par le shooting choisi</span>}
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
            <Modal
                isOpen={detailModal.isOpen}
                onClose={() => setDetailModal({ isOpen: false, data: null })}
                title={detailModal.data ? `Détails Facture: ${detailModal.data.reference}` : ''}
            >
                {detailModal.data && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 180px', minWidth: '180px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total TTC</p>
                                <h4 style={{ fontSize: '18px', fontWeight: '700' }}>{Math.round(detailModal.data.total_amount)} TND</h4>
                            </div>
                            <div style={{ flex: '1 1 180px', minWidth: '180px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Payé</p>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{Math.round(detailModal.data.total_paid || 0)} TND</h4>
                            </div>
                            <div style={{ flex: '1 1 180px', minWidth: '180px', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                <p style={{ fontSize: '12px', color: '#b91c1c', marginBottom: '4px' }}>Reste</p>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#b91c1c' }}>{Math.round(Number(detailModal.data.total_amount || 0) - Number(detailModal.data.total_paid || 0))} TND</h4>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Client</p>
                                <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{detailModal.data.client_name}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{detailModal.data.client_email}</p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date & Réf</p>
                                <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{detailModal.data.reference}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{format(new Date(detailModal.data.date), 'dd MMMM yyyy')}</p>
                            </div>
                        </div>

                        {detailModal.data.shooting_id && (
                            <div style={{ padding: '12px 16px', backgroundColor: 'var(--primary-light)', borderRadius: '8px', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Camera size={18} color="var(--primary)" />
                                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>
                                    Liée au Shooting: {detailModal.data.shooting_title || 'N/A'}
                                </span>
                            </div>
                        )}

                        <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <DollarSign size={18} color="var(--primary)" /> Paiements liés
                            </h3>

                            <table style={{ fontSize: '13px', marginBottom: '12px' }}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Montant</th>
                                        <th>Méthode</th>
                                        <th>Note</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(detailModal.data.payments || []).map(p => (
                                        <tr key={p.id}>
                                            <td>{p.payment_date ? format(new Date(p.payment_date), 'dd/MM/yyyy') : '-'}</td>
                                            <td style={{ fontWeight: '600' }}>{Math.round(p.amount || 0)} TND</td>
                                            <td>{p.method}</td>
                                            <td>{p.note || '-'}</td>
                                            <td>
                                                <button onClick={() => handleDeletePayment(p.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }} title="Supprimer">x</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(detailModal.data.payments || []).length === 0 && (
                                        <tr><td colSpan="5" style={{ color: 'var(--text-muted)', padding: '10px' }}>Aucun paiement enregistré.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            <form onSubmit={handleAddPayment} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr auto', gap: '8px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Montant</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Date</label>
                                    <input
                                        type="date"
                                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                        value={paymentForm.payment_date}
                                        onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Méthode</label>
                                    <select
                                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                        value={paymentForm.method}
                                        onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                    >
                                        <option value="cash">Espèces</option>
                                        <option value="virement">Virement</option>
                                        <option value="cheque">Chèque</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: '600' }}>Note</label>
                                    <input
                                        type="text"
                                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                        value={paymentForm.note}
                                        onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                        placeholder="Optionnel"
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
                                    <Plus size={14} />
                                </button>
                            </form>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Détail des prestations</h3>
                            <table style={{ fontSize: '13px' }}>
                                <thead style={{ backgroundColor: 'transparent' }}>
                                    <tr>
                                        <th>Description</th>
                                        <th style={{ textAlign: 'center' }}>Qté</th>
                                        <th style={{ textAlign: 'right' }}>Prix Unitaire</th>
                                        <th style={{ textAlign: 'right' }}>Total HT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailModal.data.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.description}</td>
                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>{Math.round(item.unit_price)} TND</td>
                                            <td style={{ textAlign: 'right', fontWeight: '600' }}>{Math.round(item.total_price)} TND</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ alignSelf: 'flex-end', width: '250px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span>Total HT:</span>
                                <span>{Math.round(detailModal.data.subtotal_amount)} TND</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span>TVA (19%):</span>
                                <span>{Math.round(detailModal.data.tax_amount)} TND</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                                <span>Total TTC:</span>
                                <span style={{ color: 'var(--primary)' }}>{Math.round(detailModal.data.total_amount)} TND</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Factures;
