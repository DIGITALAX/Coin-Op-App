import { CanvasHistory } from "../types/synth.types";
import addRashToCanvas from "./addRashToCanvas";
import drawElement from "./drawElement";
import drawPatternElement from "./drawPatternElement";
import { invoke } from "@tauri-apps/api/core";

export const export300dpi = async (historyItem: CanvasHistory, dpi: number) => {
  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = historyItem.originalCanvasWidth;
  baseCanvas.height = historyItem.originalCanvasHeight;
  const baseCtx = baseCanvas.getContext("2d");
  if (!baseCtx) return;

  baseCtx.save();
  baseCtx.setTransform(1, 0, 0, 1, 0, 0);
  baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
  baseCtx.imageSmoothingEnabled = false;
  baseCtx.imageSmoothingQuality = "high";
  (baseCtx as CanvasRenderingContext2D).globalCompositeOperation = "source-over";

  const basePattern = historyItem.child?.child?.metadata?.image
    ? await addRashToCanvas(
        historyItem.child.child.metadata.image,
        baseCanvas,
        false
      )
    : null;
  if (basePattern) {
    drawPatternElement(basePattern, baseCtx, 96);
  }

  if (historyItem.elements) {
    const clonedElements = historyItem.elements.map((element) => {
      const cloned: any = { ...element };
      if (element.points) {
        cloned.points = element.points.map((point: any) => ({ ...point }));
      }
      return cloned;
    });

    for (const element of clonedElements) {
      if (element.type === "image" && element.imageSrc) {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = element.imageSrc;
        });
        element.image = img;
        drawElement(element, baseCtx, 96);
      } else {
        drawElement(element, baseCtx, 96);
      }
    }
  }

  baseCtx.restore();

  const scale = dpi / 96;
  const canvasWidth = Math.round(baseCanvas.width * scale);
  const canvasHeight = Math.round(baseCanvas.height * scale);

  const highResCanvas = document.createElement("canvas");
  highResCanvas.width = canvasWidth;
  highResCanvas.height = canvasHeight;
  const highResCtx = highResCanvas.getContext("2d");
  if (!highResCtx) return;

  highResCtx.imageSmoothingEnabled = true;
  highResCtx.imageSmoothingQuality = "high";
  highResCtx.drawImage(baseCanvas, 0, 0, canvasWidth, canvasHeight);

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
