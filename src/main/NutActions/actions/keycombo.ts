import { keyboard } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";

export interface KeyComboActionParams {
  keys: string[];
}

export const keyComboAction = async (
  event: IpcMainInvokeEvent,
  args: KeyComboActionParams
): Promise<NutJSResult> => {
  const { keys } = args;

  try {
    for (const key of keys) {
      await keyboard.pressKey(key as any);
    }

    for (let i = keys.length - 1; i >= 0; i--) {
      await keyboard.releaseKey(keys[i] as any);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
