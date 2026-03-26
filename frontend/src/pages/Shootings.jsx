import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Calendar as CalendarIcon,
    MapPin,
    User,
    DollarSign,
    ChevronRight,
    ChevronLeft,
    UserPlus,
    Users as UserSquare2,
    LayoutList,
    Calendar as CalendarViewIcon
} from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { fr } from 'date-fns/locale';

const Shootings = () => {
    const [shootings, setShootings] = useState([]);
    const [clients, setClients] = useState([]);
    const [freelancers, setFreelancers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('calendar'); // Default to calendar view
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Modals
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });

    // Forms
    const [form, setForm] = useState({
        client_id: '', title: '', shooting_date: '', location: '', total_price: 0, status: 'scheduled'
    });
    const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: format(new Date(), 'yyyy-MM-dd'), method: 'cash', note: '' });
    const [assignForm, setAssignForm] = useState({ freelancer_id: '', agreed_amount: '', paid_amount: 0 });

    const fetchData = async () => {
        try {
            const [sRes, cRes, fRes] = await Promise.all([
                api.get('/shootings'),
                api.get('/clients'),
                api.get('/freelancers')
            ]);
            setShootings(sRes.data);
            setClients(cRes.data);
            setFreelancers(fRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenMain = (data = null) => {
        if (data) {
            setForm({
                ...data,
                shooting_date: data.shooting_date ? format(new Date(data.shooting_date), 'yyyy-MM-dd') : ''
            });
        } else {
            setForm({ client_id: '', title: '', shooting_date: '', location: '', total_price: 0, status: 'scheduled', start_time: '', duration: '' });
        }
        setModal({ isOpen: true, data });
    };

    const handleOpenDetail = async (id) => {
        try {
            const res = await api.get(`/shootings/${id}`);
            setDetailModal({ isOpen: true, data: res.data });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmitMain = async (e) => {
        e.preventDefault();
        try {
            if (modal.data) {
                await api.put(`/shootings/${modal.data.id}`, form);
            } else {
                await api.post('/shootings', form);
            }
            fetchData();
            setModal({ isOpen: false, data: null });
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer ce shooting ?')) {
            await api.delete(`/shootings/${id}`);
            fetchData();
        }
    };

    // Payment actions
    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/payments', { ...paymentForm, shooting_id: detailModal.data.id });
            handleOpenDetail(detailModal.data.id);
            setPaymentForm({ amount: '', payment_date: format(new Date(), 'yyyy-MM-dd'), method: 'cash', note: '' });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePayment = async (id) => {
        if (window.confirm('Supprimer ce paiement ?')) {
            await api.delete(`/payments/${id}`);
            handleOpenDetail(detailModal.data.id);
            fetchData();
        }
    };

    // Freelancer actions
    const handleAssignFreelancer = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/shootings/${detailModal.data.id}/freelancers`, assignForm);
            handleOpenDetail(detailModal.data.id);
            setAssignForm({ freelancer_id: '', agreed_amount: '', paid_amount: 0 });
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveFreelancer = async (fId) => {
        if (window.confirm('Retirer ce freelancer ?')) {
            await api.delete(`/shootings/${detailModal.data.id}/freelancers/${fId}`);
            handleOpenDetail(detailModal.data.id);
        }
    };

    const filtered = shootings.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.client_name?.toLowerCase().includes(search.toLowerCase())
    );

    // Calendar logic
    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const calendarDays = eachDayOfInterval({
            start: startDate,
            end: endDate
        });

        const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        return (
            <div className="calendar-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)', textTransform: 'capitalize' }}>
                            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                        </h2>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn btn-outline" style={{ padding: '5px' }}>
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn btn-outline" style={{ padding: '5px' }}>
                                <ChevronRight size={18} />
                            </button>
                            <button onClick={() => setCurrentMonth(new Date())} className="btn btn-outline" style={{ padding: '5px 12px', fontSize: '12px' }}>Aujourd'hui</button>
                        </div>
                    </div>
                </div>

                <div className="calendar-grid">
                    {weekDays.map(day => (
                        <div key={day} className="calendar-header-cell">{day}</div>
                    ))}
                    {calendarDays.map(day => {
                        const dayShootings = shootings.filter(s => isSameDay(new Date(s.shooting_date), day));
                        return (
                            <div
                                key={day.toString()}
                                className={`calendar-day-cell ${!isSameMonth(day, monthStart) ? 'other-month' : ''} ${isToday(day) ? 'today' : ''}`}
                                onClick={() => {
                                    if (dayShootings.length === 0) {
                                        setForm({ ...form, shooting_date: format(day, 'yyyy-MM-dd') });
                                        handleOpenMain();
                                    }
                                }}
                            >
                                <span className="calendar-day-number">{format(day, 'd')}</span>
                                {dayShootings.map(s => (
                                    <div
                                        key={s.id}
                                        className={`calendar-event ${s.status}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDetail(s.id);
                                        }}
                                        title={s.title}
                                    >
                                        {s.title}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Gestion des Shootings</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{shootings.length} événements prévus</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '8px', padding: '4px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                        <button
                            onClick={() => setViewMode('calendar')}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: viewMode === 'calendar' ? 'var(--primary-light)' : 'transparent',
                                color: viewMode === 'calendar' ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                fontWeight: '600'
                            }}
                        >
                            <CalendarViewIcon size={16} /> Calendrier
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: viewMode === 'list' ? 'var(--primary-light)' : 'transparent',
                                color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                fontWeight: '600'
                            }}
                        >
                            <LayoutList size={16} /> Liste
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenMain()}>
                        <Plus size={18} /> Nouveau Shooting
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                renderCalendar()
            ) : (
                <div className="card" style={{ padding: '0' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Search size={20} color="var(--text-muted)" />
                        <input
                            placeholder="Rechercher par titre ou client..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
                        />
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Shooting</th>
                                <th>Client</th>
                                <th>Date & Lieu</th>
                                <th>Prix & Payé</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{s.title}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: #{s.id}</div>
                                    </td>
                                    <td>{s.client_name}</td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>{s.shooting_date ? format(new Date(s.shooting_date), 'dd MMMM yyyy', { locale: fr }) : '-'}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.location}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{Number(s.total_price || 0).toFixed(3)} DT</div>
                                        <div style={{ fontSize: '11px', color: Number(s.total_paid || 0) >= Number(s.total_price || 0) ? '#10b981' : '#f59e0b' }}>
                                            Payé: {Number(s.total_paid || 0).toFixed(3)} DT
                                        </div>
                                        {Number(s.total_price || 0) - Number(s.total_paid || 0) > 0 && (
                                            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>
                                                Reste: {(Number(s.total_price || 0) - Number(s.total_paid || 0)).toFixed(3)} DT
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${s.status}`}>
                                            {s.status === 'scheduled' ? 'Planifié' : s.status === 'completed' ? 'Terminé' : 'Annulé'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenDetail(s.id)} className="btn btn-outline" style={{ padding: '6px' }} title="Détails">
                                                <ChevronRight size={16} />
                                            </button>
                                            <button onClick={() => handleOpenMain(s)} className="btn btn-outline" style={{ padding: '6px' }} title="Modifier">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444' }} title="Supprimer">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals remain the same */}
            <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, data: null })} title={modal.data ? 'Modifier Shooting' : 'Nouveau Shooting'}>
                <form onSubmit={handleSubmitMain} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Titre</label>
                        <input style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Date</label>
                            <input type="date" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.shooting_date} onChange={e => setForm({ ...form, shooting_date: e.target.value })} required />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Prix Total (DT)</label>
                            <input type="number" step="0.001" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.total_price} onChange={e => setForm({ ...form, total_price: e.target.value })} required />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Heure (ex: 14:00)</label>
                            <input type="text" placeholder="10:30" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Durée (heures)</label>
                            <input type="number" placeholder="2" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.duration || ''} onChange={e => setForm({ ...form, duration: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Lieu</label>
                        <input style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Status</label>
                        <select style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option value="scheduled">Planifié</option>
                            <option value="completed">Terminé</option>
                            <option value="cancelled">Annulé</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }}>
                        {modal.data ? 'Mettre à jour' : 'Créer le shooting'}
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={detailModal.isOpen}
                onClose={() => setDetailModal({ isOpen: false, data: null })}
                title={detailModal.data ? `Détails: ${detailModal.data.title}` : ''}
            >
                {detailModal.data && (() => {
                    const totalClient = Number(detailModal.data.total_price || 0);
                    const totalPaidClient = Number(detailModal.data.total_paid || 0);
                    const totalFreelancerCost = (detailModal.data.freelancers || []).reduce((sum, f) => sum + Number(f.agreed_amount || 0), 0);
                    const netProfit = totalClient - totalFreelancerCost;

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '150px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total client</p>
                                    <h4 style={{ fontSize: '18px', fontWeight: '700' }}>{totalClient.toFixed(3)} DT</h4>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                        <p style={{ fontSize: '11px', color: '#10b981' }}>Payé: {totalPaidClient.toFixed(3)} DT</p>
                                        {detailModal.data.start_time && (
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--border)', padding: '2px 6px', borderRadius: '4px' }}>
                                                🕒 {detailModal.data.start_time} ({detailModal.data.duration}h)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: '150px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Reste à payer</p>
                                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: (totalClient - totalPaidClient) > 0 ? '#ef4444' : '#10b981' }}>
                                        {(totalClient - totalPaidClient).toFixed(3)} DT
                                    </h4>
                                </div>
                                <div style={{ flex: 1, minWidth: '150px', padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #10b981' }}>
                                    <p style={{ fontSize: '12px', color: '#047857', marginBottom: '4px', fontWeight: '600' }}>Bénéfice Net</p>
                                    <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>
                                        {netProfit.toFixed(3)} DT
                                    </h4>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <DollarSign size={18} color="var(--primary)" /> Paiements reçus
                                </h3>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                                    <table style={{ fontSize: '13px' }}>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Montant</th>
                                                <th>Méthode</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailModal.data.payments.map(p => (
                                                <tr key={p.id}>
                                                    <td>{p.payment_date ? format(new Date(p.payment_date), 'dd/MM/yyyy') : '-'}</td>
                                                    <td style={{ fontWeight: '600' }}>{Number(p.amount || 0).toFixed(3)} DT</td>
                                                    <td>{p.method}</td>
                                                    <td>
                                                        <button onClick={() => handleDeletePayment(p.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <form onSubmit={handleAddPayment} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '600' }}>Montant</label>
                                        <input type="number" step="0.001" style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }} value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '600' }}>Date</label>
                                        <input type="date" style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }} value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '600' }}>Méthode</label>
                                        <select style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }} value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                                            <option value="cash">Espèces</option>
                                            <option value="virement">Virement</option>
                                            <option value="cheque">Chèque</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}><Plus size={16} /></button>
                                </form>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UserSquare2 size={18} color="var(--primary)" /> Freelancers & Payes
                                </h3>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                                    <table style={{ fontSize: '13px' }}>
                                        <thead>
                                            <tr>
                                                <th>Nom</th>
                                                <th>Accordé</th>
                                                <th>Payé</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailModal.data.freelancers.map(f => (
                                                <tr key={f.freelancer_id}>
                                                    <td>{f.name}</td>
                                                    <td style={{ fontWeight: '600' }}>{Number(f.agreed_amount || 0).toFixed(3)} DT</td>
                                                    <td style={{ color: Number(f.paid_amount || 0) >= Number(f.agreed_amount || 0) ? '#10b981' : '#f59e0b' }}>{Number(f.paid_amount || 0).toFixed(3)} DT</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button
                                                                onClick={() => setAssignForm({ freelancer_id: f.freelancer_id, agreed_amount: f.agreed_amount, paid_amount: f.paid_amount || 0 })}
                                                                style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                                                title="Modifier / Payer"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button onClick={() => handleRemoveFreelancer(f.freelancer_id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }} title="Retirer">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <form onSubmit={handleAssignFreelancer} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '600' }}>Freelancer</label>
                                        <select style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: assignForm.freelancer_id ? '#f8fafc' : 'white' }} value={assignForm.freelancer_id} onChange={e => setAssignForm({ ...assignForm, freelancer_id: e.target.value })} required disabled={detailModal.data.freelancers.some(f => f.freelancer_id == assignForm.freelancer_id)}>
                                            <option value="">Choisir</option>
                                            {freelancers.map(fr => <option key={fr.id} value={fr.id}>{fr.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '600' }}>Total Convenu</label>
                                        <input type="number" step="0.001" style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }} value={assignForm.agreed_amount} onChange={e => setAssignForm({ ...assignForm, agreed_amount: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--primary)' }}>Payé (Avance+)</label>
                                        <input type="number" step="0.001" style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', borderColor: 'var(--primary)' }} value={assignForm.paid_amount} onChange={e => setAssignForm({ ...assignForm, paid_amount: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button type="submit" className="btn btn-primary" style={{ padding: '8px' }} title={detailModal.data.freelancers.some(f => f.freelancer_id == assignForm.freelancer_id) ? "Mettre à jour" : "Ajouter"}>
                                            {detailModal.data.freelancers.some(f => f.freelancer_id == assignForm.freelancer_id) ? <Edit size={16} /> : <UserPlus size={16} />}
                                        </button>
                                        {assignForm.freelancer_id && (
                                            <button type="button" onClick={() => setAssignForm({ freelancer_id: '', agreed_amount: '', paid_amount: 0 })} className="btn btn-outline" style={{ padding: '8px' }} title="Vider">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
};

export default Shootings;
