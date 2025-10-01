import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";
import { CUAActionParams } from "..";

export const waitAction = async (
  event: IpcMainInvokeEvent,
  args: CUAActionParams
): Promise<NutJSResult> => {
  try {
    const { parameters } = args;
    const duration = parameters?.duration ?? 1000;

    await new Promise((resolve) => setTimeout(resolve, duration));

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
