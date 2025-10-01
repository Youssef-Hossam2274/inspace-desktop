import { mouse, Button, screen } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";
import { CUAActionParams } from "..";
import { convertFromBBoxToPxPosition } from "../utils/convertFromBBoxToPxPostion.js";

export const dragAndDropAction = async (
  event: IpcMainInvokeEvent,
  args: CUAActionParams
): Promise<NutJSResult> => {
  try {
    const { from_bbox, to_bbox } = args.parameters || {};
    if (!from_bbox || !to_bbox) {
      throw new Error("Missing from_bbox or to_bbox for drag and drop");
    }

    const m_width = await screen.width();
    const m_height = await screen.height();

    const fromPos = convertFromBBoxToPxPosition(from_bbox, m_width, m_height);
    const toPos = convertFromBBoxToPxPosition(to_bbox, m_width, m_height);

    await mouse.move([fromPos]);
    await mouse.pressButton(Button.LEFT);

    await mouse.move([toPos]);
    await mouse.releaseButton(Button.LEFT);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
