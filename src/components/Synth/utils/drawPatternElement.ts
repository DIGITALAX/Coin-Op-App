import { SvgPatternType } from "../types/synth.types";
const drawPatternElement = (
  element: SvgPatternType,
  ctx: CanvasRenderingContext2D | null,
  dpi?: number
) => {
  ctx?.setLineDash([0, 0]);
  const baseStrokeWidth = 10;
  const dpiScale = dpi ? (dpi / 96) : 1;
  (ctx as CanvasRenderingContext2D).lineWidth = baseStrokeWidth * dpiScale;
  (ctx as CanvasRenderingContext2D).strokeStyle = "#FFC800";
  (ctx as CanvasRenderingContext2D).fillStyle = "#000000";
  (ctx as CanvasRenderingContext2D).imageSmoothingEnabled = false;
  switch (element?.type) {
    case "circle":
      for (const subpath of element?.points!) {
        let minXCircle = subpath[0]?.x,
          maxXCircle = subpath[0]?.x,
          minYCircle = subpath[0]?.y,
          maxYCircle = subpath[0]?.y;
        for (let i = 1; i < subpath.length; i++) {
          minXCircle = Math.min(minXCircle, subpath[i]?.x);
          maxXCircle = Math.max(maxXCircle, subpath[i]?.x);
          minYCircle = Math.min(minYCircle, subpath[i]?.y);
          maxYCircle = Math.max(maxYCircle, subpath[i]?.y);
        }
        const centerXCircle = (minXCircle + maxXCircle) / 2;
        const centerYCircle = (minYCircle + maxYCircle) / 2;
        const canvasCenterX = ctx?.canvas.width! / 2;
        const canvasCenterY = ctx?.canvas.height! / 2;
        const dx = canvasCenterX - centerXCircle;
        const dy = canvasCenterY - centerYCircle;
        const radius =
          Math.max(maxXCircle - minXCircle, maxYCircle - minYCircle) / 2;
        ctx?.beginPath();
        ctx?.save();
        ctx?.translate(dx, dy);
        ctx?.translate(centerXCircle, centerYCircle);
        ctx?.scale(0.5, 0.5);
        ctx?.translate(-centerXCircle, -centerYCircle);
        ctx?.arc(centerXCircle, centerYCircle, radius, 0, 2 * Math.PI, false);
        ctx?.closePath();
        ctx?.stroke();
        ctx?.fill();
        ctx?.restore();
      }
      ctx?.clip();
      break;
    case "pattern":
      for (const subpath of element?.points!) {
        ctx?.beginPath();
        ctx?.save();
        let minX = subpath[0]?.x,
          maxX = subpath[0]?.x,
          minY = subpath[0]?.y,
          maxY = subpath[0]?.y;
        for (let i = 1; i < subpath.length; i++) {
          minX = Math.min(minX, subpath[i]?.x);
          maxX = Math.max(maxX, subpath[i]?.x);
          minY = Math.min(minY, subpath[i]?.y);
          maxY = Math.max(maxY, subpath[i]?.y);
        }
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const canvasCenterX = ctx?.canvas.width! / 2;
        const canvasCenterY = ctx?.canvas.height! / 2;
        const dx = canvasCenterX - centerX;
        const dy = canvasCenterY - centerY;
        ctx?.translate(dx, dy);
        ctx?.translate(centerX, centerY);
        ctx?.translate(-centerX, -centerY);
        ctx?.moveTo(subpath[0]?.x, subpath[0]?.y);
        for (let i = 1; i < subpath.length; i++) {
          ctx?.lineTo(subpath[i]?.x, subpath[i]?.y);
        }
        ctx?.closePath();
        ctx?.stroke();
        ctx?.fill();
        ctx?.restore();
      }
      ctx?.clip();
      break;
    case "image":
      ctx?.save();
      ctx?.clip();
      const exportScale = dpi ? (dpi / 96) : devicePixelRatio;
      ctx?.drawImage(
        element.image!,
        element.x1!,
        element.y1!,
        (element?.width as number) * exportScale,
        (element?.height as number) * exportScale
      );
      ctx?.restore();
      break;
  }
};
export default drawPatternElement;