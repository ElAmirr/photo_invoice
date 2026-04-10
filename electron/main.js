const { app, BrowserWindow, dialog, utilityProcess, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');
const LICENSE_SERVER = 'https://photo-invoice-licence-sever.onrender.com';

// Encryption Config
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY_SALT = 'shootix_secure_salt_2026';

function getEncryptionKey() {
    const hwid = machineIdSync();
    return crypto.createHash('sha256').update(hwid + ENCRYPTION_KEY_SALT).digest();
}

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        return null;
    }
}
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let backendProcess;

function getLicensePath() {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
    return path.join(userDataPath, 'license.lic'); // Using .lic for encrypted data
}

function startBackend() {
    const backendPath = path.join(__dirname, '..', 'backend', 'index.js');
    const userDataPath = app.getPath('userData');

    console.log('Starting backend with userData:', userDataPath);

    backendProcess = utilityProcess.fork(backendPath, [], {
        env: {
            ...process.env,
            NODE_ENV: 'production',
            ELECTRON_USER_DATA: userDataPath
        },
        stdio: 'inherit'
    });

    backendProcess.on('spawn', () => {
        console.log('Backend process spawned successfully');
    });

    backendProcess.on('message', async (message) => {
        if (message.type === 'GENERATE_PDF') {
            const { html, requestId } = message;
            try {
                const pdfWindow = new BrowserWindow({
                    show: false,
                    webPreferences: { offscreen: true }
                });
                await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
                const pdf = await pdfWindow.webContents.printToPDF({
                    printBackground: true,
                    margins: { top: 0, right: 0, bottom: 0, left: 0 },
                    pageSize: 'A4'
                });
                pdfWindow.close();
                backendProcess.postMessage({ type: 'PDF_RESULT', requestId, pdf });
            } catch (err) {
                console.error('PDF Generation Error in Main:', err);
                backendProcess.postMessage({ type: 'PDF_RESULT', requestId, error: err.message });
            }
        }
    });

    backendProcess.on('exit', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, '..', 'frontend', 'src', 'assets', 'logo.png')
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the built index.html
        mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}
function checkUpdates() {
    autoUpdater.checkForUpdatesAndNotify();

    // Check for updates every 15 minutes
    setInterval(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 15 * 60 * 1000);

    autoUpdater.on('update-available', () => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Update Available',
            message: 'A new version of the app is available. It is being downloaded...',
        });
    });

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            type: 'question',
            buttons: ['Restart', 'Later'],
            defaultId: 0,
            title: 'Update Ready',
            message: 'A new version has been downloaded. Restart the application to apply the updates?',
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
}

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.on('ready', () => {
        if (!isDev) {
            startBackend();
            checkUpdates();
        }
        createWindow();

        // Heartbeat Logic
        const performHeartbeat = async () => {
            const p = getLicensePath();
            if (fs.existsSync(p)) {
                try {
                    const encryptedData = fs.readFileSync(p, 'utf8');
                    const decryptedData = decrypt(encryptedData);
                    if (!decryptedData) return;
                    const data = JSON.parse(decryptedData);

                    if (data.activated && data.key) {
                        try {
                            const response = await fetch(`${LICENSE_SERVER}/api/activate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    key: data.key,
                                    hwid: data.hwid,
                                    version: app.getVersion(),
                                    os: `${process.platform} ${os.release()}`
                                })
                            });

                            // Handle explicit revocation (404/403) or JSON success:false
                            if (response.status === 404 || response.status === 403) {
                                console.log(`Heartbeat: License revoked (Status ${response.status}). Locking app...`);
                                const p2 = getLicensePath();
                                if (fs.existsSync(p2)) fs.unlinkSync(p2);
                                if (mainWindow) mainWindow.webContents.send('license-revoked');
                                return;
                            }

                            const result = await response.json();
                            if (result && result.success === false) {
                                console.log('Heartbeat: License revoked (JSON). Locking app...');
                                const p2 = getLicensePath();
                                if (fs.existsSync(p2)) fs.unlinkSync(p2);
                                if (mainWindow) mainWindow.webContents.send('license-revoked');
                            }
                        } catch (err) {
                            console.error('Heartbeat ping failed (Networking):', err.message);
                        }
                    }
                } catch (err) {
                    console.error('Heartbeat check error:', err);
                }
            }
        };

        // Run immediately on startup
        performHeartbeat();

        // Then repeat every 5 minutes
        setInterval(performHeartbeat, 5 * 60 * 1000);
    });
}
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    if (backendProcess) {
        backendProcess.kill();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

// Deep cleanup on quit
app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
// License Handlers

ipcMain.handle('get-hwid', () => {
    try {
        return machineIdSync();
    } catch (err) {
        console.error('HWID Error:', err);
        return 'unknown-hwid';
    }
});

ipcMain.handle('get-app-info', () => {
    return {
        version: app.getVersion(),
        os: `${process.platform} ${os.release()}`
    };
});

ipcMain.handle('start-trial', async () => {
    try {
        const hwid = machineIdSync();
        const response = await fetch(`${LICENSE_SERVER}/api/trials/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hwid,
                version: app.getVersion(),
                os: `${process.platform} ${os.release()}`
            })
        });
        return await response.json();
    } catch (err) {
        console.error('Start Trial Error:', err);
        return { success: false, message: "Connection error" };
    }
});

ipcMain.handle('check-license', () => {
    const p = getLicensePath();
    if (fs.existsSync(p)) {
        try {
            const encryptedData = fs.readFileSync(p, 'utf8');
            const decryptedData = decrypt(encryptedData);
            if (!decryptedData) return { activated: false };

            const data = JSON.parse(decryptedData);
            const currentHwid = machineIdSync();

            // Verify HWID matches (prevents copying license file to other machines)
            if (data.hwid !== currentHwid) {
                console.warn('License HWID mismatch!');
                return { activated: false };
            }

            return data;
        } catch (err) {
            console.error('Error reading license:', err);
            return { activated: false };
        }
    }
    return { activated: false };
});

ipcMain.handle('save-license', (event, licenseData) => {
    try {
        const encrypted = encrypt(JSON.stringify(licenseData));
        fs.writeFileSync(getLicensePath(), encrypted);

        // Notify server immediately if needed (usually handled by frontend activation)

        return true;
    } catch (err) {
        return false;
    }
});

ipcMain.handle('delete-license', () => {
    try {
        const p = getLicensePath();
        if (fs.existsSync(p)) fs.unlinkSync(p);
        return true;
    } catch (err) {
        return false;
    }
});

