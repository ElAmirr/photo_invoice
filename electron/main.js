const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let backendProcess;

function startBackend() {
    const backendPath = path.join(__dirname, '..', 'backend', 'index.js');

    // In development, we use the local node. 
    // In production, we'll need to package the backend or point to the bundled binary.
    backendProcess = spawn('node', [backendPath], {
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: 'inherit'
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
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
        icon: path.join(__dirname, '..', 'frontend', 'public', 'favicon.ico') // Fallback icon
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

app.on('ready', () => {
    if (!isDev) {
        startBackend();
    }
    createWindow();
});

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
