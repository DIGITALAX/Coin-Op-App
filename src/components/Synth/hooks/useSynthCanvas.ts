import { useRef, useEffect, useState, MouseEvent, useCallback } from "react";
import { isPointInPattern } from "../utils/isPointInPattern";
import addRashToCanvas from "../utils/addRashToCanvas";
import drawPatternElement from "../utils/drawPatternElement";
import drawElement from "../utils/drawElement";
import {
  CanvasHistory,
  ElementInterface,
  SvgPatternType,
  UseSynthCanvasProps,
} from "../types/synth.types";
import wheelLogic from "../utils/wheelLogic";
import { useApp } from "../../../context/AppContext";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useFileStorage } from "../../Activity/hooks/useFileStorage";
import { useDesignContext } from "../../../context/DesignContext";
import { getCurrentTemplate } from "../utils/templateHelpers";

export const useSynthCanvas = (props?: UseSynthCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedLayer, selectedTemplate, selectedPatternChild, isBackSide } =
    useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { getItem, setItem } = useDesignStorage();
  const { saveBinaryFile, removeBinaryFile } = useFileStorage();
  const { currentDesign, refreshDesigns } = useDesignContext();
  const [patternElement, setPatternElement] = useState<SvgPatternType | null>(
    null
  );
  const [elements, setElements] = useState<ElementInterface[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [tool, setTool] = useState<"pencil" | "erase" | "select">("pencil");
  const [brushWidth, setBrushWidth] = useState<number>(10);
  const [hex, setHex] = useState<string>("#F5A623");
  const [selectedElement, setSelectedElement] =
    useState<ElementInterface | null>(null);
  const [selectedImageElement, setSelectedImageElement] =
    useState<ElementInterface | null>(null);
  const [draggedImage, setDraggedImage] = useState<{
    element: ElementInterface;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<"tl" | "tr" | "bl" | "br" | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [rotationStartAngle, setRotationStartAngle] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{
    xInitial: number;
    yInitial: number;
    xOffset: number;
    yOffset: number;
  }>({
    xInitial: 0,
    yInitial: 0,
    xOffset: 0,
    yOffset: 0,
  });
  const [canvasHistory, setCanvasHistory] = useState<CanvasHistory[]>([]);
  const [undoHistory, setUndoHistory] = useState<ElementInterface[][]>([]);
  const [redoHistory, setRedoHistory] = useState<ElementInterface[][]>([]);
  useEffect(() => {
    const loadCanvasHistory = async () => {
      if (!currentDesign?.id) return;
      try {
        const history = (await getItem("canvasHistory")) || [];
        if (Array.isArray(history)) {
          setCanvasHistory(history);
        } else {
          setCanvasHistory([]);
        }
      } catch (error) {
        setCanvasHistory([]);
      }
    };
    loadCanvasHistory();
  }, [getItem, currentDesign?.id]);
  useEffect(() => {
    if (selectedPatternChild && canvasRef.current) {
      loadPatternFromURI(selectedPatternChild.child.metadata.image);
      recenterCanvas();
    }
  }, [selectedPatternChild]);
  const loadPatternFromURI = async (uri: string) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      const canvasMultiplier = 3;
      const canvasWidth = containerRect.width * canvasMultiplier;
      const canvasHeight = containerRect.height * canvasMultiplier;
      canvas.width = canvasWidth * devicePixelRatio;
      canvas.height = canvasHeight * devicePixelRatio;
      canvas.style.width = canvasWidth + "px";
      canvas.style.height = canvasHeight + "px";
      canvas.style.position = "absolute";
      canvas.style.left = `${-containerRect.width}px`;
      canvas.style.top = `${-containerRect.height}px`;
      canvas.style.transform = "translate(0px, 0px) scale(1)";
      canvas.style.transformOrigin = "center";
      const pattern = await addRashToCanvas(uri, canvas);
      setPatternElement(pattern);
      setElements([]);
      setPan({
        xInitial: 0,
        yInitial: 0,
        xOffset: 0,
        yOffset: 0,
      });
      setZoom(1.0);
      setSelectedImageElement(null);
    } catch (error) {}
  };
  const getMousePos = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    return {
      x: canvasX,
      y: canvasY,
    };
  };
  const createElement = (
    clientX: number,
    clientY: number
  ): ElementInterface => {
    const pos = getMousePos({ clientX, clientY } as any);
    const pointWithPressure = {
      x: pos.x,
      y: pos.y,
      pressure: 0.5,
    };
    return {
      id: elements.length,
      type: tool,
      points: [pointWithPressure],
      fill: tool !== "erase" ? hex : "#000000",
      strokeWidth: brushWidth,
    };
  };
  const updateElement = (
    _element: ElementInterface,
    clientX: number,
    clientY: number
  ) => {
    const pos = getMousePos({ clientX, clientY } as any);
    const pointWithPressure = {
      x: pos.x,
      y: pos.y,
      pressure: 0.5,
    };
    setElements((prev) => {
      const newElements = [...prev];
      const currentElement = newElements[newElements.length - 1];
      newElements[newElements.length - 1] = {
        ...currentElement,
        points: [...(currentElement.points || []), pointWithPressure],
      };
      return newElements;
    });
  };
  const isPointInImage = (
    x: number,
    y: number,
    imageElement: ElementInterface
  ): boolean => {
    if (
      !imageElement.x1 ||
      !imageElement.y1 ||
      !imageElement.width ||
      !imageElement.height
    ) {
      return false;
    }
    return (
      x >= imageElement.x1 &&
      x <= imageElement.x1 + imageElement.width &&
      y >= imageElement.y1 &&
      y <= imageElement.y1 + imageElement.height
    );
  };

  const isPointInHandle = (
    x: number,
    y: number,
    handleX: number,
    handleY: number,
    size: number = 8
  ): boolean => {
    return (
      x >= handleX - size / 2 &&
      x <= handleX + size / 2 &&
      y >= handleY - size / 2 &&
      y <= handleY + size / 2
    );
  };

  const isPointInRotateHandle = (
    x: number,
    y: number,
    img: ElementInterface
  ): boolean => {
    if (!img.x1 || !img.y1 || !img.width) return false;
    const rotateHandleY = img.y1 - 20;
    const rotateHandleX = img.x1 + img.width / 2;
    const distance = Math.sqrt(
      Math.pow(x - rotateHandleX, 2) + Math.pow(y - rotateHandleY, 2)
    );
    return distance <= 6;
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!patternElement) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const canvasPos = getMousePos(e);
    const patternX = canvasPos.x / devicePixelRatio;
    const patternY = canvasPos.y / devicePixelRatio;

    if (tool === "select" && selectedImageElement) {
      const img = selectedImageElement;
      if (img.x1 !== undefined && img.y1 !== undefined && img.width && img.height) {
        if (isPointInRotateHandle(canvasPos.x, canvasPos.y, img)) {
          setIsRotating(true);
          const centerX = img.x1 + img.width / 2;
          const centerY = img.y1 + img.height / 2;
          const angle = Math.atan2(canvasPos.y - centerY, canvasPos.x - centerX);
          setRotationStartAngle(angle - ((img.rotation || 0) * Math.PI) / 180);
          return;
        }

        if (isPointInHandle(canvasPos.x, canvasPos.y, img.x1, img.y1)) {
          setResizeHandle("tl");
          return;
        }
        if (isPointInHandle(canvasPos.x, canvasPos.y, img.x1 + img.width, img.y1)) {
          setResizeHandle("tr");
          return;
        }
        if (isPointInHandle(canvasPos.x, canvasPos.y, img.x1, img.y1 + img.height)) {
          setResizeHandle("bl");
          return;
        }
        if (isPointInHandle(canvasPos.x, canvasPos.y, img.x1 + img.width, img.y1 + img.height)) {
          setResizeHandle("br");
          return;
        }
      }
    }

    if (tool === "select") {
      const imageElements = elements.filter((el) => el.type === "image");
      for (let i = imageElements.length - 1; i >= 0; i--) {
        if (isPointInImage(canvasPos.x, canvasPos.y, imageElements[i])) {
          setSelectedImageElement(imageElements[i]);
          setDraggedImage({
            element: imageElements[i],
            startX: canvasPos.x,
            startY: canvasPos.y,
            offsetX: canvasPos.x - (imageElements[i].x1 || 0),
            offsetY: canvasPos.y - (imageElements[i].y1 || 0),
          });
          return;
        }
      }
      setSelectedImageElement(null);
      return;
    }

    setSelectedImageElement(null);
    const isInPattern = isPointInPattern(
      patternX,
      patternY,
      patternElement,
      ctx,
      patternElement.type === "circle"
    );
    if (!isInPattern) {
      return;
    }

    if (tool === "pencil" || tool === "erase") {
      saveToUndoHistory();
      const newElement = createElement(e.clientX, e.clientY);
      setSelectedElement(newElement);
      setElements((prev) => [...prev, newElement]);
      setIsDrawing(true);
    }
  };
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getMousePos(e);

    if (isRotating && selectedImageElement) {
      const img = selectedImageElement;
      if (img.x1 !== undefined && img.y1 !== undefined && img.width && img.height) {
        const centerX = img.x1 + img.width / 2;
        const centerY = img.y1 + img.height / 2;
        const angle = Math.atan2(canvasPos.y - centerY, canvasPos.x - centerX);
        const newRotation = ((angle - rotationStartAngle) * 180) / Math.PI;

        setElements((prev) =>
          prev.map((el) =>
            el.id === img.id
              ? { ...el, rotation: newRotation }
              : el
          )
        );
        setSelectedImageElement((prev) =>
          prev ? { ...prev, rotation: newRotation } : null
        );
      }
      return;
    }

    if (resizeHandle && selectedImageElement) {
      const img = selectedImageElement;
      if (img.x1 !== undefined && img.y1 !== undefined && img.width && img.height) {
        let newX = img.x1;
        let newY = img.y1;
        let newWidth = img.width;
        let newHeight = img.height;

        if (resizeHandle === "tl") {
          newWidth = img.width + (img.x1 - canvasPos.x);
          newHeight = img.height + (img.y1 - canvasPos.y);
          newX = canvasPos.x;
          newY = canvasPos.y;
        } else if (resizeHandle === "tr") {
          newWidth = canvasPos.x - img.x1;
          newHeight = img.height + (img.y1 - canvasPos.y);
          newY = canvasPos.y;
        } else if (resizeHandle === "bl") {
          newWidth = img.width + (img.x1 - canvasPos.x);
          newHeight = canvasPos.y - img.y1;
          newX = canvasPos.x;
        } else if (resizeHandle === "br") {
          newWidth = canvasPos.x - img.x1;
          newHeight = canvasPos.y - img.y1;
        }

        newWidth = Math.max(20, newWidth);
        newHeight = Math.max(20, newHeight);

        setElements((prev) =>
          prev.map((el) =>
            el.id === img.id
              ? { ...el, x1: newX, y1: newY, width: newWidth, height: newHeight }
              : el
          )
        );
        setSelectedImageElement((prev) =>
          prev ? { ...prev, x1: newX, y1: newY, width: newWidth, height: newHeight } : null
        );
      }
      return;
    }

    if (draggedImage && tool === "select") {
      const newX = canvasPos.x - draggedImage.offsetX;
      const newY = canvasPos.y - draggedImage.offsetY;

      setElements((prev) =>
        prev.map((el) =>
          el.id === draggedImage.element.id
            ? { ...el, x1: newX, y1: newY }
            : el
        )
      );

      setSelectedImageElement((prev) =>
        prev ? { ...prev, x1: newX, y1: newY } : null
      );
      return;
    }

    if (!isDrawing || !patternElement || !selectedElement) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const patternX = canvasPos.x / devicePixelRatio;
    const patternY = canvasPos.y / devicePixelRatio;
    if (
      !isPointInPattern(
        patternX,
        patternY,
        patternElement,
        ctx,
        patternElement.type === "circle"
      )
    ) {
      return;
    }
    updateElement(selectedElement, e.clientX, e.clientY);
  };
  const handleMouseUp = () => {
    if (draggedImage) {
      saveToUndoHistory();
      setDraggedImage(null);
    }
    if (resizeHandle) {
      saveToUndoHistory();
      setResizeHandle(null);
    }
    if (isRotating) {
      saveToUndoHistory();
      setIsRotating(false);
    }
    setIsDrawing(false);
    setSelectedElement(null);
  };
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !patternElement) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "high";
    (ctx as CanvasRenderingContext2D).globalCompositeOperation = "source-over";
    drawPatternElement(patternElement, ctx);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.imageSmoothingQuality = "high";

      const imageElements = elements.filter(el => el.type === "image");
      const drawingElements = elements.filter(el => el.type !== "image");

      imageElements.forEach((element) => {
        drawElement(element, tempCtx);
      });

      drawingElements.forEach((element) => {
        drawElement(element, tempCtx);
      });

      ctx.drawImage(tempCanvas, 0, 0);
    }
    ctx.restore();

    if (selectedImageElement && tool === "select") {
      const img = selectedImageElement;
      if (img.x1 !== undefined && img.y1 !== undefined && img.width && img.height) {
        ctx.save();
        ctx.strokeStyle = "#0088ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(img.x1, img.y1, img.width, img.height);

        const handleSize = 8;
        ctx.fillStyle = "#0088ff";

        ctx.fillRect(img.x1 - handleSize / 2, img.y1 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(img.x1 + img.width - handleSize / 2, img.y1 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(img.x1 - handleSize / 2, img.y1 + img.height - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(img.x1 + img.width - handleSize / 2, img.y1 + img.height - handleSize / 2, handleSize, handleSize);

        const rotateHandleY = img.y1 - 20;
        ctx.beginPath();
        ctx.moveTo(img.x1 + img.width / 2, img.y1);
        ctx.lineTo(img.x1 + img.width / 2, rotateHandleY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(img.x1 + img.width / 2, rotateHandleY, 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
      }
    }

    canvas.style.transform = `translate(${pan.xOffset}px, ${pan.yOffset}px) scale(${zoom})`;
    canvas.style.transformOrigin = "center";
  }, [patternElement, elements, zoom, pan, selectedImageElement, tool]);
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const handleNativeWheel = (e: Event) => {
      const wheelEvent = e as globalThis.WheelEvent;
      wheelEvent.preventDefault();
      wheelEvent.stopPropagation();
      wheelLogic(wheelEvent as any, zoom, setZoom, canvas, pan, setPan, 5);
    };
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    canvas.addEventListener("touchmove", preventZoom, { passive: false });
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleNativeWheel);
      }
      if (canvas) {
        canvas.removeEventListener("touchmove", preventZoom);
      }
    };
  }, [zoom, pan]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undoHistory, redoHistory]);
  const clearCanvas = () => {
    saveToUndoHistory();
    setElements([]);
  };
  const recenterCanvas = () => {
    setZoom(1.0);
    setPan({
      xInitial: 0,
      yInitial: 0,
      xOffset: 0,
      yOffset: 0,
    });
  };

  const saveCanvasToHistory = async () => {
    if (
      !selectedPatternChild ||
      !currentTemplate?.templateId ||
      !selectedTemplate?.name ||
      elements.length === 0
    )
      return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!patternElement) return;


    setSelectedImageElement(null);
    await new Promise((resolve) => setTimeout(resolve, 150));

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let minX = canvas.width,
      maxX = 0;
    let minY = canvas.height,
      maxY = 0;
    let hasContent = false;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 0) {
          hasContent = true;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (!hasContent) return;
    const boundsWidth = maxX - minX + 1;
    const boundsHeight = maxY - minY + 1;
    const cropCanvas = document.createElement("canvas");
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return;
    cropCanvas.width = boundsWidth;
    cropCanvas.height = boundsHeight;
    cropCtx.drawImage(
      canvas,
      minX,
      minY,
      boundsWidth,
      boundsHeight,
      0,
      0,
      boundsWidth,
      boundsHeight
    );
    tempCanvas.width = boundsWidth;
    tempCanvas.height = boundsHeight;
    tempCtx.drawImage(
      cropCanvas,
      0,
      0,
      boundsWidth,
      boundsHeight,
      0,
      0,
      boundsWidth,
      boundsHeight
    );
    const blob = await new Promise<Blob>((resolve) => {
      tempCanvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });

    const timestamp = Date.now();
    const fileName = `canvas_${selectedPatternChild.uri?.replace(/[^a-zA-Z0-9]/g, '_')}_${currentTemplate?.templateId}_${timestamp}.png`;

    if (!currentDesign) return;

    const thumbnailPath = await saveBinaryFile(
      fileName,
      blob,
      currentDesign.id,
      currentDesign.name
    );

    const serializableElements = elements.map((element) => {
      if (element.type === "image" && element.image) {
        const serialized = {
          ...element,
          image: undefined,
          imageSrc: element.image.src,
          imageWidth: element.image.naturalWidth,
          imageHeight: element.image.naturalHeight,
        };
        return serialized;
      }
      return element;
    });
    const actualCanvas = document.getElementById("synth-canvas-id") as HTMLCanvasElement;

    const historyItem: CanvasHistory = {
      id: Date.now().toString(),
      childUri: selectedPatternChild.uri,
      child: selectedPatternChild,
      layerTemplateId: currentTemplate?.templateId,
      templateName: selectedTemplate.name,
      elements: serializableElements,
      thumbnailPath,
      timestamp: Date.now(),
      originalCanvasWidth: actualCanvas?.width,
      originalCanvasHeight: actualCanvas?.height,
      canvasDevicePixelRatio: devicePixelRatio,
    };
    try {
      const currentHistory = (await getItem("canvasHistory")) || [];
      if (!Array.isArray(currentHistory)) {
        await setItem("canvasHistory", []);
        return;
      }
      const oldItem = currentHistory.find(
        (item: CanvasHistory) =>
          item.childUri === selectedPatternChild.uri &&
          item.layerTemplateId === currentTemplate?.templateId &&
          item.templateName === selectedTemplate.name
      );
      
      if (oldItem?.thumbnailPath) {
        try {
          await removeBinaryFile(oldItem.thumbnailPath);
        } catch (error) {
        }
      }
      
      const filteredHistory = currentHistory.filter(
        (item: CanvasHistory) =>
          !(
            item.childUri === selectedPatternChild.uri &&
            item.layerTemplateId === currentTemplate?.templateId &&
            item.templateName === selectedTemplate.name
          )
      );
      const newHistory = [historyItem, ...filteredHistory].slice(0, 10);
      setCanvasHistory(newHistory);
      await setItem("canvasHistory", newHistory);
      if (currentDesign) {
        await refreshDesigns();
      }
      if (props?.onCanvasSave && currentTemplate) {
        const childIndex = currentTemplate?.childReferences.findIndex(
          (child) => child.uri === selectedPatternChild.uri
        );
        if (childIndex >= 0) {
          props.onCanvasSave(childIndex, thumbnailPath);
        }
      }
    } catch (error) {}
  };
  const loadFromHistory = (historyItem: CanvasHistory) => {
    const reconstructedElements: ElementInterface[] = [];
    let imagesToLoad = 0;
    let imagesLoaded = 0;
    const checkAllImagesLoaded = () => {
      if (imagesLoaded === imagesToLoad) {
        setTimeout(() => {
          setElements(reconstructedElements);
        }, 50);
      }
    };
    historyItem.elements.forEach((element: any, index: number) => {
      if (element.type === "image" && element.imageSrc && !element.image) {
        imagesToLoad++;
        const img = new Image();
        img.onload = () => {
          imagesLoaded++;
          checkAllImagesLoaded();
        };
        img.onerror = () => {
          imagesLoaded++;
          checkAllImagesLoaded();
        };
        img.src = element.imageSrc;
        reconstructedElements[index] = {
          ...element,
          image: img,
          imageSrc: undefined,
          imageWidth: undefined,
          imageHeight: undefined,
        };
      } else {
        reconstructedElements[index] = element;
      }
    });
    if (imagesToLoad === 0) {
      setTimeout(() => {
        setElements(reconstructedElements);
      }, 100);
    }
    return {
      layerTemplateId: historyItem.layerTemplateId,
      templateName: historyItem.templateName,
      childUri: historyItem.childUri,
    };
  };
  const loadImageToCanvas = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = canvasRef.current;
          const container = containerRef.current;
          if (canvas && container) {
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
              x1: centerX,
              y1: centerY,
              width: finalWidth,
              height: finalHeight,
              rotation: 0,
              image: img,
            };
            saveToUndoHistory();
            setElements((prev) => [...prev, imageElement]);
            setSelectedImageElement(null);
          }
        } catch (error) {}
      };
      img.onerror = () => {};
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.onerror = () => {};
    reader.readAsDataURL(file);
  };
  const deleteImage = () => {
    if (!selectedImageElement || !selectedImageElement.id) return;
    saveToUndoHistory();
    setElements((prev) =>
      prev.filter((el) => el.id !== selectedImageElement.id)
    );
    setSelectedImageElement(null);
  };
  const saveToUndoHistory = () => {
    setUndoHistory((prev) => {
      const newHistory = [...prev, [...elements]];
      return newHistory.length > 50 ? newHistory.slice(-50) : newHistory;
    });
    setRedoHistory([]);
  };
  const undo = () => {
    if (undoHistory.length === 0) return;
    const previousState = undoHistory[undoHistory.length - 1];
    const currentState = [...elements];
    setRedoHistory((prev) => {
      const newHistory = [...prev, currentState];
      return newHistory.length > 50 ? newHistory.slice(-50) : newHistory;
    });
    setUndoHistory((prev) => prev.slice(0, -1));
    setElements(previousState);
    setSelectedImageElement(null);
  };
  const redo = () => {
    if (redoHistory.length === 0) return;
    const nextState = redoHistory[redoHistory.length - 1];
    const currentState = [...elements];
    setUndoHistory((prev) => {
      const newHistory = [...prev, currentState];
      return newHistory.length > 50 ? newHistory.slice(-50) : newHistory;
    });
    setRedoHistory((prev) => prev.slice(0, -1));
    setElements(nextState);
    setSelectedImageElement(null);
  };
  return {
    canvasRef,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    tool,
    setTool,
    brushWidth,
    setBrushWidth,
    hex,
    setHex,
    clearCanvas,
    recenterCanvas,
    saveCanvasToHistory,
    loadFromHistory,
    canvasHistory,
    setElements,
    selectedImageElement,
    zoom,
    pan,
    loadImageToCanvas,
    deleteImage,
    undo,
    redo,
    undoHistory,
    redoHistory,
  };
};
