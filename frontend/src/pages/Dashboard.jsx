import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    TrendingUp,
    AlertCircle,
    Calendar,
    Wallet,
    ArrowRight,
    Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, subValue }) => (
    <div className="card" style={{ flex: 1, minWidth: '240px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>{title}</p>
                <h3 style={{ fontSize: '24px', fontWeight: '700' }}>{value}</h3>
                {subValue && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{subValue}</p>}
            </div>
            <div style={{
                backgroundColor: `${color}15`,
                color: color,
                padding: '12px',
                borderRadius: '12px'
            }}>
                {icon}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        unpaidCount: 0,
        upcomingShootings: 0,
        profit: 0,
        recentShootings: [],
        recentFactures: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/stats')
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Chargement...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Tableau de bord</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Bienvenue dans votre gestionnaire de studio photo.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to="/shootings" className="btn btn-outline">Nouveau Shooting</Link>
                    <Link to="/factures" className="btn btn-primary"><Plus size={18} /> Nouvelle Facture</Link>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '40px' }}>
                <StatCard
                    title="Chiffre d'affaires (Facturé)"
                    value={`${(stats.invoicedRevenue || 0).toFixed(3).replace('.', ',')} TND`}
                    icon={<TrendingUp size={24} />}
                    color="#6C63FF"
                    subValue="Montant total des factures"
                />
                <StatCard
                    title="Chiffre d'affaires (Encaissé)"
                    value={`${(stats.receivedRevenue || 0).toFixed(3).replace('.', ',')} TND`}
                    icon={<Wallet size={24} />}
                    color="#10b981"
                    subValue="Total des paiements reçus"
                />
                <StatCard
                    title="Factures Impayées"
                    value={stats.unpaidCount}
                    icon={<AlertCircle size={24} />}
                    color="#ef4444"
                />
                <StatCard
                    title="Shootings (30j)"
                    value={stats.upcomingShootings}
                    icon={<Calendar size={24} />}
                    color="#6C63FF"
                />
                <StatCard
                    title="Bénéfice Net"
                    value={`${(stats.profit || 0).toFixed(3).replace('.', ',')} TND`}
                    icon={<TrendingUp size={24} />}
                    color="#f59e0b"
                    subValue="Encaissé - Frais freelancers"
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Shootings Récents</h2>
                        <Link to="/shootings" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            Voir tout <ArrowRight size={14} />
                        </Link>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Shooting</th>
                                <th>Client</th>
                                <th>Total Client</th>
                                <th>Payé</th>
                                <th style={{ color: '#ef4444' }}>Reste</th>
                                <th style={{ color: '#10b981' }}>Bénéfice (Net)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentShootings.map(s => {
                                const totalClient = Number(s.total_price || 0);
                                const totalPaid = Number(s.total_paid || 0);
                                const totalFreelancer = Number(s.total_freelancer_cost || 0);
                                const remaining = totalClient - totalPaid;
                                const netProfit = totalClient - totalFreelancer;

                                return (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: '600' }}>{s.title}</td>
                                        <td style={{ fontSize: '13px' }}>{s.client_name}</td>
                                        <td style={{ fontWeight: '600', fontSize: '13px' }}>{totalClient.toFixed(3).replace('.', ',')} TND</td>
                                        <td style={{ color: '#10b981', fontSize: '13px' }}>{totalPaid.toFixed(3).replace('.', ',')} TND</td>
                                        <td style={{ color: remaining > 0 ? '#ef4444' : '#10b981', fontWeight: '700', fontSize: '13px' }}>
                                            {remaining.toFixed(3).replace('.', ',')} TND
                                        </td>
                                        <td style={{ color: '#059669', fontWeight: '800', fontSize: '14px', backgroundColor: '#ecfdf5' }}>
                                            {netProfit.toFixed(3).replace('.', ',')} TND
                                        </td>
                                        <td>
                                            <span className={`badge badge-${s.status}`} style={{ fontSize: '10px' }}>
                                                {s.status === 'scheduled' ? 'Planifié' : s.status === 'completed' ? 'Terminé' : 'Annulé'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {stats.recentShootings.length === 0 && (
                                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun shooting récent</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Factures Récentes</h2>
                        <Link to="/factures" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            Voir tout <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats.recentFactures.map(f => (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                <div>
                                    <p style={{ fontWeight: '600', fontSize: '14px' }}>{f.reference}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{f.client_name}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '14px' }}>{(f.total_amount || 0).toFixed(3).replace('.', ',')} TND</p>
                                    <span className={`badge badge-${f.status}`} style={{ fontSize: '10px' }}>
                                        {f.status === 'paid' ? 'Payée' : f.status === 'partial' ? 'Partielle' : 'Impayée'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {stats.recentFactures.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Aucune facture récente</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
