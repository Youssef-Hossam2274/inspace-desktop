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
    
    console.log(`[ScreenshotService] Element screenshot captured: ${img.width}x${img.height}`);
    
    return {
      data: base64,
      timestamp: Date.now(),
      dimensions: {
        width: img.width,
        height: img.height
      }
    };
    
  } catch (error) {
    console.error("[ScreenshotService] Failed to capture element screenshot:", error);
    return null;
  }
}