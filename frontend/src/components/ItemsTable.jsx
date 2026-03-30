import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const ItemsTable = ({ items, setItems }) => {
    const addItem = () => {
        setItems([...items, { description: '', days: '', quantity: 1, unit_price: 0, total_price: 0 }]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleChange = (index, field, value) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        // Auto-calculate total price
        if (field === 'quantity' || field === 'unit_price') {
            const q = field === 'quantity' ? parseFloat(value || 0) : parseFloat(item.quantity || 0);
            const p = field === 'unit_price' ? parseFloat(value || 0) : parseFloat(item.unit_price || 0);
            item.total_price = q * p;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const subtotal = Number(items.reduce((sum, item) => sum + Number(item.total_price || 0), 0).toFixed(3));
    const tax = Number((subtotal * 0.19).toFixed(3));
    const total = Number((subtotal + tax).toFixed(3));

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Articles / Prestations</h3>
                <button type="button" className="btn btn-outline" onClick={addItem} style={{ padding: '6px 12px', fontSize: '12px' }}>
                    <Plus size={14} /> Ajouter une ligne
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table style={{ minWidth: '600px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '35%' }}>Description</th>
                            <th style={{ width: '15%', textAlign: 'center' }}>Nbre Jours</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>Qté</th>
                            <th style={{ width: '15%', textAlign: 'right' }}>Prix Unit. (TND)</th>
                            <th style={{ width: '20%', textAlign: 'right' }}>Total (TND)</th>
                            <th style={{ width: '5%', textAlign: 'center' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <input
                                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}
                                        value={item.description}
                                        placeholder="ex: Séance photo studio"
                                        onChange={e => handleChange(index, 'description', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}
                                        value={item.days || ''}
                                        placeholder="ex: 1 jour"
                                        onChange={e => handleChange(index, 'days', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}
                                        value={item.quantity}
                                        onChange={e => handleChange(index, 'quantity', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        step="0.001"
                                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'right' }}
                                        value={item.unit_price}
                                        onChange={e => handleChange(index, 'unit_price', e.target.value)}
                                    />
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                    {Math.round(item.total_price || 0)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <div className="card" style={{ minWidth: '240px', background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 50%, #C026D3 100%)', color: 'white', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span>Total HT</span>
                        <span>{Math.round(subtotal || 0)} TND</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                        <span>TVA (19%)</span>
                        <span>{Math.round(tax || 0)} TND</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: 'var(--primary-light)' }}>
                        <span>TOTAL TTC </span>
                        <span>{Math.round(total || 0)} TND</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemsTable;
