const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  nativeTheme,
} = require("electron");
const path = require("node:path");
const { filesFromArguments, fileOpenResult } = require("./files.cjs");
let mainWindow;
let rendererReady = false;
let externalReadId = 0;
let deliveringExternalFiles = false;
const startupFiles = filesFromArguments(
  process.argv.slice(app.isPackaged ? 1 : 2),
  process.cwd(),
);
const pendingExternalFiles = [...startupFiles];

function trustedSender(event) {
  return (
    mainWindow &&
    !mainWindow.isDestroyed() &&
    event.sender === mainWindow.webContents &&
    event.senderFrame === mainWindow.webContents.mainFrame
  );
}

function focusWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

async function deliverExternalFile() {
  if (deliveringExternalFiles || !rendererReady || !mainWindow) return;
  deliveringExternalFiles = true;
  try {
    while (rendererReady && mainWindow && pendingExternalFiles.length) {
      const target = mainWindow;
      const requestId = externalReadId;
      const result = await fileOpenResult(pendingExternalFiles[0]);
      if (
        requestId !== externalReadId ||
        !rendererReady ||
        target.isDestroyed() ||
        target !== mainWindow
      )
        return;
      pendingExternalFiles.shift();
      target.webContents.send("csv:file", result);
    }
  } finally {
    deliveringExternalFiles = false;
    if (rendererReady && mainWindow && pendingExternalFiles.length)
      void deliverExternalFile();
  }
}

function queueExternalFile(filename) {
  pendingExternalFiles.push(filename);
  if (app.isReady() && !mainWindow) createWindow();
  focusWindow();
  void deliverExternalFile();
}

function createWindow() {
  rendererReady = false;
  externalReadId += 1;
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "Nebula CSV Viewer",
    backgroundColor: "#f7f9f8",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const window = mainWindow;
  window.webContents.on("did-start-loading", () => {
    rendererReady = false;
    externalReadId += 1;
  });
  window.on("closed", () => {
    if (mainWindow === window) {
      mainWindow = null;
      rendererReady = false;
      externalReadId += 1;
    }
  });
  Menu.setApplicationMenu(null);
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (e) => e.preventDefault());
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  if (!app.isPackaged && process.env.VITE_DEV_SERVER_URL)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  else mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}
if (!app.requestSingleInstanceLock({ filePaths: startupFiles })) {
  app.quit();
} else {
  if (process.platform === "win32")
    app.setAppUserModelId("com.porkstone.nebulacsv");
  app.on(
    "second-instance",
    (_event, args, workingDirectory, additionalData) => {
      const filenames =
        additionalData?.filePaths ||
        filesFromArguments(args.slice(1), workingDirectory);
      if (filenames.length) filenames.forEach(queueExternalFile);
      else focusWindow();
    },
  );
  app.on("open-file", (event, filename) => {
    event.preventDefault();
    queueExternalFile(filename);
  });
  app.whenReady().then(() => {
    ipcMain.on("csv:ready", (event) => {
      if (!trustedSender(event)) return;
      rendererReady = true;
      void deliverExternalFile();
    });
    ipcMain.on("theme:set", (event, theme) => {
      if (trustedSender(event) && ["system", "dark", "light"].includes(theme))
        nativeTheme.themeSource = theme;
    });
    ipcMain.handle("csv:open", async (event) => {
      if (!trustedSender(event)) throw new Error("Invalid sender");
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: "Open CSV files",
        properties: ["openFile", "multiSelections"],
        filters: [
          { name: "Delimited text files", extensions: ["csv", "tsv", "txt"] },
        ],
      });
      if (canceled) return [];
      // Read sequentially to avoid retaining several raw file buffers at once.
      const results = [];
      for (const filename of filePaths)
        results.push(await fileOpenResult(filename));
      return results;
    });
    if (!mainWindow) createWindow();
    app.on("activate", () => {
      if (!BrowserWindow.getAllWindows().length) createWindow();
    });
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
