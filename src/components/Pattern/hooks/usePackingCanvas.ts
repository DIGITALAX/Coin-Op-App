import { useState, useRef, useEffect, useCallback } from "react";
import { usePatternNesting } from "./usePatternNesting";
import { useLiveSparrowVisualization } from "./useLiveSparrowVisualization";
import { useFileStorage } from "../../Activity/hooks/useFileStorage";
import {
  CanvasPanel,
  Size,
  NestingSettings,
  DEFAULT_NESTING_SETTINGS,
  PatternPiece,
} from "../types/pattern.types";

export const usePackingCanvas = (
  selectedPieces: PatternPiece[],
  selectedSize: Size
) => {
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState(0);

  const { nestPatterns, isNesting, isSparrowRunning, error, cancelNesting, handleSparrowComplete } =
    usePatternNesting();
  const { liveSvgContent, sparrowStats } =
    useLiveSparrowVisualization(isSparrowRunning, handleSparrowComplete);
  const { setItem, getItem } = useFileStorage();

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
      const result = await nestPatterns(
        selectedPieces,
        canvasWidth,
        nestingSettings
      );
      if (result) {
        setIsManualMode(false);
        setManualPieces([]);
      }
    } catch (error) {
      alert("Nesting failed. Please try again.");
    }
  }, [
    selectedPieces,
    selectedSize,
    nestPatterns,
    nestingSettings,
    canvasWidth,
  ]);

  const handleCancelNesting = useCallback(() => {
    cancelNesting();
  }, [cancelNesting]);

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

  const getPatternColor = useCallback((patternName: string): string => {
    const colors = [
      "#4ECDC4",
      "#45B7AF",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#FFB6C1",
      "#87CEEB",
      "#98FB98",
    ];
    let hash = 0;
    for (let i = 0; i < patternName.length; i++) {
      hash = patternName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
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
      const useElements = itemsGroup ? itemsGroup.querySelectorAll("use") : [];
      if (useElements.length > 0) {
        useElements.forEach((useElement, index) => {
          const transform = useElement.getAttribute("transform");
          const href =
            useElement.getAttribute("href") ||
            useElement.getAttribute("xlink:href");
          let x = 0,
            y = 0,
            rotation = 0;
          if (transform) {
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
          }
          if (href) {
            const refId = href.replace("#", "");
            const referencedElement = svgDoc.querySelector(`#${refId}`);
            if (referencedElement) {
              const pathElement =
                referencedElement.querySelector("path") ||
                referencedElement.querySelector("g path");
              if (pathElement) {
                const pathData = pathElement.getAttribute("d") || "";
                if (pathData) {
                  const pathInfo = calculatePathBounds(pathData);
                  let patternName = "Unknown";
                  let patternCategory = "body";
                  const itemIndex = parseInt(refId.replace("item_", "")) || 0;
                  if (itemIndex < selectedPieces.length) {
                    const selectedPiece = selectedPieces[itemIndex];
                    patternName = selectedPiece.name;
                    patternCategory = selectedPiece.name;
                  }
                  patterns.push({
                    id: `use-pattern-${index}`,
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
          }
        });
      }
      return patterns;
    },
    [selectedPieces, calculatePathBounds, getPatternColor]
  );

  const resetDragState = useCallback(() => {
    setIsDragging(false);
    setSelectedPanelId(null);
    setDragOffset({ x: 0, y: 0 });
    setRotationStart(0);
  }, []);

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
    loadSVGPath,
    getPatternColor,
    calculatePathBounds,
    parseSparrowSVG,
  };
};
