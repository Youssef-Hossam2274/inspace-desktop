import { keyboard, Key } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";

export const copyAction = async (
  event: IpcMainInvokeEvent
): Promise<NutJSResult> => {
  try {
    await keyboard.pressKey(Key.LeftControl, Key.C);
    await keyboard.releaseKey(Key.LeftControl, Key.C);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
