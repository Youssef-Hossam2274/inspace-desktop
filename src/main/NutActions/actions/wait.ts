import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";

export interface WaitActionParams {
  duration: number;
}

export const waitAction = async (
  event: IpcMainInvokeEvent,
  args: WaitActionParams
): Promise<NutJSResult> => {
  const { duration } = args;

  try {
    await new Promise((resolve) => setTimeout(resolve, duration));
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
