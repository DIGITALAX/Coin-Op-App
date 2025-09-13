import { SvgPatternType } from "../types/synth.types";
import convertSvgToPath from "./convertSvgToPath";
const addRashToCanvas = async (
  image: string,
  canvas: HTMLCanvasElement,
  dpi?: boolean
): Promise<SvgPatternType> => {
  try {
    const { subpaths, bbox, circle } = await convertSvgToPath(image, 1);
    const bounds = canvas?.getBoundingClientRect();
    const bboxWidth = bbox.xMax - bbox.xMin;
    const bboxHeight = bbox.yMax - bbox.yMin;
    const scaleFactorX = canvas.width / bboxWidth;
    const scaleFactorY = canvas.height / bboxHeight;
    const scaleFactor = Math.min(scaleFactorX, scaleFactorY);
    const divider = dpi ? 1 : devicePixelRatio;
    const newElement: SvgPatternType = {
      id: 0,
      points: subpaths.map((subpath) =>
        subpath.map((point) => ({
          x: ((point.x - bbox.xMin) * scaleFactor) / divider,
          y: ((point.y - bbox.yMin) * scaleFactor) / divider,
        }))
      ),
      type: circle ? "circle" : "pattern",
      posX: 0,
      posY: 0,
      stroke: "#ffc800",
      scaleFactorX: scaleFactor,
      scaleFactorY: scaleFactor,
      bounds: {
        left: bounds.left,
        top: bounds.top,
      },
      originalWidth: bboxWidth,
      originalHeight: bboxHeight,
    };
    return newElement;
  } catch (err: any) {
    throw err;
  }
};
export default addRashToCanvas;