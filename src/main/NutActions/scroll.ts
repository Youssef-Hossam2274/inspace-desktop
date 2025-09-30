import { mouse } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../renderer/types/electron";

export interface ScrollActionOptions {
  dir: "up" | "down" | "left" | "right";
  amount: number;
}

export interface ScrollActionResult extends NutJSResult {
  amount?: number;
}

export const scrollAction = async (
  event: IpcMainInvokeEvent,
  args: ScrollActionOptions
): Promise<ScrollActionResult> => {
  const { dir, amount } = args;
  try {
    switch (dir) {
      case "up":
        await mouse.scrollUp(amount);
        break;
      case "down":
        await mouse.scrollDown(amount);
        break;
      case "left":
        await mouse.scrollLeft(amount);
        break;
      case "right":
        await mouse.scrollRight(amount);
        break;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
