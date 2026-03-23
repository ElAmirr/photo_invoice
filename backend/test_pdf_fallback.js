const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Mock buildHtml and formatted helpers for testing
function formatCurrency(n) { return parseFloat(n || 0).toFixed(3) + ' DT'; }
function formatDate(d) { return new Date().toLocaleDateString(); }

async function generatePdf(html) {
    if (process.parentPort) {
        console.log('Using Electron parentPort...');
        return Buffer.from('PDF_CONTENT_FROM_ELECTRON');
    } else {
        console.log('Using Puppeteer fallback...');
        try {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdf = await page.pdf({ format: 'A4', printBackground: true });
            await browser.close();
            return pdf;
        } catch (err) {
            throw new Error('Fallback failed: ' + err.message);
        }
    }
}

const testHtml = '<h1>Test PDF</h1><p>This is a test of the Puppeteer fallback.</p>';

generatePdf(testHtml)
    .then(pdf => {
        console.log('PDF generated successfully, size:', pdf.length);
        fs.writeFileSync('test_fallback.pdf', pdf);
        process.exit(0);
    })
    .catch(err => {
        console.error('PDF generation failed:', err.message);
        process.exit(1);
    });
