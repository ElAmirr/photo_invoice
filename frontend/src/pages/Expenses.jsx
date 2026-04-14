import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    Settings,
    Tag,
    Receipt,
    HandCoins
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../components/Toast';
import DatePicker from 'react-datepicker';

const Expenses = () => {
    const { addToast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null); // { id, name }
    const [editingName, setEditingName] = useState('');

    // Filters
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            let expensesUrl = '/expenses';
            if (filterStartDate && filterEndDate) {
                expensesUrl += `?startDate=${filterStartDate}&endDate=${filterEndDate}`;
            }

            const [expRes, catRes] = await Promise.all([
                api.get(expensesUrl),
                api.get('/expenses/categories')
            ]);
            setExpenses(expRes.data);
            setCategories(catRes.data);

            // Set default category if available
            if (catRes.data.length > 0 && !formData.category) {
                setFormData(prev => ({ ...prev, category: catRes.data[0].name }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterStartDate, filterEndDate]);

    const handleOpen = () => {
        setFormData({
            category: categories[0]?.name || '',
            amount: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            description: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses', formData);
            setShowModal(false);
            fetchData();
            addToast('✅ Dépense enregistrée avec succès !', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erreur lors de l\'enregistrement de la dépense', 'error');
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName) return;
        try {
            await api.post('/expenses/categories', { name: newCategoryName });
            setNewCategoryName('');
            fetchData();
            addToast('✅ Catégorie ajoutée', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erreur lors de l\'ajout de la catégorie', 'error');
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await api.delete(`/expenses/categories/${id}`);
            fetchData();
            addToast('✅ Catégorie supprimée', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erreur: Impossible de supprimer une catégorie utilisée par des dépenses.', 'error');
        }
    };

    const handleUpdateCategory = async (id) => {
        if (!editingName) return;
        try {
            await api.put(`/expenses/categories/${id}`, { name: editingName });
            setEditingCategory(null);
            setEditingName('');
            fetchData();
            addToast('✅ Catégorie modifiée', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erreur lors de la modification de la catégorie', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer cette dépense ?')) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchData();
                addToast('✅ Dépense supprimée', 'success');
            } catch (err) {
                console.error(err);
                addToast('Erreur lors de la suppression', 'error');
            }
        }
    };

    const filteredExpenses = expenses.filter(exp =>
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    const categoryTotals = filteredExpenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
        return acc;
    }, {});

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', padding: '20px 24px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>

                        <HandCoins size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>Mes Dépenses</h1>
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}><span style={{ fontWeight: '700', color: '#8b5cf6' }}>{expenses.length}</span> dépenses enregistrées</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline" onClick={() => setShowCategoryModal(true)} style={{ backgroundColor: 'white' }}>
                        <Settings size={18} /> Gérer Catégories
                    </button>
                    <button className="btn btn-primary" onClick={handleOpen}>
                        <Plus size={18} /> Nouvelle Dépense
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', marginBottom: '24px', alignItems: 'start' }}>
                <div className="card" style={{ padding: '0', marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden' }}>
                    <div style={{ padding: '15px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '250px' }}>
                            <Search size={18} color="#64748b" />
                            <input
                                placeholder="Rechercher une dépense..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '500', backgroundColor: 'transparent', color: '#1e293b' }}
                            />
                        </div>

                        <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0' }}></div>

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
                            {(filterStartDate || filterEndDate) && (
                                <button
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setFilterStartDate('');
                                        setFilterEndDate('');
                                    }}
                                    style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '700', borderRadius: '10px', color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px 20px' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '12px 20px' }}>Catégorie</th>
                                <th style={{ textAlign: 'right', padding: '12px 20px' }}>Montant</th>
                                <th style={{ textAlign: 'right', padding: '12px 20px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id}>
                                    <td style={{ padding: '12px 20px' }}>{format(new Date(exp.date), 'dd/MM/yy')}</td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <span
                                            title={exp.description || 'Pas de description'}
                                            style={{
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                color: 'var(--primary)',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                textTransform: 'uppercase',
                                                cursor: 'help'
                                            }}
                                        >
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>
                                        {Number(exp.amount).toFixed(3).replace('.', ',')} TND
                                    </td>
                                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDelete(exp.id)}
                                            className="btn btn-outline"
                                            style={{ padding: '6px', color: '#ef4444' }}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <Filter size={32} opacity={0.3} />
                                            <p>Aucune dépense trouvée.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Category Breakdown */}
                    <div className="card" style={{ padding: '20px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                            Par Catégorie
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {categories.map(cat => {
                                const amount = categoryTotals[cat.name] || 0;
                                return (
                                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Tag size={14} color="var(--primary)" />
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{cat.name}</span>
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                                            {amount.toFixed(3).replace('.', ',')} TND
                                        </span>
                                    </div>
                                );
                            })}
                            {categories.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Aucune catégorie.</p>}
                        </div>
                    </div>

                    {/* Total Card */}
                    <div className="card" style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.1)'
                    }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Total Période</p>
                        <p style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b' }}>
                            {totalExpenses.toFixed(3).replace('.', ',')} TND
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Somme des dépenses filtrées</p>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Nouvelle Dépense"
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Catégorie</label>
                            <select
                                className="input"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                {categories.length === 0 && <option value="">Créez une catégorie d'abord</option>}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600' }}>Date</label>
                            <DatePicker
                                selected={formData.date ? new Date(formData.date) : null}
                                onChange={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                dateFormat="dd/MM/yy"
                                className="input"
                                wrapperClassName="full-width"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Montant (TND)</label>
                        <input
                            type="number"
                            step="0.001"
                            placeholder="0,000"
                            className="input"
                            style={{ fontSize: '18px', fontWeight: '700' }}
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '30px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600' }}>Description (Optionnel)</label>
                        <textarea
                            placeholder="Ex: Plein carburant déplacement Tunis"
                            className="input"
                            style={{ minHeight: '100px', resize: 'vertical' }}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Annuler</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Enregistrer la dépense</button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                title="Gérer les Catégories"
            >
                <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    <input
                        type="text"
                        placeholder="Nouvelle catégorie..."
                        className="input"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                        <Plus size={18} />
                    </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', padding: '4px' }}>
                    {categories.map(cat => (
                        <div key={cat.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.2s ease'
                        }}>
                            {editingCategory === cat.id ? (
                                <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        style={{ height: '36px', fontSize: '13px' }}
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleUpdateCategory(cat.id)}
                                        className="btn btn-sm btn-primary"
                                        style={{ height: '36px', padding: '0 12px' }}
                                    >
                                        Sauver
                                    </button>
                                    <button
                                        onClick={() => setEditingCategory(null)}
                                        className="btn btn-sm btn-outline"
                                        style={{ height: '36px', padding: '0 12px' }}
                                    >
                                        X
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Tag size={16} color="#8b5cf6" />
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{cat.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => {
                                                setEditingCategory(cat.id);
                                                setEditingName(cat.name);
                                            }}
                                            className="btn btn-sm btn-outline"
                                            style={{ padding: '6px', color: '#6366f1', borderColor: '#e0e7ff' }}
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="btn btn-sm btn-outline"
                                            style={{ padding: '6px', color: '#ef4444', borderColor: '#fee2e2' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', width: '100%', padding: '20px' }}>
                            Aucune catégorie définie.
                        </p>
                    )}
                </div>

                <div style={{ marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowCategoryModal(false)}>Fermer</button>
                </div>
            </Modal>
        </div>
    );
};

export default Expenses;
