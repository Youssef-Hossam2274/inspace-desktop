import { Screenshot } from "../agent/types";
import robot from "robotjs";
import { PNG } from 'pngjs';

export async function captureScreenshot(): Promise<Screenshot | null> {
  console.log("Capturing desktop screenshot...");
  
  try {
    const screenSize = robot.getScreenSize();
    console.log(`Screen size: ${screenSize.width}x${screenSize.height}`);
    const img = robot.screen.capture(0, 0, screenSize.width, screenSize.height);
    const width = img.width;
    const height = img.height;
    const pngBuffer = createPNGFromBGRA(img.image, width, height);
    const base64 = pngBuffer.toString('base64');
    
    console.log("Screenshot captured successfully");
    console.log(`Base64 length: ${base64.length} characters`);
    
    return {
      data: base64,
      timestamp: Date.now(),
      dimensions: {
        width: width,
        height: height
      }
    };
    
  } catch (error) {
    console.error("Failed to capture screenshot:", error);
    return null;
  }
}

export async function captureGridRegion(
  regionIndex: number,
  gridRows: number = 4,
  gridCols: number = 4
): Promise<Screenshot | null> {
  console.log(`Capturing region ${regionIndex} from ${gridRows}x${gridCols} grid`);
  
  try {
    const screenSize = robot.getScreenSize();

    const row = Math.floor(regionIndex / gridCols);
    const col = regionIndex % gridCols;
    
    const regionWidth = Math.floor(screenSize.width / gridCols);
    const regionHeight = Math.floor(screenSize.height / gridRows);
    
    const x = col * regionWidth;
    const y = row * regionHeight;
    
    console.log(`Region ${regionIndex} at [${row},${col}]: x=${x}, y=${y}, w=${regionWidth}, h=${regionHeight}`);
    
    // Capture the region
    const img = robot.screen.capture(x, y, regionWidth, regionHeight);
    const pngBuffer = createPNGFromBGRA(img.image, img.width, img.height);
    const base64 = pngBuffer.toString('base64');
    
    console.log(`Region captured: ${img.width}x${img.height}`);
    
    return {
      data: base64,
      timestamp: Date.now(),
      dimensions: {
        width: img.width,
        height: img.height
      }
    };
    
  } catch (error) {
    console.error("Failed to capture region:", error);
    return null;
  }
}

export async function captureMultipleRegions(
  regionIndices: number[],
  gridRows: number = 4,
  gridCols: number = 4
): Promise<{ screenshot: Screenshot; regionBounds: [number, number, number, number] } | null> {
  console.log(`Capturing ${regionIndices.length} regions as one screenshot: [${regionIndices.join(', ')}]`);
  
  try {
    const screenSize = robot.getScreenSize();
    const regionWidth = screenSize.width / gridCols;
    const regionHeight = screenSize.height / gridRows;
    
    // Calculate bounding box that covers all regions
    let minRow = Infinity, minCol = Infinity;
    let maxRow = -Infinity, maxCol = -Infinity;
    
    for (const idx of regionIndices) {
      const row = Math.floor(idx / gridCols);
      const col = idx % gridCols;
      minRow = Math.min(minRow, row);
      minCol = Math.min(minCol, col);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    }
    
    // Calculate absolute screen coordinates
    const x = Math.floor(minCol * regionWidth);
    const y = Math.floor(minRow * regionHeight);
    const width = Math.floor((maxCol + 1) * regionWidth) - x;
    const height = Math.floor((maxRow + 1) * regionHeight) - y;
    
    console.log(`Bounding box: rows[${minRow}-${maxRow}] cols[${minCol}-${maxCol}]`);
    console.log(`Screen coords: x=${x}, y=${y}, w=${width}, h=${height}`);
    
    // Capture the combined area
    const img = robot.screen.capture(x, y, width, height);
    const pngBuffer = createPNGFromBGRA(img.image, img.width, img.height);
    const base64 = pngBuffer.toString('base64');
    
    console.log(`Multi-region screenshot captured: ${img.width}x${img.height}`);
    
    const regionBounds: [number, number, number, number] = [
      x / screenSize.width,
      y / screenSize.height,
      (x + width) / screenSize.width,
      (y + height) / screenSize.height
    ];
    
    return {
      screenshot: {
        data: base64,
        timestamp: Date.now(),
        dimensions: {
          width: img.width,
          height: img.height
        }
      },
      regionBounds
    };
    
  } catch (error) {
    console.error("Failed to capture multi-region:", error);
    return null;
  }
}

