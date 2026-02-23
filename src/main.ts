import { app, BrowserWindow, ipcMain, safeStorage, desktopCapturer, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import Store from "electron-store";

const store = new Store();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function isWayland(): boolean {
  return (
    process.env.WAYLAND_DISPLAY !== undefined &&
    process.platform === "linux"
  );
}

// Holds the pending getDisplayMedia callback while the picker modal is open
let pendingScreenShareCallback: ((source: any) => void) | null = null;

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
    },
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '..', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
  });

  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    setTimeout(() => {
      win.loadURL("http://localhost:3000/");
    }, 1000);
  } else {
    win.loadFile(path.join(__dirname, "index.html"));
  }

  // win.webContents.openDevTools();

  ipcMain.on('window-minimize', () => win.minimize());
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  ipcMain.on('window-close', () => win.close());

  // Server storage IPC handlers
  ipcMain.handle('get-servers', () => {
    const servers = store.get('servers', []) as any[];
    return servers.map((server: any) => {
      if (server.password && server.isEncrypted) {
        try {
          const decrypted = safeStorage.decryptString(Buffer.from(server.password, 'base64'));
          return { ...server, password: decrypted };
        } catch (e) {
          console.error(`Failed to decrypt password for server ${server.name}`, e);
          return { ...server, password: "" };
        }
      }
      return server;
    });
  });

  ipcMain.handle('save-servers', (_event, servers: any[]) => {
    const encryptedServers = servers.map((server: any) => {
      if (server.password) {
        const encrypted = safeStorage.encryptString(server.password);
        return {
          ...server,
          password: encrypted.toString('base64'),
          isEncrypted: true
        };
      }
      return server;
    });
    store.set('servers', encryptedServers);
    return true;
  });

  return win;
}

app.whenReady().then(() => {
  const mainWindow = createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  // When getDisplayMedia is requested, show the picker modal inside the main window
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    if (isWayland()) {
      // Use native picker on wayland
      desktopCapturer
        .getSources({ types: ["screen", "window"] })
        .then((sources) => {
          callback({
            video: sources[0],
            audio: "loopback",
          });
        })
        .catch((error) => {
          console.error("[ScreenShare] Failed to get sources:",error);
          callback({ video: undefined as any });
        });
    } else {
      pendingScreenShareCallback = callback;
      mainWindow.webContents.send("show-screen-picker");
    }
  });

  // Handle the user's source selection (or cancellation) from the modal
  ipcMain.on('source-selected', (_event, sourceId: string) => {
    const cb = pendingScreenShareCallback;
    pendingScreenShareCallback = null;
    if (!cb) return;

    if (sourceId === 'cancel') {
      try { cb(undefined as any); } catch (_) { }
    } else {
      desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
        const selectedSource = sources.find(s => s.id === sourceId);
        cb({ video: selectedSource, audio: 'loopback' });
      });
    }
  });

  ipcMain.handle('get-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 300, height: 200 }
    });

    return sources.map(s => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL(),
      type: s.id.startsWith('screen') ? 'screen' : 'window'
    }));
  });
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
