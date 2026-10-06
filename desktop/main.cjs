'use strict';
const { app, BrowserWindow, Menu, ipcMain, clipboard, globalShortcut, screen, dialog } = require('electron');
const path = require('node:path');
const settings = require('./settings.json');
let win;
const target = new URL(settings.url);
if (target.protocol !== 'https:' || target.username || target.password) throw new Error('La URL de la caja debe usar HTTPS.');
target.searchParams.set('auxiliar', '1');
const root = target.pathname.endsWith('/') ? target.pathname : target.pathname.replace(/[^/]*$/, '');
function allowed(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && url.origin === target.origin && [root, root + 'index.html'].includes(url.pathname);
  } catch { return false; }
}
function validSender(event) {
  return win && !win.isDestroyed() && event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame && allowed(event.senderFrame.url);
}
function dimensions() {
  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  const width = Math.min(Math.max(420, Number(settings.width) || 510), area.width);
  const height = Math.min(Math.max(620, Number(settings.height) || 900), area.height);
  return { width, height, x: area.x + area.width - width, y: area.y + Math.round((area.height - height) / 2) };
}
function setPin(on) { win.setAlwaysOnTop(Boolean(on), 'floating'); return win.isAlwaysOnTop(); }
function toggle() { if (!win || win.isDestroyed()) return; if (win.isVisible() && !win.isMinimized()) win.hide(); else { win.show(); win.restore(); win.focus(); } }
function createWindow() {
  win = new BrowserWindow({
    ...dimensions(), minWidth: 380, minHeight: 550, title: 'BurgerShot · Caja auxiliar',
    backgroundColor: '#0e161e', show: false, autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false,
      contextIsolation: true, sandbox: true, webSecurity: true,
      allowRunningInsecureContent: false, partition: 'persist:burgershot-auxiliar'
    }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => { if (!allowed(url)) event.preventDefault(); });
  win.webContents.on('will-redirect', (event, url) => { if (!allowed(url)) event.preventDefault(); });
  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  win.webContents.session.setPermissionCheckHandler(() => false);
  win.webContents.session.on('will-download', event => event.preventDefault());
  win.once('ready-to-show', () => { setPin(true); win.show(); });
  win.on('closed', () => { win = null; });
  win.webContents.on('did-fail-load', async (_event, code, _description, _url, isMainFrame) => {
    if (!isMainFrame || code === -3 || !win) return;
    await dialog.showMessageBox(win, { type: 'error', title: 'No se pudo abrir BurgerShot', message: 'Revisa tu conexión y que tu página de GitHub Pages esté publicada.', detail: 'Puedes volver a intentar con Ctrl + R. La URL se configura en desktop/settings.json.' });
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Caja', submenu: [
      { label: 'Mostrar / ocultar', accelerator: 'CommandOrControl+Alt+B', click: toggle },
      { label: 'Fijar / soltar ventana', click: () => setPin(!win.isAlwaysOnTop()) },
      { label: 'Alinear a la derecha', click: () => win.setBounds(dimensions()) },
      { type: 'separator' }, { role: 'reload', label: 'Recargar' },
      { role: 'resetZoom', label: 'Tamaño original' }, { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' },
      { type: 'separator' }, { role: 'quit', label: 'Salir' }
    ] }
  ]));
  void win.loadURL(target.href).catch(() => {});
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { win.show(); win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    for (const [channel, handler] of Object.entries({
      'burger:is-pinned': () => win.isAlwaysOnTop(),
      'burger:toggle-pin': () => setPin(!win.isAlwaysOnTop()),
      'burger:copy-text': text => {
        if (typeof text !== 'string' || text.length > 240) throw new Error('Mensaje no válido');
        clipboard.writeText(text); return true;
      },
      'burger:paste-image': () => {
        const image = clipboard.readImage();
        if (image.isEmpty()) return null;
        const size = image.getSize();
        if (size.width * size.height > 24000000) throw new Error('Recorta solo el aviso de pago.');
        const bytes = image.toPNG();
        if (bytes.length > 12 * 1024 * 1024) throw new Error('La captura supera 12 MB.');
        return `data:image/png;base64,${bytes.toString('base64')}`;
      }
    })) ipcMain.handle(channel, (event, value) => { if (!validSender(event)) throw new Error('Origen no permitido'); return handler(value); });
    createWindow();
    const shortcut = globalShortcut.register('CommandOrControl+Alt+B', toggle);
    if (!shortcut) console.info('Atajo ocupado. Puedes usar la barra de tareas para abrir BurgerShot.');
  });
  app.on('activate', () => { if (!win) createWindow(); else win.show(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('will-quit', () => globalShortcut.unregisterAll());
}
