import { CUAActionOptions } from "../../main/NutActions";

export interface NutJSResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IElectronAPI {
  platform: string;
  executePrompt: (userPrompt: string) => Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }>;
  cuaActions: (params: CUAActionOptions) => Promise<NutJSResult>;
  hideWindow: () => Promise<void>;
  showWindow: () => Promise<void>;
  onApprovalNeeded: (
    callback: (data: { actionPlan: any; iteration: number }) => void
  ) => void;
  sendApprovalDecision: (decision: "approve" | "retry") => Promise<void>;
  removeApprovalListener: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
