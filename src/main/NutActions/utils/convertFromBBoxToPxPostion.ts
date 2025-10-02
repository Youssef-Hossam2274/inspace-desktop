export const convertFromBBoxToPxPosition = (
  bbox: number[],
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } => {
  const centerX = ((bbox[0] + bbox[2]) / 2) * screenWidth;
  const centerY = ((bbox[1] + bbox[3]) / 2) * screenHeight;

  return {
    x: Math.round(centerX),
    y: Math.round(centerY),
  };
};
