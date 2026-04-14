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
    Clock,
    Filter,
    File
} from 'lucide-react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import { fr } from 'date-fns/locale';

const Devis = () => {
    const [devis, setDevis] = useState([]);
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [convModal, setConvModal] = useState({
        isOpen: false,
        devisId: null,
        form: { shooting_date: '', start_time: '', duration: '', location: '' }
    });

    // Filters
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'accepted', 'rejected'
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // Form
    const [form, setForm] = useState({
        client_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        status: 'pending',
        title: '',
        bon_commande: '',
        tva_suspended: false,
        suspension_number: ''
    });
    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, total_price: 0 }]);

    const fetchData = async () => {
        try {
            let devisUrl = '/devis';
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (filterStartDate && filterEndDate) {
                params.append('startDate', filterStartDate);
                params.append('endDate', filterEndDate);
            }
            if (params.toString()) devisUrl += `?${params.toString()}`;

            const [dRes, cRes] = await Promise.all([
                api.get(devisUrl),
                api.get('/clients')
            ]);
            setDevis(dRes.data);
            setClients(cRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterStatus, filterStartDate, filterEndDate]);

    const handleOpen = async (data = null) => {
        if (data) {
            const res = await api.get(`/devis/${data.id}`);
            setForm({
                client_id: res.data.client_id,
                date: format(new Date(res.data.date), 'yyyy-MM-dd'),
                valid_until: format(new Date(res.data.valid_until), 'yyyy-MM-dd'),
                status: res.data.status,
                title: res.data.title || '',
                bon_commande: res.data.bon_commande || '',
                tva_suspended: !!res.data.tva_suspended,
                suspension_number: res.data.suspension_number || ''
            });
            setItems(res.data.items);
        } else {
            setForm({
                client_id: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                status: 'pending',
                title: '',
                bon_commande: '',
                tva_suspended: false,
                suspension_number: ''
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
            // Use setTimeout to prevent focus freeze in Electron
            setTimeout(() => {
                alert('✅ Devis enregistré avec succès !');
            }, 100);
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

    const convertToFacture = (id, devisDate) => {
        setConvModal({
            isOpen: true,
            devisId: id,
            form: {
                shooting_date: format(new Date(devisDate), 'yyyy-MM-dd'),
                start_time: '10:00',
                duration: '2',
                location: ''
            }
        });
    };

    const handleConfirmConversion = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/devis/${convModal.devisId}/convert`, convModal.form);
            setConvModal({ ...convModal, isOpen: false });
            fetchData();
            // Use setTimeout to prevent focus trap in Electron after modal unmounts
            setTimeout(() => {
                alert('✅ Shooting planifié et Facture générée avec succès !');
            }, 150);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la conversion: ' + (err.response?.data?.error || err.message));
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
        d.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.title?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', padding: '20px 24px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                        <File size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>Mes Devis</h1>
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}><span style={{ fontWeight: '700', color: '#8b5cf6' }}>{devis.length}</span> devis enregistrés</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpen()}>
                    <Plus size={18} /> Nouveau Devis
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
                            <option value="all">Tous les devis</option>
                            <option value="pending">En attente</option>
                            <option value="accepted">Acceptés</option>
                            <option value="rejected">Rejetés</option>
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
                                <td>
                                    <div style={{ fontWeight: '600' }}>{d.client_name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.title || '(Sans titre)'}</div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '13px' }}>{d.date ? format(new Date(d.date), 'dd/MM/yy') : '-'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expire le: {d.valid_until ? format(new Date(d.valid_until), 'dd/MM/yy') : '-'}</div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700' }}>{(d.total_amount || 0).toFixed(3).replace('.', ',')} TND</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className={`badge badge-${d.status}`}>
                                        {d.status === 'pending' ? 'En attente' : d.status === 'accepted' ? 'Accepté' : 'Rejeté'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <div style={{ width: '100px', display: 'flex', justifyContent: 'center' }}>
                                            {!d.facture_id ? (
                                                <button
                                                    onClick={() => convertToFacture(d.id, d.date)}
                                                    className="btn btn-sm"
                                                    style={{
                                                        backgroundColor: '#fef3c7',
                                                        color: '#92400e',
                                                        width: '100%',
                                                        gap: '4px'
                                                    }}
                                                    title="Convertir en facture"
                                                >
                                                    <RefreshCw size={14} /> <span>Convertir</span>
                                                </button>
                                            ) : (
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: '#10b981',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    backgroundColor: '#ecfdf5',
                                                    width: '100%',
                                                    height: '28px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #d1fae5'
                                                }}>
                                                    <CheckCircle size={12} /> Converti
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)', margin: '0 4px' }}></div>
                                        <button onClick={() => downloadPdf(d.id, d.reference)} className="btn btn-outline" style={{ padding: '6px', color: '#10b981' }} title="Télécharger PDF">
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
                                className="input"
                                value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required
                            >
                                <option value="">Sélectionner un client</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
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
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Date du devis</label>
                            <DatePicker
                                selected={form.date ? new Date(form.date) : null}
                                onChange={(date) => setForm({ ...form, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                dateFormat="dd/MM/yy"
                                className="input"
                                wrapperClassName="full-width"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Valable jusqu'au</label>
                            <DatePicker
                                selected={form.valid_until ? new Date(form.valid_until) : null}
                                onChange={(date) => setForm({ ...form, valid_until: date ? format(date, 'yyyy-MM-dd') : '' })}
                                dateFormat="dd/MM/yy"
                                className="input"
                                wrapperClassName="full-width"
                            />
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

                    <ItemsTable items={items} setItems={setItems} tvaSuspended={form.tva_suspended} />

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '30px', width: '100%', justifyContent: 'center', padding: '14px' }}>
                        {modal.data ? 'Mettre à jour le devis' : 'Créer le devis'}
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={convModal.isOpen}
                onClose={() => setConvModal({ ...convModal, isOpen: false })}
                title="Détails du Shooting (Conversion)"
            >
                <form onSubmit={handleConfirmConversion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Veuillez confirmer les informations de planification pour la création automatique du shooting.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Date du shooting</label>
                        <DatePicker
                            selected={convModal.form.shooting_date ? new Date(convModal.form.shooting_date) : null}
                            onChange={(date) => setConvModal({ ...convModal, form: { ...convModal.form, shooting_date: date ? format(date, 'yyyy-MM-dd') : '' } })}
                            dateFormat="dd/MM/yy"
                            className="input"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Heure de début</label>
                            <input
                                type="text" placeholder="14:00"
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={convModal.form.start_time}
                                onChange={e => setConvModal({ ...convModal, form: { ...convModal.form, start_time: e.target.value } })}
                            />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Durée (heures)</label>
                            <input
                                type="number"
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={convModal.form.duration}
                                onChange={e => setConvModal({ ...convModal, form: { ...convModal.form, duration: e.target.value } })}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Lieu / Adresse</label>
                        <input
                            placeholder="ex: Sidi Bou Saïd, Tunis"
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            value={convModal.form.location}
                            onChange={e => setConvModal({ ...convModal, form: { ...convModal.form, location: e.target.value } })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConvModal({ ...convModal, isOpen: false })}>Annuler</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Confirmer et Convertir</button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default Devis;
