import * as path from "path";
import { fileURLToPath } from "url";
import { app, BrowserWindow, ipcMain } from "electron";
import { cuaActions } from "./NutActions/index.js";
import { executeAgentWorkflow } from "./agent/graph.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("execute-prompt", async (event, userPrompt: string) => {
  console.log(`Received prompt: ${userPrompt}`);
  try {
    const result = await executeAgentWorkflow(userPrompt);
    return { success: true, result };
  } catch (error) {
    console.error(
      "Error executing agent workflow:",
      error instanceof Error ? error.message : error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("cua-actions", cuaActions);
