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

import logo from '../assets/logo.png';

const Sidebar = () => {
    const links = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
        { to: '/shootings', icon: <Camera size={20} />, label: 'Shooting' },
        { to: '/devis', icon: <Quote size={20} />, label: 'Devis' },
        { to: '/factures', icon: <FileText size={20} />, label: 'Factures' },
        { to: '/clients', icon: <Users size={20} />, label: 'Clients' },
        { to: '/freelancers', icon: <UserSquare2 size={20} />, label: 'Freelancers' },
        { to: '/settings', icon: <Settings size={20} />, label: 'Mon Studio' },
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
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '40px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="logo" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '6px'
                }}>
                    <img src={logo} alt="Shootix" style={{ height: '42px', objectFit: 'contain' }} />
                    <span style={{
                        fontSize: '24px',
                        fontWeight: '800',
                        color: 'linear-gradient(135deg, #A855F7 0%, #9333EA 50%, #C026D3 100%)',
                        letterSpacing: '1px'
                    }}>SHOOTIX</span>
                </div>
                <a
                    href="https://shootix.tn"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                        e.preventDefault();
                        window.open('https://shootix.tn', '_blank');
                    }}
                    style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'white'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >
                    shootix.tn
                </a>
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
                            background: isActive ? 'linear-gradient(135deg, #A855F7 0%, #9333EA 50%, #C026D3 100%)' : 'transparent',
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
                    &copy; 2026 Shootix — Gestion de Studio
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
