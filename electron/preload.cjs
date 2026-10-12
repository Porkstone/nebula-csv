const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("nebula", {
  openFile: () => ipcRenderer.invoke("csv:open"),
  setTheme: (theme) => ipcRenderer.send("theme:set", theme),
  onFileOpened: (callback) => {
    const listener = (_event, result) => callback(result);
    ipcRenderer.on("csv:file", listener);
    ipcRenderer.send("csv:ready");
    return () => ipcRenderer.removeListener("csv:file", listener);
  },
});