export function regionCoordsToScreenCoords(
  regionCoords: [number, number, number, number],
  regionIndex: number,
  gridRows: number = 4,
  gridCols: number = 4
): [number, number, number, number] {
  
  const row = Math.floor(regionIndex / gridCols);
  const col = regionIndex % gridCols;
  const regionWidthNorm = 1.0 / gridCols;
  const regionHeightNorm = 1.0 / gridRows;
  const regionX = col * regionWidthNorm;
  const regionY = row * regionHeightNorm;
  const [rx1, ry1, rx2, ry2] = regionCoords;
  
  return [
    regionX + (rx1 * regionWidthNorm),
    regionY + (ry1 * regionHeightNorm),
    regionX + (rx2 * regionWidthNorm),
    regionY + (ry2 * regionHeightNorm)
  ];
}


export function multiRegionCoordsToScreen(
  localCoords: [number, number, number, number],
  regionBounds: [number, number, number, number]
): [number, number, number, number] {
  const [bx1, by1, bx2, by2] = regionBounds;
  const [lx1, ly1, lx2, ly2] = localCoords;
  
  const boundsWidth = bx2 - bx1;
  const boundsHeight = by2 - by1;
  
  return [
    bx1 + (lx1 * boundsWidth),
    by1 + (ly1 * boundsHeight),
    bx1 + (lx2 * boundsWidth),
    by1 + (ly2 * boundsHeight)
  ];
}


function createPNGFromBGRA(bgraBuffer: Buffer, width: number, height: number): Buffer {
  try {
    const png = new PNG({ 
      width, 
      height,
      colorType: 6,
      inputColorType: 6,
      inputHasAlpha: true
    });
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (width * y + x) * 4;
        const dstIdx = (width * y + x) * 4;
        
        png.data[dstIdx + 0] = bgraBuffer[srcIdx + 2]; 
        png.data[dstIdx + 1] = bgraBuffer[srcIdx + 1]; 
        png.data[dstIdx + 2] = bgraBuffer[srcIdx + 0];
        png.data[dstIdx + 3] = bgraBuffer[srcIdx + 3]; 
      }
    }
    
    return PNG.sync.write(png);
  } catch (error) {
    console.error("Error creating PNG:", error);
    throw error;
  }
}

export async function captureElementScreenshot(bbox: [number, number, number, number]): Promise<Screenshot | null> {
  console.log(`Capturing element screenshot at bbox: [${bbox.join(', ')}]`);
  
  try {
    const screenSize = robot.getScreenSize();
    
    const x = Math.max(0, Math.round(bbox[0] * screenSize.width));
    const y = Math.max(0, Math.round(bbox[1] * screenSize.height));
    const x2 = Math.min(screenSize.width, Math.round(bbox[2] * screenSize.width));
    const y2 = Math.min(screenSize.height, Math.round(bbox[3] * screenSize.height));
    
    const width = x2 - x;
    const height = y2 - y;
    
    console.log(`Capturing region: x=${x}, y=${y}, w=${width}, h=${height}`);
    
    if (width <= 0 || height <= 0) {
      console.error("[ScreenshotService] Invalid dimensions for element screenshot");
      return null;
    }
    
    const img = robot.screen.capture(x, y, width, height);
    
    const pngBuffer = createPNGFromBGRA(img.image, img.width, img.height);
    const base64 = pngBuffer.toString('base64');
    
    console.log(`Element screenshot captured: ${img.width}x${img.height}`);
    
    return {
      data: base64,
      timestamp: Date.now(),
      dimensions: {
        width: img.width,
        height: img.height
      }
    };
    
  } catch (error) {
    console.error("Failed to capture element screenshot:", error);
    return null;
  }
}