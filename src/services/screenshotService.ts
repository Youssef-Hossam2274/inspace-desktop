import { Screenshot } from "../agent/types.ts";
import robot from "robotjs";
import { PNG } from 'pngjs';

export async function captureScreenshot(): Promise<Screenshot | null> {
  console.log("[ScreenshotService] Capturing desktop screenshot...");
  
  try {
    const screenSize = robot.getScreenSize();
    console.log(`[ScreenshotService] Screen size: ${screenSize.width}x${screenSize.height}`);
    
    // Capture the screen
    const img = robot.screen.capture(0, 0, screenSize.width, screenSize.height);

    const width = img.width;
    const height = img.height;
    
    // Convert BGRA buffer to PNG and then to base64
    const pngBuffer = createPNGFromBGRA(img.image, width, height);
    
    // Convert PNG buffer to base64 (matching Python's base64.b64encode)
    const base64 = pngBuffer.toString('base64');
    
    console.log("[ScreenshotService] Screenshot captured successfully");
    console.log(`[ScreenshotService] Base64 length: ${base64.length} characters`);
    
    return {
      data: base64,
      timestamp: Date.now(),
      dimensions: {
        width: width,
        height: height
      }
    };
    
  } catch (error) {
    console.error("[ScreenshotService] Failed to capture screenshot:", error);
    return null;
  }
}

/**
 * Converts BGRA buffer from robotjs to PNG buffer
 * This matches the Python behavior of screenshot.save(buffer, format='PNG')
 */
function createPNGFromBGRA(bgraBuffer: Buffer, width: number, height: number): Buffer {
  try {
    const png = new PNG({ 
      width, 
      height,
      colorType: 6, // RGBA
      inputColorType: 6,
      inputHasAlpha: true
    });
    
    // robotjs returns BGRA format, we need to convert to RGBA for PNG
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (width * y + x) * 4;
        const dstIdx = (width * y + x) * 4;
        
        // Convert BGRA to RGBA
        png.data[dstIdx + 0] = bgraBuffer[srcIdx + 2]; // R (from B position)
        png.data[dstIdx + 1] = bgraBuffer[srcIdx + 1]; // G (stays same)
        png.data[dstIdx + 2] = bgraBuffer[srcIdx + 0]; // B (from R position)
        png.data[dstIdx + 3] = bgraBuffer[srcIdx + 3]; // A (stays same)
      }
    }
    
    // Write PNG to buffer (this matches Python's screenshot.save(buffer, format='PNG'))
    return PNG.sync.write(png);
  } catch (error) {
    console.error("[ScreenshotService] Error creating PNG:", error);
    throw error;
  }
}

export async function captureElementScreenshot(bbox: [number, number, number, number]): Promise<Screenshot | null> {
  console.log(`[ScreenshotService] Capturing element screenshot at bbox: [${bbox.join(', ')}]`);
  
  try {
    const screenSize = robot.getScreenSize();
    
    // Convert normalized coordinates to pixel coordinates
    const x = Math.max(0, Math.round(bbox[0] * screenSize.width));
    const y = Math.max(0, Math.round(bbox[1] * screenSize.height));
    const x2 = Math.min(screenSize.width, Math.round(bbox[2] * screenSize.width));
    const y2 = Math.min(screenSize.height, Math.round(bbox[3] * screenSize.height));
    
    const width = x2 - x;
    const height = y2 - y;
    
    console.log(`[ScreenshotService] Capturing region: x=${x}, y=${y}, w=${width}, h=${height}`);
    
    if (width <= 0 || height <= 0) {
      console.error("[ScreenshotService] Invalid dimensions for element screenshot");
      return null;
    }
    
    const img = robot.screen.capture(x, y, width, height);
    
    // Convert to PNG
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