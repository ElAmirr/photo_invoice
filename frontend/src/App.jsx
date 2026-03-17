import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Shootings from './pages/Shootings';
import Devis from './pages/Devis';
import Factures from './pages/Factures';
import Freelancers from './pages/Freelancers';
import CompanySettings from './pages/CompanySettings';

function App() {
    return (
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
    );
}

export default App;
