import { keyboard, mouse, screen } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";
import { CUAActionParams } from "..";
import { convertFromBBoxToPxPosition } from "../utils/convertFromBBoxToPxPostion.js";

interface TypeActionOptionsParams extends CUAActionParams {
  text: string;
}

export const typingAction = async (
  event: IpcMainInvokeEvent,
  args: TypeActionOptionsParams
): Promise<NutJSResult> => {
  const { bbox, text } = args;

  try {
    const m_width = await screen.width();
    const m_height = await screen.height();
    const pos = convertFromBBoxToPxPosition(bbox, m_width, m_height);
    await mouse.move([pos]);
    await keyboard.type(text);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
