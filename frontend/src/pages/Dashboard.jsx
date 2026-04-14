import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    TrendingUp,
    AlertCircle,
    Calendar,
    Building,
    ArrowRight,
    Plus,
    LayoutDashboard,
    User,
    CheckCircle,
    DollarSign,
    Package,
    Banknote,
    FileText,
    Camera,
    Percent
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const BigStat = ({ title, value, icon, color, subValue, gradient }) => (
    <div
        className="card"
        style={{
            flex: 1,
            minWidth: '300px',
            border: 'none',
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
            cursor: 'default'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 12px 25px -10px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px -5px rgba(0,0,0,0.05)';
        }}
    >
        <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            backgroundColor: `${color}05`,
            borderRadius: '50%',
            zIndex: 0
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'pre-line' }}>{title}</p>
                <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>{value}</h3>
                {subValue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                        <span style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: color }}></span>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{subValue}</p>
                    </div>
                )}
            </div>
            <div style={{
                backgroundColor: `${color}15`,
                color: color,
                padding: '14px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 15px -5px ${color}30`
            }}>
                {React.cloneElement(icon, { size: 28 })}
            </div>
        </div>
    </div>
);

const SectionHeader = ({ title, icon, linkTo, linkText, badge }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', color: 'var(--primary)', display: 'flex' }}>
                {icon}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{title}</h2>
                {badge && (
                    <span style={{ backgroundColor: '#fee2e2', color: '#6366f1', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px' }}>
                        {badge}
                    </span>
                )}
            </div>
        </div>
        {linkTo && (
            <Link to={linkTo} style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', transition: 'gap 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.gap = '8px'}
                onMouseLeave={(e) => e.currentTarget.style.gap = '4px'}
            >
                {linkText} <ArrowRight size={14} />
            </Link>
        )}
    </div>
);

const ActivityItem = ({ title, subTitle, amount, date, status, color, icon: IconComponent }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #f8fafc',
        transition: 'background-color 0.2s',
        cursor: 'default'
    }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
                height: '40px',
                width: '40px',
                borderRadius: '12px',
                backgroundColor: `${color}10`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <IconComponent size={20} />
            </div>
            <div>#6366f1'
                <p style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', marginBottom: '2px' }}>{title}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {subTitle} • <span style={{ color: '#94a3b8' }}>{date}</span>
                </p>
            </div>
        </div>
        <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: '800', color: color, fontSize: '15px', marginBottom: '4px' }}>
                {amount}
            </p>
            {status && (
                <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: status === 'partial' ? '#fef3c7' : '#f1f5f9',
                    color: status === 'partial' ? '#d97706' : '#64748b'
                }}>
                    {status}
                </span>
            )}
        </div>
    </div>
);

