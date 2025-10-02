import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../renderer/types/electron";
import { ActionType } from "../agent/types";

export interface CUAActionParams {
  bbox: number[];
}

export interface CUAActionOptions {
  action: ActionType;
  params: any;
}

export const cuaActions = async (
  event: IpcMainInvokeEvent,
  options: CUAActionOptions
): Promise<NutJSResult> => {
  const { action, params } = options;
  console.log(`[cuaActions] Executing action: ${action}`);
  console.log(`[cuaActions] Params:`, params);
  try {
    switch (action) {
      default:
        return {
          success: false,
          error: `Unknown action type: ${action}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
