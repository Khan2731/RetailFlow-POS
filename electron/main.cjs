const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const BACKEND_PORT = 3000;
let backendProcess;
let mainWindow;

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
  app.quit();
}

function getResourcePath(...parts) {
  return app.isPackaged ? path.join(process.resourcesPath, ...parts) : path.join(__dirname, '..', ...parts);
}

function getFrontendPath(...parts) {
  return app.isPackaged
    ? path.join(app.getAppPath(), 'frontend', 'dist', ...parts)
    : path.join(__dirname, '..', 'frontend', 'dist', ...parts);
}

function getIconPath() {
  return app.isPackaged
    ? path.join(app.getAppPath(), 'build', 'icon.ico')
    : path.join(__dirname, '..', 'build', 'icon.ico');
}

function startBackend() {
  const backendEntry = getResourcePath('backend', 'server.js');
  const backendCwd = getResourcePath('backend');
  backendProcess = spawn(process.execPath, [backendEntry], {
    cwd: backendCwd,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(BACKEND_PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  backendProcess.on('error', (error) => {
    dialog.showErrorBox('PizzaHub POS backend failed to start', error.message);
    app.quit();
  });
  backendProcess.on('exit', (code) => {
    if (!app.isQuitting && code !== 0) {
      dialog.showErrorBox('PizzaHub POS backend stopped', `The local API exited with code ${code ?? 'unknown'}.`);
      app.quit();
    }
  });
  backendProcess.stdout?.on('data', (data) => console.log(`[backend] ${data}`));
  backendProcess.stderr?.on('data', (data) => console.error(`[backend] ${data}`));
}

function waitForBackend(attempts = 60) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(`http://127.0.0.1:${BACKEND_PORT}/health`, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) resolve();
        else retry();
      });
      request.on('error', retry);
      request.setTimeout(500, () => request.destroy());
    };
    const retry = () => {
      if (attempts <= 0) return reject(new Error('The local POS API did not become ready.'));
      attempts -= 1;
      setTimeout(check, 250);
    };
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: 'PizzaHub POS',
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.removeMenu();
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`Renderer failed to load (${errorCode}): ${errorDescription} at ${validatedURL}`);
  });
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('PizzaHub POS renderer loaded successfully');
  });
  mainWindow.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
    console.log(`[renderer] ${message} (${sourceId}:${line})`);
  });
  mainWindow.loadFile(getFrontendPath('index.html')).catch((error) => {
    dialog.showErrorBox('PizzaHub POS could not load', error.message);
  });
}

app.whenReady().then(async () => {
  if (!singleInstance) return;
  startBackend();
  try {
    await waitForBackend();
  } catch (error) {
    dialog.showErrorBox('PizzaHub POS could not start', error.message);
    app.quit();
    return;
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (backendProcess && !backendProcess.killed) backendProcess.kill();
});

