import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{
                marginLeft: '260px',
                flex: 1,
                minHeight: '100vh',
                padding: '30px 40px',
                maxWidth: '1600px'
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
