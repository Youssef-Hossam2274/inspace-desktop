import { keyboard, Key } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";

export const pasteAction = async (
  event: IpcMainInvokeEvent
): Promise<NutJSResult> => {
  try {
    await keyboard.pressKey(Key.LeftControl, Key.V);
    await keyboard.releaseKey(Key.LeftControl, Key.V);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
