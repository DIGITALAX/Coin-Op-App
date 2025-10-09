import {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { usePackingCanvas } from "../hooks/usePackingCanvas";
import { PackingCanvasProps } from "../types/pattern.types";
import { ExportDialog } from "./ExportDialog";

export const PackingCanvas: FunctionComponent<PackingCanvasProps> = ({
  selectedPieces,
}) => {
  const { t } = useTranslation();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    canvasRef,
    canvasWidth,
    canvasHeight,
    isManualMode,
    setIsManualMode,
    isNesting,
    isSparrowRunning,
    error,
    liveSvgContent,
    sparrowStats,
    handleNestClick,
    handleCancelNesting,
    resetToAutoLayout,
    manualPieces,
    setManualPieces,
    isDragging,
    setIsDragging,
    dragOffset,
    setDragOffset,
    selectedPanelId,
    setSelectedPanelId,
    isRotating,
    setIsRotating,
    rotationStart,
    setRotationStart,
    savePatternState,
  } = usePackingCanvas(selectedPieces);

  const generateExportSvg = useCallback(() => {
    if (isManualMode && manualPieces.length > 0) {
      const svgElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svgElement.setAttribute("width", canvasWidth.toString());
      svgElement.setAttribute("height", canvasHeight.toString());
      svgElement.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`);
      svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");

      manualPieces.forEach((piece) => {
        const group = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        group.setAttribute(
          "transform",
          `translate(${piece.x}, ${piece.y}) rotate(${piece.rotation})`
        );

        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute("d", piece.pathData);
        path.setAttribute("fill", piece.color);
        path.setAttribute("fill-opacity", "0.7");
        path.setAttribute("stroke", "#000000");
        path.setAttribute("stroke-width", "1");

        group.appendChild(path);
        svgElement.appendChild(group);
      });

      return svgElement;
    }

    if (!isManualMode && liveSvgContent) {
      return parseAutoSvgToPieces();
    }

    return null;
  }, [isManualMode, manualPieces, canvasWidth, canvasHeight, liveSvgContent]);

  const parseAutoSvgToPieces = useCallback(() => {
    if (!liveSvgContent) return null;

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(liveSvgContent, "image/svg+xml");

    const svgElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    svgElement.setAttribute("width", canvasWidth.toString());
    svgElement.setAttribute("height", canvasHeight.toString());
    svgElement.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`);

    const defsElement = svgDoc.querySelector("defs");
    const useElements = svgDoc.querySelectorAll('use[href^="#item_"]');

    if (defsElement && useElements.length > 0) {
      useElements.forEach((useElement) => {
        const href = useElement.getAttribute("href");
        const transform = useElement.getAttribute("transform");

        if (href && transform) {
          const itemId = href.substring(1);
          const pathElement = defsElement.querySelector(`#${itemId} path`);

          if (pathElement) {
            const group = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            group.setAttribute("transform", transform);

            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );
            path.setAttribute("d", pathElement.getAttribute("d") || "");
            path.setAttribute("fill", "#7A7A7A");
            path.setAttribute("fill-opacity", "0.7");
            path.setAttribute("stroke", "#000000");
            path.setAttribute("stroke-width", "1");

            group.appendChild(path);
            svgElement.appendChild(group);
          }
        }
      });
    }

    return svgElement;
  }, [liveSvgContent, canvasWidth, canvasHeight]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    manualPieces.forEach((piece) => {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      if (piece.rotation !== 0) {
        ctx.rotate((piece.rotation * Math.PI) / 180);
      }
      if (piece.scaleFactor) {
        ctx.scale(piece.scaleFactor, piece.scaleFactor);
      }

      const path = new Path2D(piece.pathData);
      ctx.fillStyle = piece.color;
      ctx.globalAlpha = 0.7;
      ctx.fill(path);

      ctx.restore();

      const handleRadius = 8;
      const handleDistance = 30;
      const handleX = piece.x;
      const handleY = piece.y - handleDistance;

      ctx.save();
      ctx.fillStyle = "#FFA500";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(handleX, handleY, handleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↻", handleX, handleY);
      ctx.restore();
    });
  }, [manualPieces]);

  useEffect(() => {
    if (isManualMode) {
      drawCanvas();
    }
  }, [isManualMode, manualPieces, drawCanvas]);

  const findRotationHandleAtPoint = useCallback(
    (x: number, y: number) => {
      const handleRadius = 8;
      const handleDistance = 30;

      for (let i = manualPieces.length - 1; i >= 0; i--) {
        const panel = manualPieces[i];
        const handleX = panel.x;
        const handleY = panel.y - handleDistance;

        const distance = Math.sqrt((x - handleX) ** 2 + (y - handleY) ** 2);
        if (distance <= handleRadius) {
          return panel;
        }
      }
      return null;
    },
    [manualPieces]
  );

  const findPanelAtPoint = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const ctx = canvas.getContext("2d");
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

        if (ctx.isPointInPath(path, x, y)) {
          ctx.restore();
          return panel;
        }

        ctx.restore();
      }

      return null;
    },
    [manualPieces]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isManualMode) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rotationHandle = findRotationHandleAtPoint(x, y);
      if (rotationHandle) {
        setSelectedPanelId(rotationHandle.id);
        setIsRotating(true);
        const angle = Math.atan2(y - rotationHandle.y, x - rotationHandle.x);
        setRotationStart((angle * 180) / Math.PI - rotationHandle.rotation);
        return;
      }

      const clickedPanel = findPanelAtPoint(x, y);
      if (clickedPanel) {
        setSelectedPanelId(clickedPanel.id);
        setIsDragging(true);
        setDragOffset({
          x: x - clickedPanel.x,
          y: y - clickedPanel.y,
        });
      }
    },
    [
      isManualMode,
      findRotationHandleAtPoint,
      findPanelAtPoint,
      setSelectedPanelId,
      setIsDragging,
      setDragOffset,
      setIsRotating,
      setRotationStart,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging && !isRotating) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isRotating) {
        setManualPieces((prev) =>
          prev.map((panel) => {
            if (panel.id === selectedPanelId) {
              const angle = Math.atan2(y - panel.y, x - panel.x);
              let newRotation = ((angle * 180) / Math.PI - rotationStart) % 360;

              if (!e.shiftKey) {
                newRotation = Math.round(newRotation / 15) * 15;
              }

              return {
                ...panel,
                rotation: newRotation,
              };
            }
            return panel;
          })
        );
      } else if (isDragging) {
        setManualPieces((prev) =>
          prev.map((panel) => {
            if (panel.id === selectedPanelId) {
              return {
                ...panel,
                x: x - dragOffset.x,
                y: y - dragOffset.y,
              };
            }
            return panel;
          })
        );
      }
    },
    [
      isDragging,
      isRotating,
      dragOffset,
      selectedPanelId,
      rotationStart,
      setManualPieces,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsRotating(false);
    setSelectedPanelId(null);
    setDragOffset({ x: 0, y: 0 });
    setRotationStart(0);
  }, [
    setIsDragging,
    setIsRotating,
    setSelectedPanelId,
    setDragOffset,
    setRotationStart,
  ]);

  const renderManualCanvas = () => {
    return (
      <div
        className="border border-amarillo rounded bg-black overflow-visible relative"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <div className="absolute top-2 left-2 text-amarillo font-agency text-xs bg-black px-2 py-1 rounded border border-amarillo">
          MANUAL MODE
        </div>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`w-full h-full ${
            isRotating
              ? "cursor-grab"
              : isDragging
              ? "cursor-grabbing"
              : "cursor-move"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-white font-agency text-xs">
            {t("zero_waste_pattern_nesting")}
          </div>
          <div className="flex gap-2 pr-4">
            <button
              onClick={handleNestClick}
              disabled={isNesting || isSparrowRunning || isManualMode}
              className={`lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul ${
                isNesting || isSparrowRunning || isManualMode
                  ? "bg-viol text-white/50 cursor-not-allowed"
                  : "bg-white text-black hover:opacity-80"
              }`}
              style={{ transform: "skewX(-15deg)" }}
            >
              <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                {isNesting ? t("nesting") : t("nest")}
              </span>
            </button>
            {(isNesting || isSparrowRunning) && (
              <button
                onClick={handleCancelNesting}
                className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80"
                style={{ transform: "skewX(-15deg)" }}
              >
                <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                  {t("cancel")}
                </span>
              </button>
            )}
            {liveSvgContent && !isNesting && !isSparrowRunning && (
              <>
                <button
                  onClick={() => setIsManualMode(!isManualMode)}
                  className={`lowercase px-2 py-1 text-xs font-count transition-all text-black rounded-sm border-2 border-azul ${
                    isManualMode
                      ? "bg-white"
                      : "bg-crema hover:opacity-80"
                  }`}
                  style={{ transform: "skewX(-15deg)" }}
                >
                  <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                    {isManualMode ? t("auto_mode") : t("manual_nest")}
                  </span>
                </button>
                {isManualMode && (
                  <button
                    onClick={resetToAutoLayout}
                    className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 text-black border-azul bg-white hover:opacity-80"
                    style={{ transform: "skewX(-15deg)" }}
                  >
                    <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                      {t("reset")}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-black border border-rosa rounded text-white font-agency text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4 pl-1">
          <button
            onClick={() => savePatternState()}
            className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80"
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {t("save")}
            </span>
          </button>
          <button
            onClick={() => setShowExportDialog(true)}
            disabled={!liveSvgContent && !isManualMode}
            className={`lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul ${
              !liveSvgContent && !isManualMode
                ? "bg-viol text-white/50 cursor-not-allowed"
                : "bg-white text-black hover:opacity-80"
            }`}
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {t("export_to_print")}
            </span>
          </button>
        </div>

        {sparrowStats && (
          <div className="mb-4 p-3 bg-black border border-crema rounded">
            <div className="text-white font-agency text-xs mb-2">
              {t("optimization_stats")}
            </div>
            <div className="text-crema font-agency text-xs space-y-1">
              <div>{t("phase")}: {sparrowStats.phase}</div>
              <div>{t("iteration")}: {sparrowStats.iteration}</div>
              <div>
                {t("utilization")}: {(sparrowStats.utilization * 100).toFixed(1)}%
              </div>
              <div>
                {t("waste")}: {((1 - sparrowStats.utilization) * 100).toFixed(1)}%
              </div>
              <div>
                {t("strip_size")}: {sparrowStats.width} × {sparrowStats.height}
              </div>
              <div>{t("density")}: {sparrowStats.density}</div>
            </div>
          </div>
        )}

        <div className="bg-black rounded p-4 min-h-[400px]">
          {liveSvgContent ? (
            isManualMode ? (
              renderManualCanvas()
            ) : (
              <div
                className="border border-crema rounded bg-black overflow-visible relative sparrow-svg-container"
                style={{ width: canvasWidth, height: canvasHeight }}
              >
                <svg
                  ref={svgRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  viewBox={(() => {
                    const viewBoxMatch =
                      liveSvgContent.match(/viewBox="([^"]+)"/);
                    return viewBoxMatch ? viewBoxMatch[1] : "0 0 100 100";
                  })()}
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      return liveSvgContent
                        .replace(/<text[^>]*>.*?<\/text>/gs, "")
                        .replace(/<svg[^>]*>/, "")
                        .replace(/<\/svg>$/, "")
                        .replace(/(<path[^>]*stroke-dasharray[^>]*stroke-opacity=")[^"]*("[^>]*\/>)/g,
  '$10$2');
                    })(),
                  }}
                />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-96 border border-dashed border-crema text-black font-agency text-xs rounded">
              <div className="text-center">
                {isSparrowRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <div className="mb-2">
                      {t("optimizing_pattern_layout")}
                    </div>
                    <div className="text-black font-agency text-xs">
                      {t("sparrow_algorithm_message")}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2">
                      {t("ready_for_pattern_nesting")}
                    </div>
                    <div >
                      {t("select_pattern_pieces_nest")}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="hidden"
        />
      </div>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        svgElement={generateExportSvg()}
        viewportPx={{ width: canvasWidth, height: canvasHeight }}
        patternPieces={selectedPieces}
        liveSvgContent={liveSvgContent || undefined}
        isManualMode={isManualMode}
        manualPieces={manualPieces}
      />
    </div>
  );
};