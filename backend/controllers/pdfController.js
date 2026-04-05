const pool = require('../db/connection');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const pdfRequests = new Map();

// Listen for PDF results from the main process
if (process.parentPort) {
  process.parentPort.on('message', (message) => {
    if (message.data && message.data.type === 'PDF_RESULT') {
      const { requestId, pdf, error } = message.data;
      const callback = pdfRequests.get(requestId);
      if (callback) {
        if (error) callback.reject(new Error(error));
        else callback.resolve(Buffer.from(pdf));
        pdfRequests.delete(requestId);
      }
    }
  });
}

async function generatePdf(html) {
  if (process.parentPort) {
    return await generatePdfViaMain(html);
  } else {
    throw new Error('PDF generation requires running as an Electron utility process.');
  }
}

function generatePdfViaMain(html) {
  return new Promise((resolve, reject) => {
    if (!process.parentPort) {
      return reject(new Error('Process not running as a utility process with parentPort'));
    }
    const requestId = uuidv4();
    pdfRequests.set(requestId, { resolve, reject });
    process.parentPort.postMessage({ type: 'GENERATE_PDF', html, requestId });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pdfRequests.has(requestId)) {
        pdfRequests.delete(requestId);
        reject(new Error('PDF generation timeout'));
      }
    }, 30000);
  });
}

function formatDate(d) {
  if (!d) return '';
  // Format as "23 Mars 2026"
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatCurrency(n) {
  return (Number(n) || 0).toFixed(3).replace('.', ',') + ' TND';
}

function numberToFrench(number) {
  if (number === 0) return "Zéro dinar";
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];

  function getBelowHundred(n) {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (t === 7) return "soixante-" + (u === 1 ? "et-onze" : teens[u]);
    if (t === 9) return "quatre-vingt-" + teens[u];
    if (u === 1 && t < 7) return tens[t] + "-et-un";
    if (u === 0) return tens[t === 8 ? 8 : t];
    return tens[t] + "-" + units[u];
  }

  function getBelowThousand(n) {
    if (n === 0) return "";
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let s = "";
    if (h > 1) s += units[h] + " cent";
    else if (h === 1) s += "cent";
    if (rest > 0) s += (s ? " " : "") + getBelowHundred(rest);
    return s;
  }

  function convert(n) {
    if (n === 0) return "";
    if (n < 1000) return getBelowThousand(n);
    const k = Math.floor(n / 1000);
    const rest = n % 1000;
    let s = "";
    if (k > 1) s += getBelowThousand(k) + " mille";
    else s += "mille";
    if (rest > 0) s += " " + getBelowThousand(rest);
    return s;
  }

  const dinars = Math.floor(number);
  const millimes = Math.round((number - dinars) * 1000);
  let result = convert(dinars) + (dinars > 1 ? " dinars" : " dinar");
  if (millimes > 0) {
    result += " et " + convert(millimes) + (millimes > 1 ? " millimes" : " millime");
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function buildHtml(type, data) {
  const { doc, client, items, company } = data;
  const logoHtml = company.logo
    ? `<img src="http://127.0.0.1:5055${company.logo}" style="height:70px;object-fit:contain;" />`
    : `<div></div>`;

  const itemRows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.description || ''}</td>
      <td style="text-align:center;">${item.days || '-'}</td>
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
    .totals-box { width:240px; margin-left:auto; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:15px; }
    .totals-box .row { display:flex; justify-content:space-between; margin-bottom:10px; font-size:12px; color:#4b5563; }
    .totals-box .total-line { display:flex; justify-content:space-between; margin-top:10px; padding-top:10px; border-top:2px solid #1a1a2e; font-size:16px; font-weight:800; color:#1a1a2e; }
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
      ${isDevis ? `<div class="status-badge">${statusLabel}</div>` : ''}
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
        ${company.bank_name ? `<p>Banque: ${company.bank_name}</p>` : ''}
        ${company.account_number ? `<p>RIB: ${company.account_number}</p>` : ''}
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
      ${doc.bon_commande ? `<div style="font-size:13px; color:#1a1a2e; margin-top:8px;"><strong>Bon de commande n°: ${doc.bon_commande}</strong></div>` : ''}
    </div>
  </div>

  <div class="section-title">Détail des prestations</div>
  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>Description</th>
        <th style="width:120px;text-align:center;">Prestation</th>
        <th style="width:60px;text-align:center;">Qté</th>
        <th style="width:100px;text-align:right;">Prix Unit</th>
        <th style="width:110px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}    </tbody>
  </table>
  <div style="display:flex; justify-content:space-between;">
    
  
  ${doc.tva_suspended ? `
    <div style="margin-top:10px; font-size:12px; font-style:italic; padding:10px; border-radius:4px; color:#374151;">
        Suspendu de TVA 19% selon attestation en suspension numéro <strong>${doc.suspension_number || 'N/A'}</strong>
    </div>
  ` : ''}

  <div class="totals">
    <div class="totals-box">
      <div class="row">
        <span>Total HT</span>
        <span>${formatCurrency(doc.subtotal_amount || doc.total_amount)}</span>
      </div>
      ${doc.tva_suspended ? `
        <div class="row">
          <span>TVA (Suspendue)</span>
          <span>${formatCurrency(0)}</span>
        </div>
      ` : `
        <div class="row">
          <span>TVA (19%)</span>
          <span>${formatCurrency(doc.tax_amount || 0)}</span>
        </div>
      `}
      <div class="row">
        <span>Droit de Timbre</span>
        <span>${formatCurrency(1.000)}</span>
      </div>
      <div class="total-line">
        <span>TOTAL TTC</span>
        <span>${formatCurrency(doc.total_amount)}</span>
      </div>
    </div>
  </div>

  
  </div>

  <div style="text-align:center; margin-top:20px; font-size:14px; color:#1a1a2e; font-weight:700; padding-top:10px;">
    Arrêtée la présente ${type === 'devis' ? 'devis' : 'facture'} à la somme de :
    <span style="text-transform: underline;">${numberToFrench(doc.total_amount)}</span>
  </div>
  <div class="footer" style="border-top:1px solid #eee; padding-top:10px;">
    <p>${company.name || ''} — ${company.address || ''} — ${company.phone || ''}</p>
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
    const pdf = await generatePdf(html);

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
    const pdf = await generatePdf(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${doc.reference}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
