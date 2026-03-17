const pool = require('../db/connection');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-TN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(n) {
  return parseFloat(n || 0).toFixed(3) + ' DT';
}

function buildHtml(type, data) {
  const { doc, client, items, company } = data;
  const logoHtml = company.logo
    ? `<img src="http://localhost:5000${company.logo}" style="height:70px;object-fit:contain;" />`
    : `<div style="font-size:24px;font-weight:700;color:#6C63FF;">${company.name || 'Studio Photo'}</div>`;

  const itemRows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.description || ''}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${formatCurrency(item.unit_price)}</td>
      <td style="text-align:right;font-weight:600;">${formatCurrency(item.total_price)}</td>
    </tr>
  `).join('');

  const isDevis = type === 'devis';
  const refLabel = isDevis ? 'Devis N°' : 'Facture N°';
  const statusLabel = isDevis
    ? { pending: 'En attente', accepted: 'Accepté', rejected: 'Rejeté' }[doc.status]
    : { unpaid: 'Non payée', paid: 'Payée', partial: 'Partielle' }[doc.status];
  const statusColor = isDevis
    ? { pending: '#f59e0b', accepted: '#10b981', rejected: '#ef4444' }[doc.status]
    : { unpaid: '#ef4444', paid: '#10b981', partial: '#f59e0b' }[doc.status];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Arial', sans-serif; color: #1a1a2e; background:#fff; padding: 40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
    .company-info { max-width: 50%; }
    .company-info h3 { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
    .company-info p { font-size:12px; color:#555; margin:2px 0; }
    .doc-meta { text-align:right; }
    .doc-meta .ref { font-size:22px; font-weight:700; color:#6C63FF; }
    .doc-meta .date { font-size:12px; color:#888; margin-top:4px; }
    .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700;
      color:white; background:${statusColor}; margin-top:8px; }
    .divider { height:2px; background:linear-gradient(90deg,#6C63FF,#a78bfa); border-radius:2px; margin:20px 0; }
    .section-title { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
    .client-box { background:#f8f9ff; border:1px solid #e8e8ff; border-radius:8px; padding:16px; margin-bottom:30px; }
    .client-box p { font-size:12px; color:#333; margin:3px 0; }
    .client-box .client-name { font-size:15px; font-weight:700; color:#1a1a2e; margin-bottom:6px; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; }
    thead tr { background:#6C63FF; color:white; }
    thead th { padding:10px 12px; font-size:11px; text-align:left; }
    tbody tr { border-bottom:1px solid #f0f0f0; }
    tbody tr:nth-child(even) { background:#f8f9ff; }
    tbody td { padding:9px 12px; font-size:12px; }
    .totals { display:flex; justify-content:flex-end; margin-top:10px; }
    .totals-box { background:#1a1a2e; color:white; border-radius:8px; padding:20px; min-width:240px; }
    .totals-box .row { display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; }
    .totals-box .total-line { display:flex; justify-content:space-between; font-size:16px; font-weight:700;
      color:#a78bfa; border-top:1px solid #333; padding-top:10px; margin-top:6px; }
    .footer { margin-top:50px; text-align:center; font-size:10px; color:#aaa; }
    ${isDevis ? `.valid-until { font-size:12px; color:#888; margin-top:4px; }` : ''}
  </style>
</head>
<body>
  <div class="header">
    <div>${logoHtml}</div>
    <div class="doc-meta">
      <div class="ref">${refLabel} ${doc.reference}</div>
      <div class="date">Date: ${formatDate(doc.date)}</div>
      ${isDevis ? `<div class="valid-until">Valide jusqu'au: ${formatDate(doc.valid_until)}</div>` : ''}
      <div class="status-badge">${statusLabel}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div style="display:flex; gap:40px; margin-bottom:30px;">
    <div style="flex:1;">
      <div class="section-title">Émetteur</div>
      <div class="client-box">
        <div class="client-name">${company.name || ''}</div>
        <p>${company.address || ''}</p>
        <p>${company.phone || ''} | ${company.email || ''}</p>
        ${company.matricule_fiscale ? `<p>MF: ${company.matricule_fiscale}</p>` : ''}
        ${company.patente ? `<p>Patente: ${company.patente}</p>` : ''}
      </div>
    </div>
    <div style="flex:1;">
      <div class="section-title">Client</div>
      <div class="client-box">
        <div class="client-name">${client.name || ''}</div>
        <p>${client.address || ''}</p>
        <p>${client.phone || ''} | ${client.email || ''}</p>
        ${client.matricule_fiscale ? `<p>MF: ${client.matricule_fiscale}</p>` : ''}
      </div>
    </div>
  </div>

  <div class="section-title">Détail des prestations</div>
  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>Description</th>
        <th style="width:70px;text-align:center;">Qté</th>
        <th style="width:100px;text-align:right;">Prix Unit.</th>
        <th style="width:110px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="total-line">
        <span>TOTAL TTC</span>
        <span>${formatCurrency(doc.total_amount)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>${company.name || ''} — ${company.address || ''} — ${company.phone || ''}</p>
    <p>Merci pour votre confiance.</p>
  </div>
</body>
</html>`;
}

exports.generateDevisPdf = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM devis WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const doc = rows[0];
    const [clientRows] = await pool.query('SELECT * FROM clients WHERE id=?', [doc.client_id]);
    const client = clientRows[0] || {};
    const [items] = await pool.query("SELECT * FROM invoice_items WHERE type='devis' AND parent_id=?", [req.params.id]);

    const [co] = await pool.query('SELECT * FROM company_info LIMIT 1');
    const company = co[0] || {};

    const html = buildHtml('devis', { doc, client, items, company });
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="devis-${doc.reference}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateFacturePdf = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM factures WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const doc = rows[0];
    const [clientRows] = await pool.query('SELECT * FROM clients WHERE id=?', [doc.client_id]);
    const client = clientRows[0] || {};
    const [items] = await pool.query("SELECT * FROM invoice_items WHERE type='facture' AND parent_id=?", [req.params.id]);

    const [co] = await pool.query('SELECT * FROM company_info LIMIT 1');
    const company = co[0] || {};

    const html = buildHtml('facture', { doc, client, items, company });
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${doc.reference}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
