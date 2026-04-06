import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Shootings from './pages/Shootings';
import Devis from './pages/Devis';
import Factures from './pages/Factures';
import Freelancers from './pages/Freelancers';
import CompanySettings from './pages/CompanySettings';
import LicenseModal from './components/LicenseModal';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            if (!window.electron) {
                console.warn('Running outside of Electron environment. License check skipped.');
                setIsAuthenticated(true);
                setLoading(false);
                return;
            }
            const status = await window.electron.checkLicense();
            if (status.activated) {
                setIsAuthenticated(true);
            } else if (status.trialStartedAt) {
                const start = new Date(status.trialStartedAt);
                const now = new Date();
                const diffTime = Math.abs(now - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 5) {
                    setIsAuthenticated(true);
                }
            }
            setLoading(false);
        };
        check();
    }, []);

    if (loading) return null;

    return (
        <>
            {!isAuthenticated && <LicenseModal onAuthenticated={() => setIsAuthenticated(true)} />}
            <Router>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="clients" element={<Clients />} />
                        <Route path="shootings" element={<Shootings />} />
                        <Route path="devis" element={<Devis />} />
                        <Route path="factures" element={<Factures />} />
                        <Route path="freelancers" element={<Freelancers />} />
                        <Route path="settings" element={<CompanySettings />} />
                    </Route>
                </Routes>
            </Router>
        </>
    );
}

export default App;
