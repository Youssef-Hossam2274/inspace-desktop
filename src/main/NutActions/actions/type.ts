import { keyboard, mouse } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";
import { CUAActionParams } from "..";

interface TypeActionOptionsParams extends CUAActionParams {
  text: string;
}

export const type = async (
  event: IpcMainInvokeEvent,
  args: TypeActionOptionsParams
): Promise<NutJSResult> => {
  const { bbox, text } = args;

  try {
    const pos = convertFromBBoxToPxPosition(bbox);
    await mouse.move([pos]);
    await keyboard.type(text);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
