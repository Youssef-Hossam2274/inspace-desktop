import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,

  executePrompt: (userPrompt: string) =>
    ipcRenderer.invoke("execute-prompt", userPrompt),

  cuaActions: (params: any) => ipcRenderer.invoke("cua-actions", params),

  hideWindow: () => ipcRenderer.invoke("hide-window"),

  showWindow: () => ipcRenderer.invoke("show-window"),

  onApprovalNeeded: (callback: (data: any) => void) => {
    ipcRenderer.on("approval-needed", (_event, data) => callback(data));
  },

  sendApprovalDecision: (decision: "approve" | "retry") =>
    ipcRenderer.invoke("approval-decision", decision),

  removeApprovalListener: () => {
    ipcRenderer.removeAllListeners("approval-needed");
  },
});
