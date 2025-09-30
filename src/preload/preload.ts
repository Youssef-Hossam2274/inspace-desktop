import { contextBridge, ipcRenderer } from "electron";

// Local type definitions to avoid importing from main process
interface ScrollActionOptions {
  dir: "up" | "down" | "left" | "right";
  amount: number;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Add any APIs you want to expose to the renderer process here
  platform: process.platform,

  // Nut.js functionality
  scrollAction: (options: ScrollActionOptions) =>
    ipcRenderer.invoke("scroll-action", options),
});
