const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  nativeTheme,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
let mainWindow;
function createWindow() {
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
app.whenReady().then(() => {
  ipcMain.on("theme:set", (event, theme) => {
    if (
      event.sender === mainWindow.webContents &&
      ["system", "dark", "light"].includes(theme)
    )
      nativeTheme.themeSource = theme;
  });
  ipcMain.handle("csv:open", async (event) => {
    if (
      event.sender !== mainWindow.webContents ||
      event.senderFrame !== mainWindow.webContents.mainFrame
    )
      throw new Error("Invalid sender");
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Open CSV file",
      properties: ["openFile"],
      filters: [
        { name: "Delimited text files", extensions: ["csv", "tsv", "txt"] },
      ],
    });
    if (canceled || !filePaths[0]) return null;
    const handle = await fs.open(filePaths[0], "r");
    try {
      const stat = await handle.stat();
      if (!stat.isFile()) throw new Error("Please choose a regular file.");
      if (stat.size > 50 * 1024 * 1024)
        throw new Error("This file exceeds the 50 MB preview limit.");
      return {
        name: path.basename(filePaths[0]),
        text: await handle.readFile({ encoding: "utf8" }),
      };
    } finally {
      await handle.close();
    }
  });
  createWindow();
  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
