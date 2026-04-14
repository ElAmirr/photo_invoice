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
    Wallet,
    XCircle,
    Clock,
    CheckCircle,
    Filter,
    DollarSign,
    FileCheck
} from 'lucide-react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import { fr } from 'date-fns/locale';
import { useToast } from '../components/Toast';

const Factures = () => {
    const { addToast } = useToast();
    const [factures, setFactures] = useState([]);
    const [clients, setClients] = useState([]);
    const [shootings, setShootings] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });

    const [form, setForm] = useState({
        client_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'unpaid',
        shooting_id: '',
        bon_commande: '',
        tva_suspended: false,
        suspension_number: ''
    });
    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
    const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: format(new Date(), 'yyyy-MM-dd'), method: 'cash', note: '' });

    // Filters
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'paid', 'unpaid'
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const fetchData = async () => {
        try {
            let facturesUrl = '/factures';
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (filterStartDate && filterEndDate) {
                params.append('startDate', filterStartDate);
                params.append('endDate', filterEndDate);
            }
            if (params.toString()) facturesUrl += `?${params.toString()}`;

            const [fRes, cRes, sRes] = await Promise.all([
                api.get(facturesUrl),
                api.get('/clients'),
                api.get('/shootings')
            ]);
            setFactures(fRes.data);
            setClients(cRes.data);
            setShootings(sRes.data);
        } catch (err) {
            console.error(err);
            addToast('Erreur lors de l\'enregistrement de la facture: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterStatus, filterStartDate, filterEndDate]);

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
                shooting_id: res.data.shooting_id || '',
                bon_commande: res.data.bon_commande || '',
                tva_suspended: !!res.data.tva_suspended,
                suspension_number: res.data.suspension_number || ''
            });
            setItems(res.data.items);
        } else {
            setForm({
                client_id: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                status: 'unpaid',
                shooting_id: '',
                bon_commande: '',
                tva_suspended: false,
                suspension_number: ''
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
        if (detailModal.data?.status === 'paid') return;
        if (!detailModal.data?.id) {
            return addToast('Impossible d\'ajouter un paiement: facture non valide.', 'error');
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
            addToast('✅ Paiement ajouté avec succès !', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erreur lors de l\'ajout du paiement : ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleQuickPay = async (facture) => {
        const remaining = Number(facture.total_amount || 0) - Number(facture.total_paid || 0);
        if (remaining <= 0) return;

        if (window.confirm(`Marquer la facture ${facture.reference} comme payée (${remaining.toFixed(3)} TND) ?`)) {
            try {
                await api.post('/payments', {
                    shooting_id: facture.shooting_id || null,
                    facture_id: facture.id,
                    amount: remaining,
                    payment_date: format(new Date(), 'yyyy-MM-dd'),
                    method: 'virement',
                    note: 'Paiement rapide (un clic)'
                });
                fetchData();
                addToast('✅ Facture marquée comme payée !', 'success');
            } catch (err) {
                console.error(err);
                addToast('Erreur lors du paiement rapide', 'error');
            }
        }
    };
    const handleDeletePayment = async (id) => {
        if (!window.confirm('Supprimer ce paiement ?')) return;
        try {
            await api.delete(`/payments/${id}`);
            handleOpenDetail(detailModal.data.id);
            fetchData();
            addToast('✅ Paiement supprimé', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erreur lors de la suppression du paiement : ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleClose = () => {
        setModal({ isOpen: false, data: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.client_id) return addToast('Veuillez choisir un client', 'error');
        if (items.length === 0) return addToast('Veuillez ajouter au moins une ligne', 'error');

        try {
            if (modal.data) {
                await api.put(`/factures/${modal.data.id}`, { ...form, items });
            } else {
                await api.post('/factures', { ...form, items });
            }
            fetchData();
            handleClose();
            // Prevent focus freeze in Electron
            addToast('✅ Facture enregistrée avec succès !', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erreur lors de l\'enregistrement de la facture: ' + (err.response?.data?.error || err.message), 'error');
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
            addToast('Erreur lors du téléchargement du PDF', 'error');
        }
    };

    const filtered = factures.filter(f =>
        f.reference.toLowerCase().includes(search.toLowerCase()) ||
        f.client_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', padding: '20px 24px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                        <FileCheck size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>Mes Factures</h1>
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}><span style={{ fontWeight: '700', color: '#8b5cf6' }}>{factures.length}</span> factures au total</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpen()}>
                    <Plus size={18} /> Nouvelle Facture
                </button>
            </div>
            {/* Filter Bar */}
            <div className="card" style={{ marginBottom: '24px', padding: '15px 24px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statut</span>
                        <select
                            className="form-control"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                padding: '8px 16px',
                                width: 'auto',
                                borderRadius: '12px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                fontWeight: '600',
                                backgroundColor: 'white',
                                color: '#1e293b',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">Toutes les factures</option>
                            <option value="paid">Payées uniquement</option>
                            <option value="unpaid">Non Payées / Partiels</option>
                        </select>
                    </div>

                    <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Période</span>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '2px 8px', width: '300px' }}>
                                <DatePicker
                                    selected={filterStartDate ? new Date(filterStartDate) : null}
                                    onChange={(date) => setFilterStartDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                    dateFormat="dd/MM/yy"
                                    placeholderText="Début"
                                    className="custom-datepicker"
                                    style={{ border: 'none', padding: '6px', fontSize: '13px', fontWeight: '600', color: '#1e293b', outline: 'none', width: '80px' }}
                                />
                                <span style={{ color: '#94a3b8', margin: '0 4px', fontSize: '12px', fontWeight: '800' }}>→</span>
                                <DatePicker
                                    selected={filterEndDate ? new Date(filterEndDate) : null}
                                    onChange={(date) => setFilterEndDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                    dateFormat="dd/MM/yy"
                                    placeholderText="Fin"
                                    className="custom-datepicker"
                                    style={{ border: 'none', padding: '6px', fontSize: '13px', fontWeight: '600', color: '#1e293b', outline: 'none', width: '80px' }}
                                />
                            </div>
                        </div>

                        {(filterStatus !== 'all' || filterStartDate || filterEndDate) && (
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterStartDate('');
                                    setFilterEndDate('');
                                }}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    borderRadius: '12px',
                                    color: '#ef4444',
                                    borderColor: '#fee2e2',
                                    backgroundColor: '#fef2f2'
                                }}
                            >
                                Réinitialiser
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
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
                            <th style={{ textAlign: 'center' }}>Statut</th>
                            <th style={{ textAlign: 'right' }}>Montant TTC</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(f => {
                            const remaining = Number(f.total_amount || 0) - Number(f.total_paid || 0);
                            const isPaid = remaining <= 0.01;
                            const isPartial = !isPaid && Number(f.total_paid || 0) > 0;
                            return (
                                <tr key={f.id}>
                                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{f.reference}</td>
                                    <td>{f.client_name}</td>
                                    <td>{f.date ? format(new Date(f.date), 'dd/MM/yy') : '-'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {isPaid ? (
                                            <span className="badge badge-paid" style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Payée</span>
                                        ) : isPartial ? (
                                            <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Partiel</span>
                                        ) : (
                                            <span className="badge badge-unpaid" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Non Payée</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '800', color: '#1e293b' }}>{(f.total_amount || 0).toFixed(3).replace('.', ',')} TND</div>
                                        {!isPaid && (
                                            <>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>Payé: {(f.total_paid || 0).toFixed(3).replace('.', ',')} TND</div>
                                                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>
                                                    Reste: {remaining.toFixed(3).replace('.', ',')} TND
                                                </div>
                                            </>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {remaining > 0 && (
                                                <button
                                                    onClick={() => handleQuickPay(f)}
                                                    className="btn btn-outline"
                                                    style={{ padding: '6px', color: '#10b981', backgroundColor: '#ecfdf5' }}
                                                    title="Marquer comme payé (Rapide)"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => downloadPdf(f.id, f.reference)} className="btn btn-outline" style={{ padding: '6px', color: '#10b981' }} title="Télécharger PDF">
                                                <FileDown size={16} />
                                            </button>
                                            <button onClick={() => handleOpenDetail(f.id)} className="btn btn-outline" style={{ padding: '6px' }} title="Paiements">
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
                            );
                        })}
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
                                className="input"
                                value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
                                required disabled={!!form.shooting_id}
                                style={{ backgroundColor: form.shooting_id ? '#f8fafc' : 'white', cursor: form.shooting_id ? 'not-allowed' : 'default' }}
                            >
                                <option value="">Sélectionner un client</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {form.shooting_id && <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>Client verrouillé par le shooting choisi</span>}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Bon de commande n° (optionnel)</label>
                            <input
                                placeholder="ex: 12345"
                                className="input"
                                value={form.bon_commande} onChange={e => setForm({ ...form, bon_commande: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '24px', gridColumn: 'span 2', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '600' }}>Régime TVA</label>
                                <div style={{
                                    display: 'flex',
                                    backgroundColor: '#f1f5f9',
                                    padding: '4px',
                                    borderRadius: '12px',
                                    gap: '4px',
                                    width: 'fit-content',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div
                                        onClick={() => setForm({ ...form, tva_suspended: false })}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: !form.tva_suspended ? 'white' : 'transparent',
                                            color: !form.tva_suspended ? '#8b5cf6' : '#64748b',
                                            boxShadow: !form.tva_suspended ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                            border: !form.tva_suspended ? '1px solid #e0e7ff' : '1px solid transparent'
                                        }}
                                    >
                                        TVA 19%
                                    </div>
                                    <div
                                        onClick={() => setForm({ ...form, tva_suspended: true })}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: form.tva_suspended ? 'white' : 'transparent',
                                            color: form.tva_suspended ? '#8b5cf6' : '#64748b',
                                            boxShadow: form.tva_suspended ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                            border: form.tva_suspended ? '1px solid #e0e7ff' : '1px solid transparent'
                                        }}
                                    >
                                        Suspendu (0%)
                                    </div>
                                </div>
                            </div>

                            {form.tva_suspended && (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: '600' }}>N° Attestation de suspension</label>
                                    <input
                                        placeholder="ex: 2026-AS-001"
                                        className="input"
                                        style={{ height: '42px' }}
                                        value={form.suspension_number} onChange={e => setForm({ ...form, suspension_number: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Date de facturation</label>
                            <DatePicker
                                selected={form.date ? new Date(form.date) : null}
                                onChange={(date) => setForm({ ...form, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                dateFormat="dd/MM/yy"
                                className="input"
                                wrapperClassName="full-width"
                                placeholderText="Choisir une date"
                            />
                        </div>


                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Camera size={16} /> Lier à un shooting (optionnel)
                            </label>
                            <select
                                className="input"
                                value={form.shooting_id} onChange={e => setForm({ ...form, shooting_id: e.target.value })}
                            >
                                <option value="">Aucun shooting</option>
                                {shootings.map(s => <option key={s.id} value={s.id}>{s.title} ({format(new Date(s.shooting_date), 'dd/MM/yy')})</option>)}
                            </select>
                        </div>
                    </div>

                    <ItemsTable items={items} setItems={setItems} tvaSuspended={form.tva_suspended} />

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
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{format(new Date(detailModal.data.date), 'dd/MM/yy')}</p>
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
                                            <td>{p.payment_date ? format(new Date(p.payment_date), 'dd/MM/yy') : '-'}</td>
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
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Date</label>
                                    <DatePicker
                                        selected={paymentForm.payment_date ? new Date(paymentForm.payment_date) : null}
                                        onChange={(date) => setPaymentForm({ ...paymentForm, payment_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                        dateFormat="dd/MM/yy"
                                        className="input"
                                        placeholderText="Date"
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
