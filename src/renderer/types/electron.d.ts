import {
  ScrollActionOptions,
  ScrollActionResult,
} from "../../main/NutActions/scroll";

export interface NutJSResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IElectronAPI {
  platform: string;
  scrollAction: (options: ScrollActionOptions) => Promise<ScrollActionResult>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
