import { WheelEvent } from "react";
const wheelLogic = (
  e: WheelEvent,
  zoom: number,
  setZoom: (e: number) => void,
  canvasState: HTMLCanvasElement,
  pan: {
    xInitial: number;
    yInitial: number;
    xOffset: number;
    yOffset: number;
  },
  setPan: (e: {
    xInitial: number;
    yInitial: number;
    xOffset: number;
    yOffset: number;
  }) => void,
  maxZoom: number
) => {
  e.preventDefault();
  e.stopPropagation();
  const isPinchGesture = e.ctrlKey;
  if (isPinchGesture) {
    const canvasRect = canvasState.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    let newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), maxZoom);
    const canvasCenterX = canvasRect.width / 2;
    const canvasCenterY = canvasRect.height / 2;
    const cursorFromCenterX = mouseX - canvasCenterX;
    const cursorFromCenterY = mouseY - canvasCenterY;
    const scaleChange = newZoom / zoom;
    const cursorMovementX = cursorFromCenterX * (scaleChange - 1);
    const cursorMovementY = cursorFromCenterY * (scaleChange - 1);
    const newXOffset = pan.xOffset - cursorMovementX;
    const newYOffset = pan.yOffset - cursorMovementY;
    requestAnimationFrame(() => {
      setZoom(newZoom);
      setPan({
        xInitial: pan.xInitial,
        yInitial: pan.yInitial,
        xOffset: newXOffset,
        yOffset: newYOffset,
      });
    });
  } else {
    const panSpeed = 2;
    const newXOffset = pan.xOffset - e.deltaX * panSpeed;
    const newYOffset = pan.yOffset - e.deltaY * panSpeed;
    requestAnimationFrame(() => {
      setPan({
        xInitial: pan.xInitial,
        yInitial: pan.yInitial,
        xOffset: newXOffset,
        yOffset: newYOffset,
      });
    });
  }
};
export default wheelLogic;