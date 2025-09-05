import getStroke from "perfect-freehand";
import getSvgPathFromStroke from "./getSvgPathFromStroke";
import { ElementInterface } from "../types/synth.types";
const drawElement = (
  element: ElementInterface,
  ctx: CanvasRenderingContext2D | null
) => {
  ctx?.save();
  switch (element?.type) {
    case "erase":
    case "pencil":
      if (!element.points || element.points.length === 0) return;
      ctx?.beginPath();
      if (element?.type === "erase") {
        ctx!.globalCompositeOperation = "destination-out";
      } else {
        ctx!.globalCompositeOperation = "source-over";
        (ctx as CanvasRenderingContext2D).fillStyle = element?.fill as string;
      }
      if (element.points.length === 1) {
        const point = element.points[0];
        const radius = ((element.strokeWidth || 10) * devicePixelRatio) / 2;
        ctx?.beginPath();
        ctx?.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        ctx?.fill();
      } else {
        const pathData = getSvgPathFromStroke(
          getStroke(
            element?.points as { x: number; y: number; pressure?: number }[],
            {
              size: (element?.strokeWidth as number) * devicePixelRatio,
              thinning: 0.5,
              smoothing: 0.5,
              streamline: 0.5,
              simulatePressure: true,
            }
          )
        );
        ctx?.fill(new Path2D(pathData));
      }
      ctx?.closePath();
      break;
    case "image":
      if (element.image && element.x1 !== undefined && element.y1 !== undefined && element.width && element.height) {
        if (element.rotation && element.rotation !== 0) {
          const centerX = element.x1 + element.width / 2;
          const centerY = element.y1 + element.height / 2;
          ctx?.save();
          ctx?.translate(centerX, centerY);
          ctx?.rotate((element.rotation * Math.PI) / 180);
          ctx?.drawImage(element.image, -element.width / 2, -element.height / 2, element.width, element.height);
          ctx?.restore();
        } else {
          ctx?.drawImage(element.image, element.x1, element.y1, element.width, element.height);
        }
      }
      break;
  }
  ctx?.restore();
};
export default drawElement;
