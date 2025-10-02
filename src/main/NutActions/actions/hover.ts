import { mouse, screen, Point } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";
import { CUAActionParams } from "..";
import { convertFromBBoxToPxPosition } from "../utils/convertFromBBoxToPxPostion.js";

export const hoverAction = async (
  event: IpcMainInvokeEvent,
  args: CUAActionParams
): Promise<NutJSResult> => {
  try {
    const { bbox } = args;
    if (!bbox) throw new Error("No bounding box provided");

    const m_width = await screen.width();
    const m_height = await screen.height();
    const pos = convertFromBBoxToPxPosition(bbox, m_width, m_height);
    const point = new Point(pos.x, pos.y);
    await mouse.setPosition(point);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
