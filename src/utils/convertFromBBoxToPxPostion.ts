export const convertFromBBoxToPxPosition = (
  bbox: number[]
): { x: number; y: number } => {
  return { x: bbox[0], y: bbox[1] };
};
