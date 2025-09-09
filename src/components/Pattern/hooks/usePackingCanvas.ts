import { useState, useRef, useEffect, useCallback } from "react";
import { usePatternNesting } from "./usePatternNesting";
import { useLiveSparrowVisualization } from "./useLiveSparrowVisualization";
import { useFileStorage } from "../../Activity/hooks/useFileStorage";
import { useDesignContext } from "../../../context/DesignContext";
import {
  CanvasPanel,
  NestingSettings,
  DEFAULT_NESTING_SETTINGS,
  PatternPiece,
  PATTERN_COLORS,
} from "../types/pattern.types";

export const usePackingCanvas = (selectedPieces: PatternPiece[]) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [panels, setPanels] = useState<CanvasPanel[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const baseCanvasWidth = 800;
  const baseCanvasHeight = 600;

  const [nestingSettings, setNestingSettings] = useState<NestingSettings>(
    DEFAULT_NESTING_SETTINGS
  );
  const canvasWidth = baseCanvasWidth;
  const [canvasHeight, setCanvasHeight] = useState(baseCanvasHeight);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualPieces, setManualPieces] = useState<CanvasPanel[]>([]);
  const [autoBasePieces, setAutoBasePieces] = useState<CanvasPanel[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState(0);
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);
  const [lastSvgFromNesting, setLastSvgFromNesting] = useState<string | null>(
    null
  );
  const [savedSvgContent, setSavedSvgContent] = useState<string | null>(null);

  const {
    nestPatterns,
    isNesting,
    isSparrowRunning,
    error,
    cancelNesting,
    handleSparrowComplete,
  } = usePatternNesting();
  const { liveSvgContent: liveSvgFromSparrow, sparrowStats } =
    useLiveSparrowVisualization(isSparrowRunning, handleSparrowComplete);

  const liveSvgContent = liveSvgFromSparrow || savedSvgContent;
  const { setItem, getItem } = useFileStorage();
  const { currentDesign } = useDesignContext();

  const loadSavedSettings = useCallback(async () => {
    try {
      const savedSettings = await getItem<Partial<NestingSettings>>(
        "nestingSettings",
        "pattern",
        DEFAULT_NESTING_SETTINGS
      );
      if (savedSettings) {
        setNestingSettings({
          ...DEFAULT_NESTING_SETTINGS,
          ...savedSettings,
        });
      }
    } catch {}
  }, [getItem]);

  const saveSettings = useCallback(async () => {
    try {
      await setItem("nestingSettings", nestingSettings, "pattern");
    } catch {}
  }, [nestingSettings, setItem]);

  useEffect(() => {
    loadSavedSettings();
  }, [loadSavedSettings]);

  useEffect(() => {
    if (
      JSON.stringify(nestingSettings) !==
      JSON.stringify(DEFAULT_NESTING_SETTINGS)
    ) {
      saveSettings();
    }
  }, [nestingSettings, saveSettings]);

  const handleNestClick = useCallback(async () => {
    if (!selectedPieces.length) {
      alert("Please select pattern pieces to nest");
      return;
    }
    try {
      setLastSvgFromNesting(null);
      setSavedSvgContent(null);
      const result = await nestPatterns(
        selectedPieces,
        canvasWidth,
        nestingSettings
      );
      if (result) {
        setIsManualMode(false);
      }
    } catch (error) {
      alert("Nesting failed. Please try again.");
    }
  }, [selectedPieces, nestPatterns, nestingSettings, canvasWidth]);

  const getPatternColor = useCallback((patternName: string): string => {
    let hash = 0;
    for (let i = 0; i < patternName.length; i++) {
      hash = patternName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PATTERN_COLORS[Math.abs(hash) % PATTERN_COLORS.length];
  }, []);

  const calculatePathBounds = useCallback((pathData: string) => {
    const commands = pathData.match(/[a-df-z][^a-df-z]*/gi) || [];
    let xMin = Infinity,
      xMax = -Infinity,
      yMin = Infinity,
      yMax = -Infinity;
    let x = 0,
      y = 0;
    let firstX = 0,
      firstY = 0;
    let hasFirstPoint = false;
    commands.forEach((command) => {
      const type = command[0].toLowerCase();
      const args = command
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(parseFloat)
        .filter((n) => !isNaN(n));
      if (type === "m") {
        if (args.length >= 2) {
          x = args[0];
          y = args[1];
          if (!hasFirstPoint) {
            firstX = x;
            firstY = y;
            hasFirstPoint = true;
          }
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      } else if (type === "l") {
        if (args.length >= 2) {
          x = args[0];
          y = args[1];
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      } else if (type === "c") {
        for (let i = 0; i < args.length; i += 2) {
          if (i + 1 < args.length) {
            const px = args[i];
            const py = args[i + 1];
            xMin = Math.min(xMin, px);
            xMax = Math.max(xMax, px);
            yMin = Math.min(yMin, py);
            yMax = Math.max(yMax, py);
          }
        }
        if (args.length >= 6) {
          x = args[args.length - 2];
          y = args[args.length - 1];
        }
      }
    });
    return {
      xMin: xMin === Infinity ? 0 : xMin,
      xMax: xMax === -Infinity ? 0 : xMax,
      yMin: yMin === Infinity ? 0 : yMin,
      yMax: yMax === -Infinity ? 0 : yMax,
      startX: firstX,
      startY: firstY,
    };
  }, []);

  const parseSparrowSVG = useCallback(
    (svgContent: string) => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
      const patterns: Array<{
        id: string;
        name: string;
        pathData: string;
        x: number;
        y: number;
        rotation: number;
        color: string;
        bbox: { xMin: number; xMax: number; yMin: number; yMax: number };
      }> = [];

      const itemsGroup = svgDoc.querySelector("g#items");
      if (!itemsGroup) return patterns;

      const useElements = itemsGroup.querySelectorAll('use[href^="#item_"]');
      
      useElements.forEach((useElement, index) => {
        const transform = useElement.getAttribute("transform") || "";
        const href = useElement.getAttribute("href");
        
        if (href) {
          const itemId = href.substring(1);
          const defsGroup = itemsGroup.querySelector("defs");
          const itemGroup = defsGroup?.querySelector(`g#${itemId}`);
          const pathElement = itemGroup?.querySelector("path");
          
          if (pathElement) {
            const pathData = pathElement.getAttribute("d") || "";
            if (pathData) {
              let x = 0, y = 0, rotation = 0;
              
              const translateMatch = transform.match(/translate\(([^)]+)\)/);
              const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
              
              if (translateMatch) {
                const coords = translateMatch[1].split(/[\s,]+/).map(parseFloat);
                x = coords[0] || 0;
                y = coords[1] || 0;
              }
              
              if (rotateMatch) {
                const rotParams = rotateMatch[1].split(/[\s,]+/).map(parseFloat);
                rotation = rotParams[0] || 0;
              }
              
              const pathInfo = calculatePathBounds(pathData);
              let patternName = "Unknown";
              let patternCategory = "body";
              
              const itemIndex = parseInt(itemId.replace("item_", "")) || 0;
              if (itemIndex < selectedPieces.length) {
                const selectedPiece = selectedPieces[itemIndex];
                patternName = selectedPiece.name;
                patternCategory = selectedPiece.name;
              }
              
              patterns.push({
                id: `${itemId}-${index}`,
                name: patternName,
                pathData,
                x,
                y,
                rotation,
                color: getPatternColor(patternCategory),
                bbox: {
                  xMin: pathInfo.xMin,
                  xMax: pathInfo.xMax,
                  yMin: pathInfo.yMin,
                  yMax: pathInfo.yMax,
                },
              });
            }
          }
        }
      });
      
      return patterns;
    },
    [selectedPieces, calculatePathBounds, getPatternColor]
  );

  const updateAutoBase = useCallback((svgContent: string, isFromFreshNesting = false) => {
    if (!svgContent) return;
    
    const sparrowPatterns = parseSparrowSVG(svgContent);
    if (sparrowPatterns.length === 0) return;

    let bboxWidth = 48.1;
    let bboxHeight = 94.5;
    let xMin = 0.0;
    let yMin = 0.0;

    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const viewBoxValues = viewBoxMatch[1].split(/[\s,]+/).map(parseFloat);
      xMin = viewBoxValues[0];
      yMin = viewBoxValues[1];
      bboxWidth = viewBoxValues[2];
      bboxHeight = viewBoxValues[3];
    }

    const scale = Math.min(canvasWidth / bboxWidth, canvasHeight / bboxHeight);
    const scaledWidth = bboxWidth * scale;
    const scaledHeight = bboxHeight * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    const canvasPieces = sparrowPatterns.map((pattern, index) => ({
      id: `${pattern.id}-${index}`,
      name: pattern.name,
      pathData: pattern.pathData,
      x: (pattern.x - xMin) * scale + offsetX,
      y: (pattern.y - yMin) * scale + offsetY,
      width: pattern.bbox.xMax - pattern.bbox.xMin,
      height: pattern.bbox.yMax - pattern.bbox.yMin,
      rotation: pattern.rotation,
      color: pattern.color,
      pathBounds: null,
      scaleFactor: scale
    }));

    setAutoBasePieces(canvasPieces);
    if (isFromFreshNesting || manualPieces.length === 0) {
      setManualPieces(canvasPieces);
    }
  }, [parseSparrowSVG, canvasWidth, canvasHeight, manualPieces.length]);

  const handleCancelNesting = useCallback(() => {
    if (liveSvgContent) {
      updateAutoBase(liveSvgContent, true);
    }
    cancelNesting();
  }, [cancelNesting, liveSvgContent, updateAutoBase]);

  const loadSVGPath = useCallback(async (svgPath: string): Promise<string> => {
    try {
      const publicPath = svgPath.startsWith("/patterns/")
        ? svgPath
        : svgPath.replace("/src/assets", "");
      const response = await fetch(publicPath);
      if (response.ok) {
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const pathElement = svgDoc.querySelector("path");
        return pathElement?.getAttribute("d") || "";
      }
    } catch (error) {}
    return "";
  }, []);

  const resetDragState = useCallback(() => {
    setIsDragging(false);
    setSelectedPanelId(null);
    setDragOffset({ x: 0, y: 0 });
    setRotationStart(0);
  }, []);

  const resetToAutoLayout = useCallback(() => {
    if (autoBasePieces.length > 0) {
      setManualPieces([...autoBasePieces]);
    }
  }, [autoBasePieces]);

  useEffect(() => {
    if (liveSvgFromSparrow) {
      setSavedSvgContent(liveSvgFromSparrow);
    }
  }, [liveSvgFromSparrow]);

  useEffect(() => {
    if (liveSvgContent && !isNesting && !isSparrowRunning) {
      const isFromFreshNesting = liveSvgContent !== lastSvgFromNesting;
      updateAutoBase(liveSvgContent, isFromFreshNesting);
      if (isFromFreshNesting) {
        setLastSvgFromNesting(liveSvgContent);
      }
    }
  }, [
    liveSvgContent,
    isNesting,
    isSparrowRunning,
    updateAutoBase,
    lastSvgFromNesting,
  ]);

  const savePatternState = useCallback(async () => {
    if (!currentDesign) {
      return;
    }

    const patternData = {
      autoResult: autoBasePieces.length > 0 ? { pieces: autoBasePieces } : null,
      manualPieces: manualPieces,
      autoBasePieces: autoBasePieces,
      currentMode: isManualMode ? "manual" : "auto",
      settings: nestingSettings,
      liveSvgContent: liveSvgContent,
      savedSvgContent: savedSvgContent,
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      lastSvgFromNesting: lastSvgFromNesting,
    };

    try {
      await setItem("pattern", patternData, currentDesign.id);
      alert("Pattern saved successfully!");
    } catch (error) {
      alert(`Pattern save failed: ${error}`);
    }
  }, [
    currentDesign,
    manualPieces,
    autoBasePieces,
    isManualMode,
    nestingSettings,
    liveSvgContent,
    savedSvgContent,
    canvasWidth,
    canvasHeight,
    lastSvgFromNesting,
  ]);

  const loadPatternState = useCallback(async () => {
    if (!currentDesign) {
      return;
    }

    try {
      const patternData = (await getItem(
        "pattern",
        currentDesign.id,
        null
      )) as any;
      if (!patternData) {
        return;
      }

      const {
        manualPieces: savedManualPieces,
        autoBasePieces: savedAutoBasePieces,
        currentMode,
        settings,
        liveSvgContent: savedLiveSvgContent,
        savedSvgContent: savedSavedSvgContent,
        lastSvgFromNesting: savedLastSvgFromNesting,
      } = patternData;

      if (savedManualPieces && savedManualPieces.length > 0) {
        setManualPieces(savedManualPieces);
      }

      if (savedAutoBasePieces && savedAutoBasePieces.length > 0) {
        setAutoBasePieces(savedAutoBasePieces);
      }

      if (currentMode) {
        setIsManualMode(currentMode === "manual");
      }

      if (settings) {
        setNestingSettings({ ...DEFAULT_NESTING_SETTINGS, ...settings });
      }

      if (savedLiveSvgContent || savedSavedSvgContent) {
        setSavedSvgContent(savedLiveSvgContent || savedSavedSvgContent || null);
      }

      if (savedLastSvgFromNesting) {
        setLastSvgFromNesting(savedLastSvgFromNesting);
      }
    } catch (error) {
      console.error("Failed to load pattern state:", error);
    }
  }, [currentDesign, getItem]);

  useEffect(() => {
    if (currentDesign) {
      setHasLoadedInitialState(false);
    }
  }, [currentDesign?.id]);

  useEffect(() => {
    if (currentDesign && !hasLoadedInitialState) {
      loadPatternState();
      setHasLoadedInitialState(true);
    }
  }, [currentDesign, loadPatternState, hasLoadedInitialState]);

  return {
    canvasRef,
    panels,
    setPanels,
    selectedPanelId,
    setSelectedPanelId,
    baseCanvasWidth,
    baseCanvasHeight,
    nestingSettings,
    setNestingSettings,
    canvasWidth,
    canvasHeight,
    setCanvasHeight,
    isManualMode,
    setIsManualMode,
    manualPieces,
    setManualPieces,
    isDragging,
    setIsDragging,
    dragOffset,
    setDragOffset,
    isRotating,
    setIsRotating,
    rotationStart,
    setRotationStart,
    isNesting,
    isSparrowRunning,
    error,
    liveSvgContent,
    sparrowStats,
    handleNestClick,
    handleCancelNesting,
    resetDragState,
    resetToAutoLayout,
    loadSVGPath,
    getPatternColor,
    calculatePathBounds,
    parseSparrowSVG,
    savePatternState,
    autoBasePieces,
  };
};
