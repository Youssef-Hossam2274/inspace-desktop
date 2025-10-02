import { keyboard, mouse, screen, Point } from "@nut-tree-fork/nut-js";
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
    if (bbox) {
      const m_width = await screen.width();
      const m_height = await screen.height();
      const pos = convertFromBBoxToPxPosition(bbox, m_width, m_height);
      const point = new Point(pos.x, pos.y);
      await mouse.setPosition(point);
    }
    keyboard.config.autoDelayMs = 50;
    await keyboard.type(text);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
