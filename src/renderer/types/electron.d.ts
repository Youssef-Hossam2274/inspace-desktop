import { CUAActionOptions } from "../../main/NutActions";

export interface NutJSResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IElectronAPI {
  platform: string;
  executePrompt: (userPrompt: string) => any;
  cuaActions: (params: CUAActionOptions) => Promise<NutJSResult>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
