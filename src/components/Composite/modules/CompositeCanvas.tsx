import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  MouseEvent,
} from "react";
import { INFURA_GATEWAY } from "../../../lib/constants";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useApp } from "../../../context/AppContext";
import {
  ChildElement,
  CompositeCanvasProps,
  CompositeCanvasRef,
} from "../types/composite.types";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";

const getImageUrl = (uri: string): string => {
  if (uri.startsWith("data:")) {
    return uri;
  }
  if (uri.startsWith("ipfs://")) {
    const hash = uri.replace("ipfs://", "");
    return `${INFURA_GATEWAY}/ipfs/${hash}`;
  }
  if (uri.startsWith("Qm") || uri.startsWith("baf")) {
    return `${INFURA_GATEWAY}/ipfs/${uri}`;
  }
  return uri;
};
const CompositeCanvas = forwardRef<CompositeCanvasRef, CompositeCanvasProps>(
  ({ backgroundImage, onCanvasChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { setItem, getItem } = useDesignStorage();
    const { selectedLayer, isBackSide } = useApp();
    const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
    const [children, setChildren] = useState<ChildElement[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [mode, setMode] = useState<"normal" | "warp">("normal");
    const [isLoaded, setIsLoaded] = useState(false);
    const [dragState, setDragState] = useState<{
      isDragging: boolean;
      isResizing: boolean;
      isWarping: boolean;
      elementId: string | null;
      startX: number;
      startY: number;
      offsetX: number;
      offsetY: number;
      resizeHandle: "nw" | "ne" | "sw" | "se" | null;
      warpPoint: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null;
      initialWidth: number;
      initialHeight: number;
    }>({
      isDragging: false,
      isResizing: false,
      isWarping: false,
      elementId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      resizeHandle: null,
      warpPoint: null,
      initialWidth: 0,
      initialHeight: 0,
    });
    const canvasWidth = 600;
    const canvasHeight = 600;
    const getStorageKey = useCallback(() => {
      if (!selectedLayer) return null;
      return `compositeCanvasChildren_${currentTemplate?.templateId}`;
    }, [selectedLayer]);

    useEffect(() => {
      const loadChildren = async () => {
        const key = getStorageKey();
        if (!key) return;
        try {
          const savedChildren = await getItem(key, "composite", []);
          if (Array.isArray(savedChildren) && savedChildren.length > 0) {
            setChildren(savedChildren);
          }
          setIsLoaded(true);
        } catch (error) {
          setIsLoaded(true);
        }
      };
      loadChildren();
    }, [getStorageKey, getItem]);

    useEffect(() => {
      if (!isLoaded) return;
      const saveChildren = async () => {
        const key = getStorageKey();
        if (!key) return;
        try {
          await setItem(key, children, "composite");
        } catch (error) {}
      };
      const timeoutId = setTimeout(saveChildren, 500);
      return () => clearTimeout(timeoutId);
    }, [children, getStorageKey, setItem, isLoaded]);
    const redraw = useCallback(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (backgroundImage) {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve();
          };
          img.onerror = () => {
            resolve();
          };
          img.src = getImageUrl(backgroundImage);
        });
      } else {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        ctx.fillStyle = "#666";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Generate a background image to start compositing",
          canvas.width / 2,
          canvas.height / 2
        );
      }
      for (const child of children) {
        const img = new Image();
        const imageUrl = getImageUrl(child.imageUrl);
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const tolerance = 1;
            const isWarped =
              child.warpPoints &&
              (Math.abs(child.warpPoints.topLeft.x - child.x) > tolerance ||
                Math.abs(child.warpPoints.topLeft.y - child.y) > tolerance ||
                Math.abs(
                  child.warpPoints.topRight.x - (child.x + child.width)
                ) > tolerance ||
                Math.abs(child.warpPoints.topRight.y - child.y) > tolerance ||
                Math.abs(child.warpPoints.bottomLeft.x - child.x) > tolerance ||
                Math.abs(
                  child.warpPoints.bottomLeft.y - (child.y + child.height)
                ) > tolerance ||
                Math.abs(
                  child.warpPoints.bottomRight.x - (child.x + child.width)
                ) > tolerance ||
                Math.abs(
                  child.warpPoints.bottomRight.y - (child.y + child.height)
                ) > tolerance);
            if (false) {
              const wp = child.warpPoints;
              try {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                if (!tempCtx) throw new Error('Failed to create temp context');
                
                tempCanvas.width = child.width;
                tempCanvas.height = child.height;
                
                tempCtx.save();
                tempCtx.translate(child.width/2, child.height/2);
                if (child.rotation) tempCtx.rotate((child.rotation * Math.PI) / 180);
                if (child.scale && child.scale !== 1) tempCtx.scale(child.scale, child.scale);
                if (child.flip && child.flip !== 1) tempCtx.scale(-1, 1);
                tempCtx.drawImage(img, -child.width/2, -child.height/2, child.width, child.height);
                tempCtx.restore();
                
                const isAxisAligned = (
                  Math.abs(wp.topLeft.x - wp.bottomLeft.x) < 2 &&
                  Math.abs(wp.topRight.x - wp.bottomRight.x) < 2 &&
                  Math.abs(wp.topLeft.y - wp.topRight.y) < 2 &&
                  Math.abs(wp.bottomLeft.y - wp.bottomRight.y) < 2
                );
                
                if (isAxisAligned) {
                  ctx.save();
                  ctx.beginPath();
                  ctx.moveTo(wp.topLeft.x, wp.topLeft.y);
                  ctx.lineTo(wp.topRight.x, wp.topRight.y);
                  ctx.lineTo(wp.bottomRight.x, wp.bottomRight.y);
                  ctx.lineTo(wp.bottomLeft.x, wp.bottomLeft.y);
                  ctx.closePath();
                  ctx.clip();
                  
                  ctx.drawImage(
                    tempCanvas,
                    wp.topLeft.x,
                    wp.topLeft.y,
                    Math.abs(wp.topRight.x - wp.topLeft.x),
                    Math.abs(wp.bottomLeft.y - wp.topLeft.y)
                  );
                  ctx.restore();
                } else {
                  const drawTriangle = (srcTri: any, destTri: any) => {
                    const [sx1, sy1, sx2, sy2, sx3, sy3] = srcTri;
                    const [dx1, dy1, dx2, dy2, dx3, dy3] = destTri;
                    
                    const det = (sx2 - sx1) * (sy3 - sy1) - (sx3 - sx1) * (sy2 - sy1);
                    if (Math.abs(det) < 0.001) return;
                    
                    const a = ((dx2 - dx1) * (sy3 - sy1) - (dx3 - dx1) * (sy2 - sy1)) / det;
                    const b = ((sx2 - sx1) * (dx3 - dx1) - (sx3 - sx1) * (dx2 - dx1)) / det;
                    const c = ((sx2 - sx1) * (sy3 - sy1) - (sx3 - sx1) * (sy2 - sy1)) / det;
                    const d = ((dy2 - dy1) * (sy3 - sy1) - (dy3 - dy1) * (sy2 - sy1)) / det;
                    const e = dx1 - a * sx1 - b * sy1;
                    const f = dy1 - c * sx1 - d * sy1;
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(dx1, dy1);
                    ctx.lineTo(dx2, dy2);
                    ctx.lineTo(dx3, dy3);
                    ctx.closePath();
                    ctx.clip();
                    
                    ctx.transform(a, c, b, d, e, f);
                    ctx.drawImage(tempCanvas, 0, 0);
                    ctx.restore();
                  };
                  
                  drawTriangle(
                    [0, 0, child.width, 0, 0, child.height],
                    [wp.topLeft.x, wp.topLeft.y, wp.topRight.x, wp.topRight.y, wp.bottomLeft.x, wp.bottomLeft.y]
                  );
                  
                  drawTriangle(
                    [child.width, 0, child.width, child.height, 0, child.height],
                    [wp.topRight.x, wp.topRight.y, wp.bottomRight.x, wp.bottomRight.y, wp.bottomLeft.x, wp.bottomLeft.y]
                  );
                }
              } catch (error) {
                ctx.save();
                ctx.translate(child.x + child.width/2, child.y + child.height/2);
                if (child.rotation) ctx.rotate((child.rotation * Math.PI) / 180);
                if (child.scale && child.scale !== 1) ctx.scale(child.scale, child.scale);
                if (child.flip === -1) ctx.scale(-1, 1);
                ctx.drawImage(img, -child.width/2, -child.height/2, child.width, child.height);
                ctx.restore();
              }
            } else {
             
              ctx.save();
              ctx.translate(child.x + child.width/2, child.y + child.height/2);
              if (child.rotation) ctx.rotate((child.rotation * Math.PI) / 180);
              if (child.scale && child.scale !== 1) ctx.scale(child.scale, child.scale);
              if (child.flip === -1) ctx.scale(-1, 1);
              ctx.drawImage(img, -child.width/2, -child.height/2, child.width, child.height);
              ctx.restore();
            }
            if (child.isDragging || child.isSelected || child.isWarping) {
              const isWarping =
                child.isWarping || (mode === "warp" && child.isSelected);
              ctx.strokeStyle = child.isDragging
                ? "#00ff00"
                : isWarping
                ? "#ff00ff"
                : "#0088ff";
              ctx.lineWidth = 2;
              if (isWarping && child.warpPoints) {
                ctx.beginPath();
                ctx.moveTo(child.warpPoints.topLeft.x, child.warpPoints.topLeft.y);
                ctx.lineTo(child.warpPoints.topRight.x, child.warpPoints.topRight.y);
                ctx.lineTo(child.warpPoints.bottomRight.x, child.warpPoints.bottomRight.y);
                ctx.lineTo(child.warpPoints.bottomLeft.x, child.warpPoints.bottomLeft.y);
                ctx.closePath();
                ctx.stroke();
                const handleSize = 8;
                ctx.fillStyle = "#ff00ff";
                Object.values(child.warpPoints).forEach((point) => {
                  ctx.fillRect(
                    point.x - handleSize / 2,
                    point.y - handleSize / 2,
                    handleSize,
                    handleSize
                  );
                });
              } else {
                const visualScale = child.scale || 1;
                const visualWidth = child.width * visualScale;
                const visualHeight = child.height * visualScale;
                const visualX = child.x + child.width/2 - visualWidth/2;
                const visualY = child.y + child.height/2 - visualHeight/2;
                
                ctx.strokeRect(visualX, visualY, visualWidth, visualHeight);
                if (mode === "normal") {
                  const handleSize = 8;
                  ctx.fillStyle = "#0088ff";
                  ctx.fillRect(
                    visualX - handleSize / 2,
                    visualY - handleSize / 2,
                    handleSize,
                    handleSize
                  );
                  ctx.fillRect(
                    visualX + visualWidth - handleSize / 2,
                    visualY - handleSize / 2,
                    handleSize,
                    handleSize
                  );
                  ctx.fillRect(
                    visualX - handleSize / 2,
                    visualY + visualHeight - handleSize / 2,
                    handleSize,
                    handleSize
                  );
                  ctx.fillRect(
                    visualX + visualWidth - handleSize / 2,
                    visualY + visualHeight - handleSize / 2,
                    handleSize,
                    handleSize
                  );
                }
              }
            }
            resolve();
          };
          img.onerror = () => {
            ctx.fillStyle = "#ff4444";
            ctx.fillRect(child.x, child.y, child.width, child.height);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(child.x, child.y, child.width, child.height);
            ctx.fillStyle = "#ffffff";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
              "Failed",
              child.x + child.width / 2,
              child.y + child.height / 2
            );
            resolve();
          };
          img.src = imageUrl;
        });
      }
      if (onCanvasChange) {
        onCanvasChange(canvas);
      }
    }, [backgroundImage, children, onCanvasChange, mode]);

    useEffect(() => {
      redraw();
    }, [redraw]);

    const addChild = useCallback(
      (
        imageUrl: string,
        placementUri: string,
        transforms?: {
          x?: number;
          y?: number;
          scale?: number;
          rotation?: number;
          flip?: number;
        }
      ) => {
        const existingChild = children.find(
          (child) => child.uri === placementUri
        );

        if (existingChild) {
          setChildren((prev) =>
            prev.map((child) => ({
              ...child,
              isSelected: child.id === existingChild.id,
            }))
          );
          setSelectedChildId(existingChild.id);
          return;
        }
        const img = new Image();
        const processedImageUrl = getImageUrl(imageUrl);
        img.onload = () => {
          const maxSize = 120;
          const naturalWidth = img.naturalWidth;
          const naturalHeight = img.naturalHeight;
          let width, height;
          if (naturalWidth > naturalHeight) {
            width = Math.min(maxSize, naturalWidth);
            height = (naturalHeight / naturalWidth) * width;
          } else {
            height = Math.min(maxSize, naturalHeight);
            width = (naturalWidth / naturalHeight) * height;
          }
          const minSize = 40;
          if (width < minSize) {
            const scale = minSize / width;
            width *= scale;
            height *= scale;
          }
          if (height < minSize) {
            const scale = minSize / height;
            width *= scale;
            height *= scale;
          }

          const x = (canvasWidth / 2 - width / 2);
          const y = (canvasHeight / 2 - height / 2);
          
          const newChild: ChildElement = {
            id: `child-${Date.now()}`,
            uri: placementUri,
            x,
            y,
            width,
            height,
            imageUrl,
            scale: transforms?.scale,
            rotation: transforms?.rotation,
            flip: transforms?.flip,
          };
          
          if (transforms?.scale !== undefined || transforms?.rotation !== undefined || transforms?.flip !== undefined) {
            const transformedCorners = getTransformedCorners(newChild);
            newChild.warpPoints = {
              topLeft: transformedCorners[0],
              topRight: transformedCorners[1], 
              bottomLeft: transformedCorners[2],
              bottomRight: transformedCorners[3],
            };
          } else {
            newChild.warpPoints = {
              topLeft: { x, y },
              topRight: { x: x + width, y },
              bottomLeft: { x, y: y + height },
              bottomRight: { x: x + width, y: y + height },
            };
          }
          
          setChildren((prev) => {
            return [...prev, newChild];
          });
        };
        img.onerror = () => {
          const width = 100;
          const height = 100;
          const x = canvasWidth / 2 - width / 2;
          const y = canvasHeight / 2 - height / 2;
          const newChild: ChildElement = {
            id: `child-${Date.now()}`,
            uri: placementUri,
            x,
            y,
            width,
            height,
            imageUrl,
            scale: transforms?.scale,
            rotation: transforms?.rotation,
            flip: transforms?.flip,
          };
          
          if (transforms?.scale !== undefined || transforms?.rotation !== undefined || transforms?.flip !== undefined) {
            const transformedCorners = getTransformedCorners(newChild);
            newChild.warpPoints = {
              topLeft: transformedCorners[0],
              topRight: transformedCorners[1], 
              bottomLeft: transformedCorners[2],
              bottomRight: transformedCorners[3],
            };
          } else {
            newChild.warpPoints = {
              topLeft: { x, y },
              topRight: { x: x + width, y },
              bottomLeft: { x, y: y + height },
              bottomRight: { x: x + width, y: y + height },
            };
          }
          
          setChildren((prev) => [...prev, newChild]);
        };
        img.src = processedImageUrl;
      },
      [children]
    );
    const getMousePos = (e: MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const getResizeHandle = (
      mousePos: { x: number; y: number },
      child: ChildElement
    ): "nw" | "ne" | "sw" | "se" | null => {
      const handleSize = 8;
      const tolerance = handleSize / 2;
      const visualScale = child.scale || 1;
      const visualWidth = child.width * visualScale;
      const visualHeight = child.height * visualScale;
      const visualX = child.x + child.width/2 - visualWidth/2;
      const visualY = child.y + child.height/2 - visualHeight/2;
      
      const handles = [
        { type: "nw" as const, x: visualX, y: visualY },
        { type: "ne" as const, x: visualX + visualWidth, y: visualY },
        { type: "sw" as const, x: visualX, y: visualY + visualHeight },
        {
          type: "se" as const,
          x: visualX + visualWidth,
          y: visualY + visualHeight,
        },
      ];
      for (const handle of handles) {
        if (
          mousePos.x >= handle.x - tolerance &&
          mousePos.x <= handle.x + tolerance &&
          mousePos.y >= handle.y - tolerance &&
          mousePos.y <= handle.y + tolerance
        ) {
          return handle.type;
        }
      }
      return null;
    };
    const getTransformedCorners = (child: ChildElement) => {
      const centerX = child.x + child.width / 2;
      const centerY = child.y + child.height / 2;
      const scale = child.scale || 1;
      const rotation = (child.rotation || 0) * Math.PI / 180;
      const flipX = child.flip === -1 ? -1 : 1;
      
      const corners = [
        { x: -child.width / 2, y: -child.height / 2 }, // topLeft
        { x: child.width / 2, y: -child.height / 2 },  // topRight
        { x: -child.width / 2, y: child.height / 2 },  // bottomLeft
        { x: child.width / 2, y: child.height / 2 }    // bottomRight
      ];
      
      return corners.map(corner => {
        let x = corner.x * scale * flipX;
        let y = corner.y * scale;
        
        if (rotation !== 0) {
          const cos = Math.cos(rotation);
          const sin = Math.sin(rotation);
          const rotatedX = x * cos - y * sin;
          const rotatedY = x * sin + y * cos;
          x = rotatedX;
          y = rotatedY;
        }
        
        return {
          x: x + centerX,
          y: y + centerY
        };
      });
    };

    const getWarpPoint = (
      mousePos: { x: number; y: number },
      child: ChildElement
    ): "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null => {
      if (!child.warpPoints || mode !== "warp") {
        return null;
      }
      const handleSize = 8;
      const tolerance = handleSize / 2;
      
      const warpHandles = [
        { type: "topLeft" as const, pos: child.warpPoints.topLeft },
        { type: "topRight" as const, pos: child.warpPoints.topRight },
        { type: "bottomLeft" as const, pos: child.warpPoints.bottomLeft },
        { type: "bottomRight" as const, pos: child.warpPoints.bottomRight },
      ];
      
      for (const handle of warpHandles) {
        const distance = Math.sqrt(
          Math.pow(mousePos.x - handle.pos.x, 2) +
            Math.pow(mousePos.y - handle.pos.y, 2)
        );
        if (distance <= tolerance) {
          return handle.type;
        }
      }
      return null;
    };
    const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
      const mousePos = getMousePos(e);
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child.isSelected && mode === "warp") {
          const warpPoint = getWarpPoint(mousePos, child);
          if (warpPoint) {
            setChildren((prev) =>
              prev.map((c) => ({
                ...c,
                isWarping: c.id === child.id,
              }))
            );
            setDragState({
              isDragging: false,
              isResizing: false,
              isWarping: true,
              elementId: child.id,
              startX: mousePos.x,
              startY: mousePos.y,
              offsetX: 0,
              offsetY: 0,
              resizeHandle: null,
              warpPoint,
              initialWidth: child.width,
              initialHeight: child.height,
            });
            return;
          }
        }
        if (child.isSelected && mode === "normal") {
          const resizeHandle = getResizeHandle(mousePos, child);
          if (resizeHandle) {
            setChildren((prev) =>
              prev.map((c) => ({
                ...c,
                isResizing: c.id === child.id,
              }))
            );
            setDragState({
              isDragging: false,
              isResizing: true,
              isWarping: false,
              elementId: child.id,
              startX: mousePos.x,
              startY: mousePos.y,
              offsetX: 0,
              offsetY: 0,
              resizeHandle,
              warpPoint: null,
              initialWidth: child.width,
              initialHeight: child.height,
            });
            return;
          }
        }
        const visualScale = child.scale || 1;
        const visualWidth = child.width * visualScale;
        const visualHeight = child.height * visualScale;
        const visualX = child.x + child.width/2 - visualWidth/2;
        const visualY = child.y + child.height/2 - visualHeight/2;
        
        if (
          mousePos.x >= visualX &&
          mousePos.x <= visualX + visualWidth &&
          mousePos.y >= visualY &&
          mousePos.y <= visualY + visualHeight
        ) {
          setChildren((prev) =>
            prev.map((c) => ({
              ...c,
              isDragging: c.id === child.id,
              isSelected: c.id === child.id,
            }))
          );
          setSelectedChildId(child.id);
          setDragState({
            isDragging: true,
            isResizing: false,
            isWarping: false,
            elementId: child.id,
            startX: mousePos.x,
            startY: mousePos.y,
            offsetX: mousePos.x - child.x,
            offsetY: mousePos.y - child.y,
            resizeHandle: null,
            warpPoint: null,
            initialWidth: child.width,
            initialHeight: child.height,
          });
          return;
        }
      }
      setChildren((prev) => prev.map((c) => ({ ...c, isSelected: false })));
      setSelectedChildId(null);
    };
    const updateCursor = (e: MouseEvent<HTMLCanvasElement>) => {
      if (dragState.isDragging || dragState.isResizing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const mousePos = getMousePos(e);
      for (const child of children) {
        if (child.isSelected) {
          if (mode === "warp") {
            const warpPoint = getWarpPoint(mousePos, child);
            if (warpPoint) {
              canvas.style.cursor = "crosshair";
              return;
            }
          }
          if (mode === "normal") {
            const handle = getResizeHandle(mousePos, child);
            if (handle) {
              switch (handle) {
                case "nw":
                case "se":
                  canvas.style.cursor = "nw-resize";
                  return;
                case "ne":
                case "sw":
                  canvas.style.cursor = "ne-resize";
                  return;
              }
            }
          }
          if (
            mousePos.x >= child.x &&
            mousePos.x <= child.x + child.width &&
            mousePos.y >= child.y &&
            mousePos.y <= child.y + child.height
          ) {
            canvas.style.cursor = "move";
            return;
          }
        }
      }
      canvas.style.cursor = "default";
    };
    const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
      updateCursor(e);
      if (
        (!dragState.isDragging &&
          !dragState.isResizing &&
          !dragState.isWarping) ||
        !dragState.elementId
      )
        return;
      const mousePos = getMousePos(e);
      if (dragState.isDragging) {
        setChildren((prev) =>
          prev.map((child) => {
            if (child.id === dragState.elementId) {
              const newX = Math.max(
                0,
                Math.min(
                  canvasWidth - child.width,
                  mousePos.x - dragState.offsetX
                )
              );
              const newY = Math.max(
                0,
                Math.min(
                  canvasHeight - child.height,
                  mousePos.y - dragState.offsetY
                )
              );
              const deltaX = newX - child.x;
              const deltaY = newY - child.y;
              const updatedWarpPoints = child.warpPoints
                ? {
                    topLeft: {
                      x: child.warpPoints.topLeft.x + deltaX,
                      y: child.warpPoints.topLeft.y + deltaY,
                    },
                    topRight: {
                      x: child.warpPoints.topRight.x + deltaX,
                      y: child.warpPoints.topRight.y + deltaY,
                    },
                    bottomLeft: {
                      x: child.warpPoints.bottomLeft.x + deltaX,
                      y: child.warpPoints.bottomLeft.y + deltaY,
                    },
                    bottomRight: {
                      x: child.warpPoints.bottomRight.x + deltaX,
                      y: child.warpPoints.bottomRight.y + deltaY,
                    },
                  }
                : undefined;
              return {
                ...child,
                x: newX,
                y: newY,
                warpPoints: updatedWarpPoints,
              };
            }
            return child;
          })
        );
      } else if (dragState.isWarping && dragState.warpPoint) {
        setChildren((prev) =>
          prev.map((child) => {
            if (child.id === dragState.elementId && child.warpPoints) {
              const updatedWarpPoints = {
                ...child.warpPoints,
                [dragState.warpPoint!]: {
                  x: Math.max(0, Math.min(canvasWidth, mousePos.x)),
                  y: Math.max(0, Math.min(canvasHeight, mousePos.y)),
                },
              };
              return {
                ...child,
                warpPoints: updatedWarpPoints,
              };
            }
            return child;
          })
        );
      } else if (dragState.isResizing && dragState.resizeHandle) {
        const deltaX = mousePos.x - dragState.startX;
        const deltaY = mousePos.y - dragState.startY;
        setChildren((prev) =>
          prev.map((child) => {
            if (child.id === dragState.elementId) {
              let newX = child.x;
              let newY = child.y;
              let newWidth = child.width;
              let newHeight = child.height;
              const minSize = 20;
              
              switch (dragState.resizeHandle) {
                case "nw":
                  newWidth = Math.max(minSize, dragState.initialWidth - deltaX);
                  newHeight = Math.max(
                    minSize,
                    dragState.initialHeight - deltaY
                  );
                  if (e.shiftKey) {
                    const avgScale = ((newWidth / dragState.initialWidth) + (newHeight / dragState.initialHeight)) / 2;
                    newWidth = dragState.initialWidth * avgScale;
                    newHeight = dragState.initialHeight * avgScale;
                  }
                  newX = child.x + (child.width - newWidth);
                  newY = child.y + (child.height - newHeight);
                  break;
                case "ne":
                  newWidth = Math.max(minSize, dragState.initialWidth + deltaX);
                  newHeight = Math.max(
                    minSize,
                    dragState.initialHeight - deltaY
                  );
                  if (e.shiftKey) {
                    const avgScale = ((newWidth / dragState.initialWidth) + (newHeight / dragState.initialHeight)) / 2;
                    newWidth = dragState.initialWidth * avgScale;
                    newHeight = dragState.initialHeight * avgScale;
                  }
                  newY = child.y + (child.height - newHeight);
                  break;
                case "sw":
                  newWidth = Math.max(minSize, dragState.initialWidth - deltaX);
                  newHeight = Math.max(
                    minSize,
                    dragState.initialHeight + deltaY
                  );
                  if (e.shiftKey) {
                    const avgScale = ((newWidth / dragState.initialWidth) + (newHeight / dragState.initialHeight)) / 2;
                    newWidth = dragState.initialWidth * avgScale;
                    newHeight = dragState.initialHeight * avgScale;
                  }
                  newX = child.x + (child.width - newWidth);
                  break;
                case "se":
                  newWidth = Math.max(minSize, dragState.initialWidth + deltaX);
                  newHeight = Math.max(
                    minSize,
                    dragState.initialHeight + deltaY
                  );
                  if (e.shiftKey) {
                    const avgScale = ((newWidth / dragState.initialWidth) + (newHeight / dragState.initialHeight)) / 2;
                    newWidth = dragState.initialWidth * avgScale;
                    newHeight = dragState.initialHeight * avgScale;
                  }
                  break;
              }
              newX = Math.max(0, Math.min(canvasWidth - newWidth, newX));
              newY = Math.max(0, Math.min(canvasHeight - newHeight, newY));
              newWidth = Math.min(newWidth, canvasWidth - newX);
              newHeight = Math.min(newHeight, canvasHeight - newY);
              
              const updatedChild = {
                ...child,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
              };
              
              const transformedCorners = getTransformedCorners(updatedChild);
              const updatedWarpPoints = {
                topLeft: transformedCorners[0],
                topRight: transformedCorners[1],
                bottomLeft: transformedCorners[2],
                bottomRight: transformedCorners[3],
              };
              
              return {
                ...updatedChild,
                warpPoints: updatedWarpPoints,
              };
            }
            return child;
          })
        );
      }
    };
    const handleMouseUp = () => {
      setChildren((prev) =>
        prev.map((c) => ({
          ...c,
          isDragging: false,
          isResizing: false,
          isWarping: false,
        }))
      );
      setDragState({
        isDragging: false,
        isResizing: false,
        isWarping: false,
        elementId: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        resizeHandle: null,
        warpPoint: null,
        initialWidth: 0,
        initialHeight: 0,
      });
    };
    const deleteSelected = () => {
      if (selectedChildId) {
        deleteChild(selectedChildId);
      }
    };
    const deleteChild = (childId: string) => {
      setChildren((prev) => prev.filter((c) => c.id !== childId));
      if (selectedChildId === childId) {
        setSelectedChildId(null);
      }
    };
    const clearAll = () => {
      setChildren([]);
      setSelectedChildId(null);
    };
    const captureCanvas = useCallback(async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return null;
      }
      try {
        await redraw();
        await new Promise((resolve) => setTimeout(resolve, 200));
        const dataURL = canvas.toDataURL("image/png");
        return dataURL;
      } catch (error) {
        return null;
      }
    }, [children.length, backgroundImage, redraw]);
    useImperativeHandle(
      ref,
      () => ({
        addChild,
        clearAll,
        captureCanvas,
      }),
      [addChild, captureCanvas]
    );
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setMode("normal")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                mode === "normal"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-600 text-gray-300 hover:bg-gray-500"
              }`}
            >
              Normal Mode
            </button>
            <button
              onClick={() => setMode("warp")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                mode === "warp"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-600 text-gray-300 hover:bg-gray-500"
              }`}
            >
              Warp Mode
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="border border-gray-600 rounded-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
        {selectedChildId !== null && (
          <div className="flex items-center">
            <button
              onClick={deleteSelected}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }
);
CompositeCanvas.displayName = "CompositeCanvas";
export default CompositeCanvas;
