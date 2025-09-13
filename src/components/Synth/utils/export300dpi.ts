import { CanvasHistory } from "../types/synth.types";
import addRashToCanvas from "./addRashToCanvas";
import drawElement from "./drawElement";
import drawPatternElement from "./drawPatternElement";
import { invoke } from "@tauri-apps/api/core";

export const export300dpi = async (historyItem: CanvasHistory, dpi: number) => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 1000;
  tempCanvas.height = 1000;

  let pattern = null;
  if (historyItem.child?.child?.metadata?.image) {
    pattern = await addRashToCanvas(
      historyItem.child.child.metadata.image,
      tempCanvas,
      true
    );
  }

  if (!pattern) {
    return;
  }

  const patternWidth = pattern.originalWidth || 1;
  const patternHeight = pattern.originalHeight || 1;
  const aspectRatio = patternWidth / patternHeight;

  const maxSizeInPixels = Math.round(16.535 * dpi);

  let canvasWidth, canvasHeight;
  if (aspectRatio >= 1) {
    canvasWidth = maxSizeInPixels;
    canvasHeight = Math.round(maxSizeInPixels / aspectRatio);
  } else {
    canvasHeight = maxSizeInPixels;
    canvasWidth = Math.round(maxSizeInPixels * aspectRatio);
  }

  const highResCanvas = document.createElement("canvas");
  highResCanvas.width = canvasWidth;
  highResCanvas.height = canvasHeight;
  const highResCtx = highResCanvas.getContext("2d");
  if (!highResCtx) return;

  highResCtx.save();
  highResCtx.setTransform(1, 0, 0, 1, 0, 0);
  highResCtx.clearRect(0, 0, highResCanvas.width, highResCanvas.height);
  highResCtx.imageSmoothingEnabled = false;
  highResCtx.imageSmoothingQuality = "high";
  (highResCtx as CanvasRenderingContext2D).globalCompositeOperation =
    "source-over";

  const highResPattern = await addRashToCanvas(
    historyItem.child.child.metadata.image,
    highResCanvas,
    true
  );
  if (highResPattern) {
    drawPatternElement(highResPattern, highResCtx, dpi);
  }

  const elementsCanvas = document.createElement("canvas");
  elementsCanvas.width = canvasWidth;
  elementsCanvas.height = canvasHeight;
  const elementsCtx = elementsCanvas.getContext("2d");

  if (elementsCtx && historyItem.elements) {
    elementsCtx.imageSmoothingEnabled = false;
    elementsCtx.imageSmoothingQuality = "high";

    const originalCanvasWidth = historyItem.originalCanvasWidth;
    const originalCanvasHeight = historyItem.originalCanvasHeight;

    const scaleFactorX = canvasWidth / originalCanvasWidth;
    const scaleFactorY = canvasHeight / originalCanvasHeight;

    for (const element of historyItem.elements) {
      const scaledElement = {
        ...element,
        points: element.points?.map((point: any) => ({
          x: point.x * scaleFactorX,
          y: point.y * scaleFactorY,
          pressure: point.pressure,
        })),
        x1: element.x1 ? element.x1 * scaleFactorX : undefined,
        y1: element.y1 ? element.y1 * scaleFactorY : undefined,
        x2: element.x2 ? element.x2 * scaleFactorX : undefined,
        y2: element.y2 ? element.y2 * scaleFactorY : undefined,
        width: element.width ? element.width * scaleFactorX : undefined,
        height: element.height ? element.height * scaleFactorY : undefined,
        strokeWidth: element.strokeWidth
          ? Math.max(
              element.strokeWidth * scaleFactorX,
              element.strokeWidth * scaleFactorY
            )
          : undefined,
      };

      if (element.type === "image" && element.imageSrc && !element.image) {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = element.imageSrc;
        });
        const imageElement = { ...scaledElement, image: img };
        drawElement(imageElement, elementsCtx, dpi);
      } else {
        drawElement(scaledElement, elementsCtx, dpi);
      }
    }

    highResCtx.drawImage(elementsCanvas, 0, 0);
  }

  highResCtx.restore();

  const imageData = highResCtx.getImageData(
    0,
    0,
    highResCanvas.width,
    highResCanvas.height
  );
  const data = imageData.data;
  let minX = highResCanvas.width,
    maxX = 0;
  let minY = highResCanvas.height,
    maxY = 0;
  let hasContent = false;

  const step = 4;
  for (let y = 0; y < highResCanvas.height; y += step) {
    for (let x = 0; x < highResCanvas.width; x += step) {
      const index = (y * highResCanvas.width + x) * 4;
      if (data[index + 3] > 0) {
        hasContent = true;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!hasContent) return;

  minX = Math.max(0, minX - step);
  maxX = Math.min(highResCanvas.width - 1, maxX + step);
  minY = Math.max(0, minY - step);
  maxY = Math.min(highResCanvas.height - 1, maxY + step);

  const boundsWidth = maxX - minX + 1;
  const boundsHeight = maxY - minY + 1;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = boundsWidth;
  finalCanvas.height = boundsHeight;
  const finalCtx = finalCanvas.getContext("2d");
  if (!finalCtx) return;

  finalCtx.drawImage(
    highResCanvas,
    minX,
    minY,
    boundsWidth,
    boundsHeight,
    0,
    0,
    boundsWidth,
    boundsHeight
  );

  const blob = await new Promise<Blob>((resolve) => {
    finalCanvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/png");
  });

  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

export const export300dpiWithMetadata = async (
  historyItem: CanvasHistory,
  dpi: number = 300
): Promise<Blob | null> => {
  try {
    const uint8Array = await export300dpi(historyItem, dpi);

    if (!uint8Array) {
      return null;
    }

    const pngWithDpi = (await invoke("add_dpi_metadata", {
      data: Array.from(uint8Array),
      dpi: dpi,
    })) as number[];

    const finalUint8Array = new Uint8Array(pngWithDpi);
    const blob = new Blob([finalUint8Array], { type: "image/png" });
    return blob;
  } catch (error) {
    console.error("Failed to add DPI metadata:", error);
    return null;
  }
};
