import * as path from "path";
import { fileURLToPath } from "url";
import { app, BrowserWindow, ipcMain } from "electron";
import { cuaActions } from "./NutActions/index.js";
import { executeAgentWorkflow } from "./agent/graph.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;
let approvalResolve: ((decision: "approve" | "retry") => void) | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("execute-prompt", async (event, userPrompt: string) => {
  console.log("[MAIN] Received execute-prompt:", userPrompt);

  try {
    const result = await executeAgentWorkflow(
      userPrompt,
      undefined,
      async (state) => {
        // This callback is called when approval is needed
        console.log("[MAIN] Approval needed, sending to renderer...");

        // SHOW WINDOW when approval is needed
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }

        // Send approval request to renderer with action plan details
        mainWindow?.webContents.send("approval-needed", {
          actionPlan: state.action_plan,
          iteration: state.iteration_count,
        });

        // Wait for user decision
        return new Promise<"approve" | "retry">((resolve) => {
          approvalResolve = resolve;
        });
      }
    );

    // Show window at the end too
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }

    return {
      success: result.status === "completed",
      result,
      error: result.status === "failed" ? result.last_error : undefined,
    };
  } catch (error) {
    console.error("[MAIN] Workflow error:", error);
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

// Handle approval decision from renderer
ipcMain.handle(
  "approval-decision",
  async (event, decision: "approve" | "retry") => {
    console.log("[MAIN] Received approval decision:", decision);

    if (approvalResolve) {
      approvalResolve(decision);
      approvalResolve = null;

      // Hide window after decision is made
      if (mainWindow) {
        mainWindow.hide();
      }
    } else {
      console.error("[MAIN] No approval resolver available!");
    }
  }
);

ipcMain.handle("cua-actions", cuaActions);

ipcMain.handle("hide-window", () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle("show-window", () => {
  if (mainWindow) {
    mainWindow.show();
  }
});
