export const captureAndSaveCompositeCanvas = async (
  templateId: string,
  side: "front" | "back",
  setItem: (key: string, value: any, category: string) => Promise<void>
): Promise<string | null> => {
  try {
    const compositeCanvases = document.querySelectorAll("canvas");
    let compositeCanvas: HTMLCanvasElement | null = null;
    for (const canvas of compositeCanvases) {
      if (canvas.width === 600 && canvas.height === 600) {
        compositeCanvas = canvas;
        break;
      }
    }
    if (!compositeCanvas) {
      compositeCanvas = compositeCanvases[0] as HTMLCanvasElement;
    }
    if (!compositeCanvas) {
      return null;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    const dataURL = compositeCanvas.toDataURL("image/png");
    const captureKey = `compositeCanvasCapture_${templateId}_${side}`;
    await setItem(captureKey, dataURL, "composite");
    return dataURL;
  } catch (error) {
    return null;
  }
};
