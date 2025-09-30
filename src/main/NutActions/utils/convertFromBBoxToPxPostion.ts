export const convertFromBBoxToPxPosition = (
  bbox: number[],
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } => {
  return { x: bbox[0] * screenWidth, y: bbox[1] * screenHeight };
};
