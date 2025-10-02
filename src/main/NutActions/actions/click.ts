import { mouse, Button, screen, Point } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";
import { CUAActionParams } from "..";
import { convertFromBBoxToPxPosition } from "../utils/convertFromBBoxToPxPostion.js";

export interface ClickActionParams extends CUAActionParams {
  button: Button;
}

const clickAction = async (
  event: IpcMainInvokeEvent,
  args: ClickActionParams
): Promise<NutJSResult> => {
  const { button, bbox } = args;

  try {
    if (bbox) {
      const m_width = await screen.width();
      const m_height = await screen.height();
      const pos = convertFromBBoxToPxPosition(bbox, m_width, m_height);
      const point = new Point(pos.x, pos.y);
      await mouse.setPosition(point);
    }

    await mouse.click(button);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const leftClickAction = async (
  event: IpcMainInvokeEvent,
  args: CUAActionParams
): Promise<NutJSResult> => clickAction(event, { button: Button.LEFT, ...args });

export const rightClickAction = async (
  event: IpcMainInvokeEvent,
  args: CUAActionParams
): Promise<NutJSResult> =>
  clickAction(event, { button: Button.RIGHT, ...args });

const doubleClickAction = async (
  event: IpcMainInvokeEvent,
  args: ClickActionParams
): Promise<NutJSResult> => {
  const { button, bbox } = args;

  try {
    if (bbox) {
      const m_width = await screen.width();
      const m_height = await screen.height();
      const pos = convertFromBBoxToPxPosition(bbox, m_width, m_height);
      const point = new Point(pos.x, pos.y);
      await mouse.setPosition(point);
    }

    await mouse.doubleClick(button);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const leftDoubleClickAction = async (
  event: IpcMainInvokeEvent,
  args: CUAActionParams
): Promise<NutJSResult> =>
  doubleClickAction(event, { button: Button.LEFT, ...args });
