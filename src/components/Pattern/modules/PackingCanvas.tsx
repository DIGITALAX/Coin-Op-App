import { invoke } from "@tauri-apps/api/core";
import { useState, useRef, useEffect, useCallback, FunctionComponent } from "react";
import { usePatternNesting } from "../hooks/usePatternNesting";
import { useLiveSparrowVisualization } from "../hooks/useLiveSparrowVisualization";
import { NestingSettingsPanel } from "./NestingSettings";
import { useFileStorage } from "../../Activity/hooks/useFileStorage";
import { CanvasPanel, PackingCanvasProps, Size, UNISEX_T_SHIRT_SIZING ,  NestingSettings, DEFAULT_NESTING_SETTINGS } from "../types/pattern.types";

export const PackingCanvas: FunctionComponent<PackingCanvasProps> = ({
  selectedPieces,
  selectedSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [panels, setPanels] = useState<CanvasPanel[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [canvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [nestingSettings, setNestingSettings] = useState<NestingSettings>(DEFAULT_NESTING_SETTINGS);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualPieces, setManualPieces] = useState<CanvasPanel[]>([]);
  const { nestPatterns, isNesting, isSparrowRunning, error, cancelNesting } = usePatternNesting();
  const { liveSvgContent, sparrowStats } = useLiveSparrowVisualization(isSparrowRunning);
  const { setItem, getItem } = useFileStorage();
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const savedSettings = await getItem<NestingSettings>('nestingSettings', 'pattern', DEFAULT_NESTING_SETTINGS);
        if (savedSettings) {
          setNestingSettings(savedSettings);
        }
      } catch {
      }
    };
    loadSavedSettings();
  }, [getItem]);
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await setItem('nestingSettings', nestingSettings, 'pattern');
      } catch {
      }
    };
    if (JSON.stringify(nestingSettings) !== JSON.stringify(DEFAULT_NESTING_SETTINGS)) {
      saveSettings();
    }
  }, [nestingSettings, setItem]);
  const loadSVGPath = async (svgPath: string): Promise<string> => {
    try {
      const publicPath = svgPath.startsWith('/patterns/') ? svgPath : svgPath.replace('/src/assets', '');
      const response = await fetch(publicPath);
      if (response.ok) {
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const pathElement = svgDoc.querySelector('path');
        return pathElement?.getAttribute('d') || '';
      }
    } catch (error) {
    }
    return '';
  };
  const runPatternNesting = async () => {
    if (selectedPieces.length === 0 || isNesting) return;
    const result = await nestPatterns(selectedPieces, canvasWidth, nestingSettings);
    if (result) {
      await createPanelsFromNestingResult(result);
      const newCanvasHeight = Math.max(600, result.strip_height + 50);
      setCanvasHeight(newCanvasHeight);
    }
  };
  const createPanelsFromNestingResult = async (result: any) => {
    const newPanels: CanvasPanel[] = [];
    for (const placedItem of result.placed_items) {
      const pieceId = placedItem.id;
      const piece = selectedPieces.find(p => p.id === pieceId);
      if (piece) {
        const pathData = await loadSVGPath(piece.svgPath);
        const panel: CanvasPanel = {
          id: `${piece.id}-${Date.now()}`,
          name: piece.name,
          pathData,
          x: placedItem.x,
          y: placedItem.y,
          width: piece.widthMM * 0.5,
          height: piece.heightMM * 0.5,
          rotation: placedItem.rotation * (180 / Math.PI),
          color: getPatternColor(piece.category),
          pathBounds: null
        };
        newPanels.push(panel);
      }
    }
    setPanels(newPanels);
  };
  const getPatternColor = (category: string): string => {
    const colors: Record<string, string> = {
      'body': '#4ECDC4',
      'sleeve': '#45B7AF', 
      'trim': '#96CEB4',
      'pocket': '#FFEAA7',
      'hood': '#DDA0DD'
    };
    return colors[category] || '#4ECDC4';
  };
  const parseSparrowSVG = (svgContent: string) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
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
    const itemsGroup = svgDoc.querySelector('g#items');
    const useElements = itemsGroup ? itemsGroup.querySelectorAll('use') : [];
    if (useElements.length > 0) {
      useElements.forEach((useElement, index) => {
        const transform = useElement.getAttribute('transform');
        const href = useElement.getAttribute('href') || useElement.getAttribute('xlink:href');
        let x = 0, y = 0, rotation = 0;
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
          const refId = href.replace('#', '');
          const referencedElement = svgDoc.querySelector(`#${refId}`);
          if (referencedElement) {
            const pathElement = referencedElement.querySelector('path') || 
                               referencedElement.querySelector('g path');
            if (pathElement) {
              const pathData = pathElement.getAttribute('d') || '';
              if (pathData) {
                const pathInfo = calculatePathBounds(pathData);
                let patternName = 'Unknown';
                let patternCategory = 'body';
                const itemIndex = parseInt(refId.replace('item_', '')) || 0;
                if (itemIndex < selectedPieces.length) {
                  const selectedPiece = selectedPieces[itemIndex];
                  patternName = selectedPiece.name;
                  patternCategory = selectedPiece.category;
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
                    yMax: pathInfo.yMax
                  }
                });
              }
            }
          }
        }
      });
    }
    return patterns;
  };
  const calculatePathBounds = (pathData: string) => {
    const commands = pathData.match(/[a-df-z][^a-df-z]*/gi) || [];
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    let x = 0, y = 0;
    let firstX = 0, firstY = 0;
    let hasFirstPoint = false;
    commands.forEach(command => {
      const type = command[0].toLowerCase();
      const args = command.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
      if (type === 'm') {
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
      } else if (type === 'l') {
        if (args.length >= 2) {
          x = args[0];
          y = args[1];
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      } else if (type === 'c') {
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
      startY: firstY
    };
  };
  const enterManualMode = async () => {
    if (!liveSvgContent) return;
    const sparrowPatterns = parseSparrowSVG(liveSvgContent);
    if (sparrowPatterns.length === 0) {
      return;
    }
    let bboxWidth = 48.1; 
    let bboxHeight = 94.5;
    let xMin = 0.0;
    let yMin = -4.5;
    const viewBoxMatch = liveSvgContent.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const viewBoxValues = viewBoxMatch[1].split(/[\s,]+/).map(parseFloat);
      if (viewBoxValues.length === 4) {
        xMin = viewBoxValues[0];
        yMin = viewBoxValues[1];
        bboxWidth = viewBoxValues[2];
        bboxHeight = viewBoxValues[3];
      }
    }
    const margin = 10; 
    const targetWidth = canvasWidth - (margin * 2);
    const targetHeight = canvasHeight - (margin * 2);
    const scaleFactorY = targetHeight / bboxHeight;
    const scaleFactor = scaleFactorY; 
    const scaledWidth = bboxWidth * scaleFactor;
    const horizontalOffset = scaledWidth > targetWidth ? 0 : (targetWidth - scaledWidth) / 2;
    const manualPiecesData: CanvasPanel[] = sparrowPatterns.map((pattern) => {
      const scaledX = ((pattern.x - xMin) * scaleFactor) + margin + horizontalOffset;
      const scaledY = ((pattern.y - yMin) * scaleFactor) + margin;
      return {
        id: `manual-${pattern.id}-${Date.now()}`,
        name: pattern.name,
        pathData: pattern.pathData,
        x: scaledX,
        y: scaledY,
        width: Math.abs(pattern.bbox.xMax - pattern.bbox.xMin) * scaleFactor,
        height: Math.abs(pattern.bbox.yMax - pattern.bbox.yMin) * scaleFactor,
        rotation: pattern.rotation,
        color: pattern.color,
        pathBounds: null,
        scaleFactor: scaleFactor 
      };
    });
    setManualPieces(manualPiecesData);
    setIsManualMode(true);
  };
  const exitManualMode = () => {
    setIsManualMode(false);
    setManualPieces([]);
    setSelectedPanelId(null);
  };
  useEffect(() => {
    if (selectedPieces.length === 0) {
      setPanels([]);
    }
  }, [selectedPieces]);
  const drawPanel = (ctx: CanvasRenderingContext2D, panel: CanvasPanel) => {
    ctx.save();
    if (isManualMode) {
      ctx.translate(panel.x, panel.y);
      if (panel.rotation !== 0) {
        ctx.rotate((panel.rotation * Math.PI) / 180);
      }
      if (panel.scaleFactor) {
        ctx.scale(panel.scaleFactor, panel.scaleFactor);
      }
      const path = new Path2D(panel.pathData);
      ctx.fillStyle = panel.color + "40";
      ctx.strokeStyle = panel.color;
      ctx.lineWidth = 1 / (panel.scaleFactor || 1); 
      ctx.fill(path);
      ctx.stroke(path);
      ctx.fillStyle = "lime";
      ctx.beginPath();
      ctx.arc(0, 0, 3 / (panel.scaleFactor || 1), 0, Math.PI * 2); 
      ctx.fill();
    } else {
      ctx.translate(panel.x, panel.y);
      if (panel.rotation !== 0) {
        ctx.rotate((panel.rotation * Math.PI) / 180);
      }
      if (panel.pathBounds) {
        const scaleX = panel.width / panel.pathBounds.width;
        const scaleY = panel.height / panel.pathBounds.height;
        ctx.scale(scaleX, scaleY);
      }
      const path = new Path2D(panel.pathData);
      ctx.fillStyle = panel.color + "40";
      ctx.strokeStyle = panel.color;
      ctx.lineWidth = 0.5;
      ctx.fill(path);
      ctx.stroke(path);
    }
    ctx.restore();
    ctx.fillStyle = "white";
    ctx.font = "8px monospace";
    let displayName = panel.name;
    if (panel.name.includes("T-Shirt")) {
      displayName = panel.name.replace("T-Shirt ", "");
    }
    if (panel.name.includes("Neck Binding")) {
      displayName = "Neck Binding";
    }
    ctx.fillText(displayName, panel.x + 5, panel.y - 5);
  };
  const drawRotationHandle = (ctx: CanvasRenderingContext2D, panel: CanvasPanel) => {
    ctx.save();
    ctx.fillStyle = "rgba(255, 165, 0, 0.8)"; 
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(panel.x, panel.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(panel.x, panel.y, 8, -Math.PI/2, Math.PI, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(panel.x - 8, panel.y);
    ctx.lineTo(panel.x - 5, panel.y - 3);
    ctx.moveTo(panel.x - 8, panel.y);
    ctx.lineTo(panel.x - 5, panel.y + 3);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#FFAA00";
    ctx.font = "11px monospace";
    ctx.fillText(`${panel.name} (click to rotate)`, panel.x + 20, panel.y - 5);
  };
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isManualMode) {
      ctx.fillStyle = "rgba(255, 255, 0, 0.05)"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#FBDB86"; 
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
    const piecesToDraw = isManualMode ? manualPieces : panels;
    piecesToDraw.forEach((panel) => {
      drawPanel(ctx, panel);
      if (selectedPanelId === panel.id && isManualMode) {
        drawRotationHandle(ctx, panel);
      }
    });
    if (isManualMode) {
      ctx.fillStyle = "#FBDB86";
      ctx.font = "12px monospace";
      ctx.fillText("MANUAL MODE - Drag patterns • Click orange symbol to rotate (15° snaps, hold Shift for free rotation)", 10, 25);
    }
  };
  useEffect(() => {
    draw();
  }, [panels, selectedPanelId, isManualMode, manualPieces]);
  const exportToFormat = useCallback(async (garmentType: string, projectName: string, size: Size, format: "PDF" | "SVG") => {
    try {
      let piecesToExport = isManualMode ? manualPieces : panels;
      if (piecesToExport.length === 0 && selectedPieces.length > 0) {
        piecesToExport = selectedPieces.map((piece, index) => ({
          id: `selected-${index}`,
          name: piece.name || `Pattern Piece ${index + 1}`,
          x: 50 + (index % 3) * 200,
          y: 50 + Math.floor(index / 3) * 250,
          rotation: 0,
          pathData: '',
          width: piece.widthMM || 150,
          height: piece.heightMM || 200,
          color: `hsl(${index * 60}, 70%, 50%)`,
          pathBounds: { x: 0, y: 0, width: piece.widthMM || 150, height: piece.heightMM || 200 } as DOMRect
        }));
      }
      if (piecesToExport.length === 0) {
        throw new Error("No pattern pieces available to export. Please select pattern pieces or run nesting first.");
      }
      const sizing = UNISEX_T_SHIRT_SIZING[size];
      const exportPieces = piecesToExport.map((piece) => ({
        id: piece.id,
        name: piece.name,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation || 0,
        path_data: piece.pathData || "",
        seam_allowance_mm: 10.0,
        grain_direction: piece.name.includes("Sleeve") ? "crosswise" : "lengthwise",
        width_mm: piece.width || 100,
        height_mm: piece.height || 100,
      }));
      const actualCanvasWidthMm = canvasWidth * (sizing.chest / 483);
      const actualCanvasHeightMm = canvasHeight * (sizing.length / 686);
      const exportRequest = {
        pieces: exportPieces,
        garment_type: garmentType,
        size: size,
        canvas_width_mm: actualCanvasWidthMm,
        canvas_height_mm: actualCanvasHeightMm,
        is_manual_mode: isManualMode,
        project_name: projectName,
        chest_mm: sizing.chest,
        length_mm: sizing.length,
      };
      const commandName = format === "PDF" ? "export_pattern_pieces_to_pdf" : "export_pattern_pieces_to_svg";
      const result = await invoke<string>(commandName, {
        request: exportRequest
      });
      alert(`Success! ${result}`);
    } catch (error) {
      alert(`Export failed: ${error}`);
    }
  }, [isManualMode, manualPieces, panels, canvasWidth, canvasHeight, selectedPieces, liveSvgContent]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleExportEvent = (event: CustomEvent) => {
      const { garmentType, projectName, selectedSize, format } = event.detail;
      exportToFormat(garmentType, projectName, selectedSize, format);
    };
    canvas.addEventListener('exportPattern', handleExportEvent as EventListener);
    return () => {
      canvas.removeEventListener('exportPattern', handleExportEvent as EventListener);
    };
  }, [exportToFormat]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [draggedPanelId, setDraggedPanelId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotationStart, setRotationStart] = useState(0);
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };
  const findRotationHandle = (x: number, y: number, panel: CanvasPanel) => {
    const handleRadius = 20; 
    const distance = Math.sqrt((x - panel.x) ** 2 + (y - panel.y) ** 2);
    if (distance <= handleRadius) {
      return { x: panel.x, y: panel.y, id: 'rotate' };
    }
    return null;
  };
  const findPanelAtPoint = (x: number, y: number): CanvasPanel | null => {
    if (!isManualMode) return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    for (let i = manualPieces.length - 1; i >= 0; i--) {
      const panel = manualPieces[i];
      ctx.save();
      ctx.translate(panel.x, panel.y);
      if (panel.rotation !== 0) {
        ctx.rotate((panel.rotation * Math.PI) / 180);
      }
      if (panel.scaleFactor) {
        ctx.scale(panel.scaleFactor, panel.scaleFactor);
      }
      const path = new Path2D(panel.pathData);
      const transformedPoint = ctx.getTransform().invertSelf();
      const localX = transformedPoint.a * x + transformedPoint.c * y + transformedPoint.e;
      const localY = transformedPoint.b * x + transformedPoint.d * y + transformedPoint.f;
      ctx.restore();
      if (ctx.isPointInPath(path, localX, localY)) {
        return panel;
      }
    }
    return null;
  };
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isManualMode) return;
    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    if (selectedPanelId) {
      const selectedPanel = manualPieces.find(p => p.id === selectedPanelId);
      if (selectedPanel) {
        const handle = findRotationHandle(coords.x, coords.y, selectedPanel);
        if (handle) {
          setIsRotating(true);
          setDraggedPanelId(selectedPanel.id);
          const angle = Math.atan2(coords.y - selectedPanel.y, coords.x - selectedPanel.x);
          setRotationStart(angle * (180 / Math.PI) - selectedPanel.rotation);
          return;
        }
      }
    }
    const panel = findPanelAtPoint(coords.x, coords.y);
    if (panel) {
      setSelectedPanelId(panel.id);
      setIsDragging(true);
      setDraggedPanelId(panel.id);
      setDragOffset({
        x: coords.x - panel.x,
        y: coords.y - panel.y
      });
    } else {
      setSelectedPanelId(null);
    }
  };
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if ((!isDragging && !isRotating) || !draggedPanelId) return;
    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    if (isRotating) {
      const panel = manualPieces.find(p => p.id === draggedPanelId);
      if (panel) {
        const angle = Math.atan2(coords.y - panel.y, coords.x - panel.x);
        let newRotation = (angle * (180 / Math.PI)) - rotationStart;
        if (!event.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }
        while (newRotation < 0) newRotation += 360;
        while (newRotation >= 360) newRotation -= 360;
        setManualPieces(prev => 
          prev.map(p => 
            p.id === draggedPanelId 
              ? { ...p, rotation: newRotation }
              : p
          )
        );
      }
    } else if (isDragging) {
      const newX = coords.x - dragOffset.x;
      const newY = coords.y - dragOffset.y;
      setManualPieces(prev => 
        prev.map(panel => 
          panel.id === draggedPanelId 
            ? { ...panel, x: newX, y: newY }
            : panel
        )
      );
    }
  };
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsRotating(false);
    setDraggedPanelId(null);
    setDragOffset({ x: 0, y: 0 });
    setRotationStart(0);
  };
  return (
    <div className="flex flex-col gap-6">
      <NestingSettingsPanel
        settings={nestingSettings}
        onSettingsChange={setNestingSettings}
        disabled={isNesting || isSparrowRunning}
      />
      <div className="flex-1">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-white font-mana text-sm">
            ZERO-WASTE PATTERN NESTING
          </div>
          <div className="flex gap-2">
            {(isNesting || isSparrowRunning) ? (
              <button
                onClick={cancelNesting}
                className="px-3 py-1 rounded font-mana text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                CANCEL
              </button>
            ) : (
              <>
                <button
                  onClick={runPatternNesting}
                  disabled={selectedPieces.length === 0}
                  className={`px-3 py-1 rounded font-mana text-xs ${
                    selectedPieces.length === 0
                      ? 'bg-gris/40 text-white/50 cursor-not-allowed'
                      : 'bg-ama hover:opacity-70 text-black cursor-pointer'
                  }`}
                >
                  NEST
                </button>
                {liveSvgContent && !isManualMode && (
                  <button
                    onClick={enterManualMode}
                    className="px-3 py-1 rounded font-mana text-xs bg-verde hover:opacity-70 text-black cursor-pointer"
                  >
                    MANUAL NEST
                  </button>
                )}
                {isManualMode && (
                  <button
                    onClick={exitManualMode}
                    className="px-3 py-1 rounded font-mana text-xs bg-fuego hover:opacity-70 text-white cursor-pointer"
                  >
                    EXIT MANUAL
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
            <div className="text-red-400 text-xs">
              Nesting Error: {error}
            </div>
          </div>
        )}
        <div className="mb-4 flex gap-4">
          <div className="flex-1 p-3 bg-black/20 border border-white/20 rounded">
            <div className="text-white text-xs font-mana mb-1">
              WASTE TRACKER
            </div>
            <div className="text-fuego text-lg font-mono">
              {(() => {
                if (liveSvgContent && sparrowStats?.density) {
                  const utilizationMatch = sparrowStats.density.match(/([0-9.]+)%?/);
                  if (utilizationMatch) {
                    const utilization = parseFloat(utilizationMatch[1]);
                    const waste = 100 - utilization;
                    return `${waste.toFixed(1)}% WASTE`;
                  }
                }
                return selectedPieces.length > 0 ? "-- % WASTE" : "SELECT PATTERNS";
              })()}
            </div>
          </div>
          <div className="flex-1 p-3 bg-black/20 border border-white/20 rounded">
            <div className="text-white text-xs font-mana mb-1">
              {selectedSize} MEASUREMENTS (mm)
            </div>
            <div className="text-ama text-xs font-mono">
              {(() => {
                const sizing = UNISEX_T_SHIRT_SIZING[selectedSize];
                return `Chest: ${sizing.chest}mm • Length: ${sizing.length}mm`;
              })()}
            </div>
          </div>
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="border border-white/20 rounded bg-black/20"
            style={{ display: (liveSvgContent && !isManualMode) ? 'none' : 'block' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          {liveSvgContent && !isManualMode && (
            <div 
              className="border border-red-500 rounded bg-white/10 overflow-visible relative sparrow-svg-container"
              style={{ width: canvasWidth, height: canvasHeight }}
            >
              <div 
                className="w-full h-full"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                }}
                dangerouslySetInnerHTML={{ 
                  __html: (() => {
                    const viewBoxMatch = liveSvgContent.match(/viewBox="([^"]+)"/);
                    let originalViewBox = "0 0 800 600"; 
                    if (viewBoxMatch) {
                      originalViewBox = viewBoxMatch[1];
                    }
                    return liveSvgContent.replace(
                      /<svg[^>]*>/,
                      `<svg width="${canvasWidth}" height="${canvasHeight}" viewBox="${originalViewBox}" preserveAspectRatio="xMidYMid meet" style="background: rgba(255,255,255,0.05);">`
                    );
                  })()
                }}
              />
            </div>
          )}
        </div>
        {(isNesting || isSparrowRunning) && (
          <div className="mt-2 text-center">
            <div className="text-ama text-xs font-mono">
              {(sparrowStats?.full_stats && sparrowStats.full_stats.trim() !== "") ? 
                sparrowStats.full_stats : 
                "⏳ Waiting for optimization data..."
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
