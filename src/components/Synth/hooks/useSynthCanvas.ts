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
  const [tool, setTool] = useState<"pencil" | "erase">("pencil");
  const [brushWidth, setBrushWidth] = useState<number>(10);
  const [hex, setHex] = useState<string>("#F5A623");
  const [selectedElement, setSelectedElement] =
    useState<ElementInterface | null>(null);
  const [selectedImageElement, setSelectedImageElement] =
    useState<ElementInterface | null>(null);
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
  const adjustImageWidth = (delta: number) => {
    if (!selectedImageElement || !selectedImageElement.id) return;
    try {
      saveToUndoHistory();
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedImageElement.id
            ? { ...el, width: Math.max(20, (el.width || 0) + delta) }
            : el
        )
      );
      setSelectedImageElement((prev) =>
        prev
          ? { ...prev, width: Math.max(20, (prev.width || 0) + delta) }
          : null
      );
    } catch (error) {}
  };
  const adjustImageHeight = (delta: number) => {
    if (!selectedImageElement || !selectedImageElement.id) return;
    try {
      saveToUndoHistory();
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedImageElement.id
            ? { ...el, height: Math.max(20, (el.height || 0) + delta) }
            : el
        )
      );
      setSelectedImageElement((prev) =>
        prev
          ? { ...prev, height: Math.max(20, (prev.height || 0) + delta) }
          : null
      );
    } catch (error) {}
  };
  const rotateImage = (degrees: number) => {
    if (!selectedImageElement || !selectedImageElement.id) return;
    try {
      saveToUndoHistory();
      const newRotation =
        ((selectedImageElement.rotation || 0) + degrees) % 360;
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedImageElement.id
            ? { ...el, rotation: newRotation }
            : el
        )
      );
      setSelectedImageElement((prev) =>
        prev ? { ...prev, rotation: newRotation } : null
      );
    } catch (error) {}
  };
  const moveImage = (deltaX: number, deltaY: number) => {
    if (!selectedImageElement || !selectedImageElement.id) return;
    try {
      saveToUndoHistory();
      const newX = (selectedImageElement.x1 || 0) + deltaX * devicePixelRatio;
      const newY = (selectedImageElement.y1 || 0) + deltaY * devicePixelRatio;
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedImageElement.id ? { ...el, x1: newX, y1: newY } : el
        )
      );
      setSelectedImageElement((prev) =>
        prev ? { ...prev, x1: newX, y1: newY } : null
      );
    } catch (error) {}
  };
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!patternElement) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const canvasPos = getMousePos(e);
    const patternX = canvasPos.x / devicePixelRatio;
    const patternY = canvasPos.y / devicePixelRatio;
    const imageElements = elements.filter((el) => el.type === "image");
    for (let i = imageElements.length - 1; i >= 0; i--) {
      if (isPointInImage(canvasPos.x, canvasPos.y, imageElements[i])) {
        setSelectedImageElement(imageElements[i]);
        return;
      }
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
    saveToUndoHistory();
    const newElement = createElement(e.clientX, e.clientY);
    setSelectedElement(newElement);
    setElements((prev) => [...prev, newElement]);
    setIsDrawing(true);
  };
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !patternElement || !selectedElement) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const canvasPos = getMousePos(e);
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
      elements.forEach((element) => {
        drawElement(element, tempCtx);
      });
      ctx.drawImage(tempCanvas, 0, 0);
    }
    ctx.restore();
    canvas.style.transform = `translate(${pan.xOffset}px, ${pan.yOffset}px) scale(${zoom})`;
    canvas.style.transformOrigin = "center";
  }, [patternElement, elements, zoom, pan, selectedImageElement]);
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
        return {
          ...element,
          image: undefined,
          imageSrc: element.image.src,
          imageWidth: element.image.naturalWidth,
          imageHeight: element.image.naturalHeight,
        };
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
        }
      };
      img.src = event.target?.result as string;
    };
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
    adjustImageWidth,
    adjustImageHeight,
    rotateImage,
    moveImage,
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
