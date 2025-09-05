export const addImageToCanvas = (
  imageDataUrl: string,
  shouldOverwrite = false
) => {
  const setElementsFn = (window as any).canvasSetElements;
  if (!setElementsFn) {
    return;
  }
  const img = new Image();
  img.onload = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      return;
    }
    const patternCenterX = canvas.width / 2;
    const patternCenterY = canvas.height / 2;
    const patternBaseSize = Math.min(canvas.width, canvas.height) / 6;
    const targetSizeInCanvas = patternBaseSize * 0.8;
    const imgAspect = img.width / img.height;
    let finalWidth, finalHeight;
    if (imgAspect > 1) {
      finalWidth = targetSizeInCanvas;
      finalHeight = targetSizeInCanvas / imgAspect;
    } else {
      finalHeight = targetSizeInCanvas;
      finalWidth = targetSizeInCanvas * imgAspect;
    }
    const centerX = patternCenterX - finalWidth / 2;
    const centerY = patternCenterY - finalHeight / 2;
    const imageElement = {
      id: Date.now(),
      type: "image",
      x1: shouldOverwrite ? centerX : centerX + (Math.random() * 100 - 50),
      y1: shouldOverwrite ? centerY : centerY + (Math.random() * 100 - 50),
      width: finalWidth,
      height: finalHeight,
      rotation: 0,
      image: img,
    };
    try {
      if (shouldOverwrite) {
        setElementsFn([imageElement]);
      } else {
        setElementsFn((prev: any[]) => {
          return [...(prev || []), imageElement];
        });
      }
    } catch (error) {
    }
  };
  img.onerror = () => {
  };
  img.src = imageDataUrl;
};
