import { keyboard } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";

export interface KeyPressActionParams {
  key: string;
}

export const keyPressAction = async (
  event: IpcMainInvokeEvent,
  args: KeyPressActionParams
): Promise<NutJSResult> => {
  const { key } = args;

  try {
    await keyboard.pressKey(key as any);
    await keyboard.releaseKey(key as any);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
