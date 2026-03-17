import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Camera,
    FileText,
    Quote,
    UserSquare2,
    Settings,
    CircleDollarSign
} from 'lucide-react';

const Sidebar = () => {
    const links = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
        { to: '/clients', icon: <Users size={20} />, label: 'Clients' },
        { to: '/shootings', icon: <Camera size={20} />, label: 'Shooting' },
        { to: '/devis', icon: <Quote size={20} />, label: 'Devis' },
        { to: '/factures', icon: <FileText size={20} />, label: 'Factures' },
        { to: '/freelancers', icon: <UserSquare2 size={20} />, label: 'Freelancers' },
        { to: '/settings', icon: <Settings size={20} />, label: 'Paramètres' },
    ];

    return (
        <div className="sidebar shadow-lg" style={{
            width: '260px',
            height: '100vh',
            backgroundColor: 'var(--secondary)',
            color: 'white',
            position: 'fixed',
            left: 0,
            top: 0,
            padding: '30px 20px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div className="logo" style={{
                fontSize: '22px',
                fontWeight: '700',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--primary-light)'
            }}>
                <Camera size={28} className="text-primary" style={{ color: 'var(--primary)' }} />
                <span>PhotoStudio</span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: isActive ? '600' : '400',
                            color: isActive ? 'white' : '#94a3b8',
                            backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                            transition: 'all 0.2s'
                        })}
                    >
                        {link.icon}
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #334155' }}>
                <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
                    &copy; 2026 Photographer Management
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
