import { mouse, Button } from "@nut-tree-fork/nut-js";
import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../../renderer/types/electron";
import { CUAActionParams } from "..";

export interface ClickActionParams extends CUAActionParams {
  button: Button;
}

const clickAction = async (
  event: IpcMainInvokeEvent,
  args: ClickActionParams
): Promise<NutJSResult> => {
  const { button } = args;

  try {
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

export const doubleClickAction = async (
  event: IpcMainInvokeEvent,
  args: ClickActionParams
): Promise<NutJSResult> => {
  const { button } = args;

  try {
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
