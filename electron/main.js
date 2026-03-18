const { app, BrowserWindow, dialog, utilityProcess } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let backendProcess;

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
function checkUpdates() {
    autoUpdater.checkForUpdatesAndNotify();

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

app.on('ready', () => {
    if (!isDev) {
        startBackend();
        checkUpdates();
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