const Dashboard = () => {
    const [period, setPeriod] = useState('month'); // 'month', 'lastMonth', 'year', 'all'
    const [stats, setStats] = useState({
        legalRevenue: 0,
        privateRevenue: 0,
        totalTax: 0,
        legalEncours: 0,
        privateEncours: 0,
        receivedRevenue: 0,
        unpaidCount: 0,
        upcomingShootings: 0,
        profit: 0,
        expensesTotal: 0,
        upcomingPayments: [],
        upcomingPaycheck: []
    });
    const [loading, setLoading] = useState(true);

    const getPeriodDates = (p) => {
        const now = new Date();
        let start, end;
        if (p === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (p === 'lastMonth') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (p === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        } else {
            return { start: null, end: null };
        }
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    };

    const fetchStats = () => {
        setLoading(true);
        const { start, end } = getPeriodDates(period);
        const query = start ? `?startDate=${start}&endDate=${end}` : '';
        api.get(`/dashboard/stats${query}`)
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchStats();
    }, [period]);

    const formatAmount = (val) => (val || 0).toFixed(3).replace('.', ',') + ' TND';

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
            <div className="loader" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Chargement de vos finances...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', padding: '20px 24px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                        <LayoutDashboard size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>Tableau de bord</h1>
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>Vue d'ensemble de votre activité</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/expenses" className="btn btn-outline" style={{ textDecoration: 'none', backgroundColor: 'white' }}>
                        Dépenses
                    </Link>
                    <Link to="/factures" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        <Plus size={18} strokeWidth={3} /> Nouvelle Facture
                    </Link>
                </div>
            </div>

            {/* Sub-header Filter Bar */}
            <div className="card" style={{ marginBottom: '24px', padding: '14px 24px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Période</span>
                        <div style={{ display: 'flex', padding: '3px', borderRadius: '14px', gap: '4px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                            {[
                                { id: 'month', label: 'Mois' },
                                { id: 'lastMonth', label: 'Dernier' },
                                { id: 'year', label: 'Année' },
                                { id: 'all', label: 'Tout' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPeriod(p.id)}
                                    style={{
                                        padding: '7px 20px',
                                        borderRadius: '11px',
                                        border: 'none',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        background: period === p.id ? 'var(--primary)' : 'transparent',
                                        color: period === p.id ? 'white' : '#64748b',
                                        boxShadow: period === p.id ? '0 4px 10px rgba(147, 51, 234, 0.3)' : 'none',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>


            {/* Section 1: Financial Workflow Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <BigStat
                    title="Encaissements Entreprises"
                    value={formatAmount(stats.legalRevenue)}
                    icon={<Building />}
                    color="#8b5cf6"
                    subValue={"Le chiffre d'affaire facturé aux entreprises"}
                />
                <BigStat
                    title="Encaissements Particuliers"
                    value={formatAmount(stats.privateRevenue)}
                    icon={<User />}
                    color="#6366f1"
                    subValue="Le chiffre d'affaire avec les particuliers"
                />
                <BigStat
                    title={"Bénéfice Net TTC"}
                    value={formatAmount(stats.profit)}
                    icon={<Banknote />}
                    color="#6366f1"
                    subValue="Le bénéfice net après la déduction des charges"
                />
                <BigStat
                    title={"Total des TVA à payer"}
                    value={formatAmount(stats.totalTax)}
                    icon={<Banknote />}
                    color="#8b5cf6"
                    subValue="Total des TVA à payer"
                />
                <BigStat
                    title="Paiements en Attente des Entreprises"
                    value={formatAmount(stats.legalEncours)}
                    icon={<FileText />}
                    color="#6366f1"
                    subValue="Factures Impayées"
                />
                <BigStat
                    title="Paiements en Attente des Particuliers"
                    value={formatAmount(stats.privateEncours)}
                    icon={<Camera />}
                    color="#6366f1"
                    subValue="Shootings Impayées"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginBottom: '40px' }}>
                {/* Section 2: Incoming Paychecks */}
                <div>
                    <SectionHeader
                        title="Prochains Encaissements"
                        icon={<Banknote size={20} />}
                        linkTo="/factures"
                        linkText="Voir tout"
                        badge={stats.unpaidCount > 0 ? stats.unpaidCount : null}
                    />
                    <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {stats.upcomingPaycheck.map((p) => (
                                <ActivityItem
                                    key={p.id}
                                    title={p.client_name}
                                    subTitle={p.reference}
                                    date={`Due le ${format(new Date(p.date), 'dd/MM/yy')}`}
                                    amount={formatAmount(p.total_amount)}
                                    status={p.status}
                                    color="#6366f1"
                                    icon={CheckCircle}
                                />
                            ))}
                            {stats.upcomingPaycheck.length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    <CheckCircle size={40} style={{ opacity: 0.1, marginBottom: '12px' }} />
                                    <p style={{ fontSize: '14px', fontWeight: '500' }}>Aucun encaissement en attente</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 3: Payments Due */}
                <div>
                    <SectionHeader
                        title="Règlements Team"
                        icon={<User size={20} />}
                        linkTo="/freelancers"
                        linkText="Équipe"
                    />
                    <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {stats.upcomingPayments.map((p) => {
                                const remaining = p.agreed_amount - p.paid_amount;
                                return (
                                    <ActivityItem
                                        key={p.id}
                                        title={p.freelancer_name}
                                        subTitle={p.shooting_title}
                                        date="Freelance"
                                        amount={formatAmount(remaining)}
                                        color="#6366f1"
                                        icon={User}
                                    />
                                );
                            })}
                            {stats.upcomingPayments.length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    <User size={40} style={{ opacity: 0.1, marginBottom: '12px' }} />
                                    <p style={{ fontSize: '14px', fontWeight: '500' }}>Tout est à jour !</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
