import {
  keyboard,
  mouse,
  screen,
  Key,
  Button,
  Point,
} from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";
import { CUAActionParams } from "..";
import { convertFromBBoxToPxPosition } from "../utils/convertFromBBoxToPxPostion.js";

export const clearInputAction = async (
  event: IpcMainInvokeEvent,
  args: CUAActionParams
): Promise<NutJSResult> => {
  const { bbox } = args;

  try {
    if (bbox) {
      const m_width = await screen.width();
      const m_height = await screen.height();
      const pos = convertFromBBoxToPxPosition(bbox, m_width, m_height);
      const point = new Point(pos.x, pos.y);
      await mouse.setPosition(point);
    }

    await mouse.click(Button.LEFT);

    await keyboard.pressKey(Key.LeftControl, Key.A);
    await keyboard.releaseKey(Key.A, Key.LeftControl);

    await keyboard.pressKey(Key.Backspace);
    await keyboard.releaseKey(Key.Backspace);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
