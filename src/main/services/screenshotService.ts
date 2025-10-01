import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Screenshot } from "../agent/types";
import { screen } from "@nut-tree-fork/nut-js";
import { PNG } from "pngjs";

// Helper function to capture full screen and crop a region
async function captureScreenRegion(
  x: number,
  y: number,
  width: number,
  height: number
): Promise<{ buffer: Buffer; actualWidth: number; actualHeight: number }> {
  const tempFile = path.join(os.tmpdir(), `screenshot_${Date.now()}.png`);

  try {
    // Capture full screen
    await screen.capture(tempFile);

    // Read and parse the PNG
    const fullScreenBuffer = fs.readFileSync(tempFile);
    const fullScreenPng = PNG.sync.read(fullScreenBuffer);

    // Create a new PNG for the cropped region
    const croppedPng = new PNG({ width, height });

    // Copy pixels from the specified region
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const srcX = x + dx;
        const srcY = y + dy;

        // Check bounds
        if (
          srcX >= 0 &&
          srcX < fullScreenPng.width &&
          srcY >= 0 &&
          srcY < fullScreenPng.height
        ) {
          const srcIdx = (fullScreenPng.width * srcY + srcX) << 2;
          const dstIdx = (width * dy + dx) << 2;

          croppedPng.data[dstIdx] = fullScreenPng.data[srcIdx];
          croppedPng.data[dstIdx + 1] = fullScreenPng.data[srcIdx + 1];
          croppedPng.data[dstIdx + 2] = fullScreenPng.data[srcIdx + 2];
          croppedPng.data[dstIdx + 3] = fullScreenPng.data[srcIdx + 3];
        }
      }
    }

    const croppedBuffer = PNG.sync.write(croppedPng);

    // Clean up temp file
    fs.unlinkSync(tempFile);

    return { buffer: croppedBuffer, actualWidth: width, actualHeight: height };
  } catch (error) {
    // Clean up temp file in case of error
    try {
      fs.unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

export async function captureScreenshot(): Promise<Screenshot | null> {
  console.log("Capturing desktop screenshot...");

  try {
    const screenWidth = await screen.width();
    const screenHeight = await screen.height();
    console.log(`Screen size: ${screenWidth}x${screenHeight}`);
    const img = await screen.capture("screenshot.png");

    // Read the captured image file and convert to base64
    const fs = await import("fs");
    const imageBuffer = fs.readFileSync(img);
    const base64 = imageBuffer.toString("base64");

    console.log("Screenshot captured successfully");
    console.log(`Base64 length: ${base64.length} characters`);

    return {
      data: base64,
      timestamp: Date.now(),
      dimensions: {
        width: screenWidth,
        height: screenHeight,
      },
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
  console.log(
    `Capturing region ${regionIndex} from ${gridRows}x${gridCols} grid`
  );

  try {
    const screenWidth = await screen.width();
    const screenHeight = await screen.height();

    const row = Math.floor(regionIndex / gridCols);
    const col = regionIndex % gridCols;

    const regionWidth = Math.floor(screenWidth / gridCols);
    const regionHeight = Math.floor(screenHeight / gridRows);

    const x = col * regionWidth;
    const y = row * regionHeight;

    console.log(
      `Region ${regionIndex} at [${row},${col}]: x=${x}, y=${y}, w=${regionWidth}, h=${regionHeight}`
    );

    // Capture the region using our helper function
    const { buffer, actualWidth, actualHeight } = await captureScreenRegion(
      x,
      y,
      regionWidth,
      regionHeight
    );
    const base64 = buffer.toString("base64");

    console.log(`Region captured: ${actualWidth}x${actualHeight}`);

    return {
      data: base64,
      timestamp: Date.now(),
      dimensions: {
        width: actualWidth,
        height: actualHeight,
      },
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
): Promise<{
  screenshot: Screenshot;
  regionBounds: [number, number, number, number];
} | null> {
  console.log(
    `Capturing ${regionIndices.length} regions as one screenshot: [${regionIndices.join(", ")}]`
  );

  try {
    const screenWidth = await screen.width();
    const screenHeight = await screen.height();
    const regionWidth = screenWidth / gridCols;
    const regionHeight = screenHeight / gridRows;

    // Calculate bounding box that covers all regions
    let minRow = Infinity,
      minCol = Infinity;
    let maxRow = -Infinity,
      maxCol = -Infinity;

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

    console.log(
      `Bounding box: rows[${minRow}-${maxRow}] cols[${minCol}-${maxCol}]`
    );
    console.log(`Screen coords: x=${x}, y=${y}, w=${width}, h=${height}`);

    // Capture the combined area
    const { buffer, actualWidth, actualHeight } = await captureScreenRegion(
      x,
      y,
      width,
      height
    );
    const base64 = buffer.toString("base64");

    console.log(
      `Multi-region screenshot captured: ${actualWidth}x${actualHeight}`
    );

    const regionBounds: [number, number, number, number] = [
      x / screenWidth,
      y / screenHeight,
      (x + width) / screenWidth,
      (y + height) / screenHeight,
    ];

    return {
      screenshot: {
        data: base64,
        timestamp: Date.now(),
        dimensions: {
          width: actualWidth,
          height: actualHeight,
        },
      },
      regionBounds,
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
    regionX + rx1 * regionWidthNorm,
    regionY + ry1 * regionHeightNorm,
    regionX + rx2 * regionWidthNorm,
    regionY + ry2 * regionHeightNorm,
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
    bx1 + lx1 * boundsWidth,
    by1 + ly1 * boundsHeight,
    bx1 + lx2 * boundsWidth,
    by1 + ly2 * boundsHeight,
  ];
}

export async function captureElementScreenshot(
  bbox: [number, number, number, number]
): Promise<Screenshot | null> {
  console.log(`Capturing element screenshot at bbox: [${bbox.join(", ")}]`);

  try {
    const screenWidth = await screen.width();
    const screenHeight = await screen.height();

    const x = Math.max(0, Math.round(bbox[0] * screenWidth));
    const y = Math.max(0, Math.round(bbox[1] * screenHeight));
    const x2 = Math.min(screenWidth, Math.round(bbox[2] * screenWidth));
    const y2 = Math.min(screenHeight, Math.round(bbox[3] * screenHeight));

    const width = x2 - x;
    const height = y2 - y;

    console.log(`Capturing region: x=${x}, y=${y}, w=${width}, h=${height}`);

    if (width <= 0 || height <= 0) {
      console.error(
        "[ScreenshotService] Invalid dimensions for element screenshot"
      );
      return null;
    }

    const { buffer, actualWidth, actualHeight } = await captureScreenRegion(
      x,
      y,
      width,
      height
    );
    const base64 = buffer.toString("base64");

    console.log(`Element screenshot captured: ${actualWidth}x${actualHeight}`);

    return {
      data: base64,
      timestamp: Date.now(),
      dimensions: {
        width: actualWidth,
        height: actualHeight,
      },
    };
  } catch (error) {
    console.error("Failed to capture element screenshot:", error);
    return null;
  }
}
