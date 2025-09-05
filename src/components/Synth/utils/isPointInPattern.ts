import { SvgPatternType } from "../types/synth.types";
export const isPointInPattern = (
  x: number,
  y: number,
  element: SvgPatternType,
  ctx: CanvasRenderingContext2D,
  circle: boolean
): boolean => {
  let isInPath = false;
  if (!element || !element.points) return isInPath;
  for (const path of element?.points!) {
    if (!circle) {
      ctx.save();
      ctx.beginPath();
      let minX = path[0]?.x,
        maxX = path[0]?.x,
        minY = path[0]?.y,
        maxY = path[0]?.y;
      for (let i = 1; i < path.length; i++) {
        minX = Math.min(minX, path[i]?.x);
        maxX = Math.max(maxX, path[i]?.x);
        minY = Math.min(minY, path[i]?.y);
        maxY = Math.max(maxY, path[i]?.y);
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
      ctx.moveTo(path[0]?.x, path[0]?.y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i]?.x, path[i]?.y);
      }
      ctx.closePath();
      const mouseEventX = x * devicePixelRatio;
      const mouseEventY = y * devicePixelRatio;
      if (ctx.isPointInPath(mouseEventX, mouseEventY)) {
        isInPath = true;
      }
      ctx.restore();
    } else {
      let minXCircle = path[0]?.x,
        maxXCircle = path[0]?.x,
        minYCircle = path[0]?.y,
        maxYCircle = path[0]?.y;
      for (let i = 1; i < path.length; i++) {
        minXCircle = Math.min(minXCircle, path[i]?.x);
        maxXCircle = Math.max(maxXCircle, path[i]?.x);
        minYCircle = Math.min(minYCircle, path[i]?.y);
        maxYCircle = Math.max(maxYCircle, path[i]?.y);
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
      const mouseEventX = x * devicePixelRatio;
      const mouseEventY = y * devicePixelRatio;
      if (ctx.isPointInPath(mouseEventX, mouseEventY)) {
        isInPath = true;
      }
      ctx?.restore();
    }
  }
  return isInPath;
};