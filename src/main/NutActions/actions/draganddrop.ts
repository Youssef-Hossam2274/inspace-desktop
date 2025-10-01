// import { mouse, screen, Point, Button } from "@nut-tree-fork/nut-js";
// import { IpcMainInvokeEvent } from "electron";
// import { NutJSResult } from "../../../renderer/types/electron";
// import { CUAActionParams } from "..";
// import { convertFromBBoxToPxPosition } from "../utils/convertFromBBoxToPxPostion.js";

// export interface DragAndDropParams extends CUAActionParams {
//   targetBbox: {
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//   };
// }

// export const dragAndDropAction = async (
//   event: IpcMainInvokeEvent,
//   args: DragAndDropParams
// ): Promise<NutJSResult> => {
//   const { bbox, targetBbox } = args;

//   try {
//     if (!bbox) throw new Error("No source bounding box provided");
//     if (!targetBbox) throw new Error("No target bounding box provided");

//     const m_width = await screen.width();
//     const m_height = await screen.height();

//     // Move to source position
//     const sourcePos = convertFromBBoxToPxPosition(bbox, m_width, m_height);
//     const sourcePoint = new Point(sourcePos.x, sourcePos.y);
//     await mouse.setPosition(sourcePoint);

//     // Press mouse button
//     await mouse.pressButton(Button.LEFT);

//     // Small delay for stability
//     await new Promise(resolve => setTimeout(resolve, 100));

//     // Move to target position
//     const targetPos = convertFromBBoxToPxPosition(targetBbox, m_width, m_height);
//     const targetPoint = new Point(targetPos.x, targetPos.y);
//     await mouse.setPosition(targetPoint);

//     // Small delay before release
//     await new Promise(resolve => setTimeout(resolve, 100));

//     // Release mouse button
//     await mouse.releaseButton(Button.LEFT);

//     return { success: true };
//   } catch (error) {
//     return { success: false, error: (error as Error).message };
//   }
// };
