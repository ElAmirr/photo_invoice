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
import axios from 'axios';

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
                setLoading(false); // Show app early, validate in background

                // Background Re-validation (Heartbeat)
                try {
                    const hwid = await window.electron.getHwid();
                    const appInfo = await window.electron.getAppInfo();
                    const response = await axios.post(
                        'https://photo-invoice-licence-sever.onrender.com/api/activate',
                        {
                            key: status.key,
                            hwid: hwid,
                            version: appInfo.version,
                            os: appInfo.os
                        },
                        { timeout: 10000 } // 10s timeout
                    );

                    if (!response.data.success) {
                        // Key is revoked or bound to another machine
                        console.error('License revoked by server:', response.data.message);
                        await window.electron.deleteLicense();
                        setIsAuthenticated(false);
                    } else {
                        // DEBUG: Log server response to help identify missing fields
                        console.log('Heartbeat response:', response.data);

                        // Update local license with any new info from server (e.g. expiration date)
                        // Use existing status.expiresAt as fallback if server doesn't return it
                        const expiryDate = response.data.expiresAt || response.data.expires_at || status.expiresAt || null;

                        await window.electron.saveLicense({
                            ...status,
                            expiresAt: expiryDate,
                            lastChecked: new Date().toISOString()
                        });
                    }
                } catch (err) {
                    // Check for explicit revocation (404 = key deleted, 403 = unauthorized)
                    if (err.response && (err.response.status === 404 || err.response.status === 403)) {
                        console.error('License explicitly revoked by server:', err.response.status);
                        await window.electron.deleteLicense();
                        setIsAuthenticated(false);
                    } else {
                        // Network error/timeout - allow offline usage if already activated
                        console.log('Background verification skipped (Offline/Timeout)');
                    }
                }
            }
            setLoading(false);
        };
        check();

        // Listen for background revocation from main process
        if (window.electron && window.electron.onLicenseRevoked) {
            window.electron.onLicenseRevoked(() => {
                console.warn('License revoked in background. Resetting auth state.');
                setIsAuthenticated(false);
            });
        }
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
