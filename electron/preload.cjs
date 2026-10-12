const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("nebula", {
  openFile: () => ipcRenderer.invoke("csv:open"),
  setTheme: (theme) => ipcRenderer.send("theme:set", theme),
});
