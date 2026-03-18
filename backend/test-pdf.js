const puppeteer = require('puppeteer');

async function test() {
    try {
        console.log('Testing Puppeteer launch...');
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: 'new'
        });
        console.log('SUCCESS: Browser launched');
        const page = await browser.newPage();
        await page.setContent('<h1>Hello World</h1>');
        const pdf = await page.pdf({ format: 'A4' });
        console.log('SUCCESS: PDF generated, size:', pdf.length);
        await browser.close();
    } catch (err) {
        console.error('PUPPETEER FAILED:', err.message);
        console.error('Check if Chromium is installed or path is correct.');
    }
}

test();
