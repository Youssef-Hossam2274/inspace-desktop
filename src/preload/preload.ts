import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Add any APIs you want to expose to the renderer process here
  platform: process.platform,

  // Nut.js functionality
  executePrompt: (userPrompt: string) =>
    ipcRenderer.invoke("execute-prompt", userPrompt),
  cuaActions: (params: any) => ipcRenderer.invoke("cua-actions", params),
  hideWindow: () => ipcRenderer.invoke("hide-window"),
  showWindow: () => ipcRenderer.invoke("show-window"),
});
