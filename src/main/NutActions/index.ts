import { IpcMainInvokeEvent } from "electron";
import { NutJSResult } from "../../renderer/types/electron";
import {
  leftClickAction,
  leftDoubleClickAction,
  rightClickAction,
} from "./actions/click.js";
import { moveMouse } from "./actions/moveMouse";

type ActionType = "click" | "double_click" | "right_click" | "move_mouse";
//   | "type"
//   | "key_press"
//   | "key_combo"
//   | "clear_input"
//   | "scroll"
//   | "hover"
//   | "paste"
//   | "copy"
//   | "assert_text"
//   | "screenshot"
//   | "wait"
//   | "drag_and_drop"
//   | "custom_action"

export interface CUAActionParams {
  bbox: number[];
}

export interface CUAActionOptions {
  action: ActionType;
  params: any;
}

export const cuaActions = async (
  event: IpcMainInvokeEvent,
  options: CUAActionOptions
): Promise<NutJSResult> => {
  const actionEnum: Record<
    ActionType,
    (event: IpcMainInvokeEvent, params: any) => Promise<NutJSResult>
  > = {
    click: leftClickAction,
    right_click: rightClickAction,
    double_click: leftDoubleClickAction,
    move_mouse: moveMouse,
  };

  return actionEnum[options.action](event, options.params);
};
