import { mouse } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";
import { CUAActionParams } from "..";
import { convertFromBBoxToPxPosition } from "../utils/convertFromBBoxToPxPostion.js";

export const moveMouse = async (
  event: IpcMainInvokeEvent,
  args: CUAActionParams
): Promise<NutJSResult> => {
  const { bbox } = args;

  try {
    const pos = convertFromBBoxToPxPosition(bbox);
    await mouse.move([pos]);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
