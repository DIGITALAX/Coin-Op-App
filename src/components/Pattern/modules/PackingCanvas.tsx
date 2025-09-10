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
        className="border border-yellow-500 rounded bg-white/10 overflow-visible relative"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <div className="absolute top-2 left-2 text-yellow-500 font-mana text-xs bg-black px-2 py-1 rounded">
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
          <div className="text-white font-mana text-sm">
            {t("zero_waste_pattern_nesting")}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNestClick}
              disabled={isNesting || isSparrowRunning || isManualMode}
              className={`px-4 py-2 rounded font-mana text-xs ${
                isNesting || isSparrowRunning || isManualMode
                  ? "bg-gris/40 text-white/50 cursor-not-allowed"
                  : "bg-ama hover:opacity-70 text-black cursor-pointer"
              }`}
            >
              {isNesting ? t("nesting") : t("nest")}
            </button>
            {(isNesting || isSparrowRunning) && (
              <button
                onClick={handleCancelNesting}
                className="px-4 py-2 bg-red-500 hover:opacity-70 text-white rounded font-mana text-xs cursor-pointer"
              >
                {t("cancel")}
              </button>
            )}
            {liveSvgContent && !isNesting && !isSparrowRunning && (
              <>
                <button
                  onClick={() => setIsManualMode(!isManualMode)}
                  className={`px-4 py-2 rounded font-mana text-xs cursor-pointer ${
                    isManualMode
                      ? "bg-yellow-500 text-black"
                      : "bg-gris hover:opacity-70 text-white"
                  }`}
                >
                  {isManualMode ? t("auto_mode") : t("manual_nest")}
                </button>
                {isManualMode && (
                  <button
                    onClick={resetToAutoLayout}
                    className="px-4 py-2 bg-red-500 hover:opacity-70 text-white rounded font-mana text-xs cursor-pointer"
                  >
                    {t("reset")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 font-mana text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => savePatternState()}
            className="px-4 py-2 bg-verde hover:opacity-70 text-black rounded font-mana text-xs cursor-pointer"
          >
            {t("save")}
          </button>
          <button
            onClick={() => setShowExportDialog(true)}
            disabled={!liveSvgContent && !isManualMode}
            className={`px-4 py-2 rounded font-mana text-xs cursor-pointer ${
              !liveSvgContent && !isManualMode
                ? "bg-gris/40 text-white/50 cursor-not-allowed"
                : "bg-blue-500 hover:opacity-70 text-white"
            }`}
          >
            {t("export_to_print")}
          </button>
        </div>

        {sparrowStats && (
          <div className="mb-4 p-3 bg-verde/20 border border-verde/50 rounded">
            <div className="text-verde font-mana text-xs mb-2">
              {t("optimization_stats")}
            </div>
            <div className="text-white/70 font-mana text-xxxs space-y-1">
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

        <div className="bg-gray-900 rounded p-4 min-h-[400px]">
          {liveSvgContent ? (
            isManualMode ? (
              renderManualCanvas()
            ) : (
              <div
                className="border border-red-500 rounded bg-white/10 overflow-visible relative sparrow-svg-container"
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
            <div className="flex items-center justify-center h-96 border border-dashed border-white/20 rounded">
              <div className="text-center">
                {isSparrowRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ama mx-auto mb-4"></div>
                    <div className="text-ama font-mana text-sm mb-2">
                      {t("optimizing_pattern_layout")}
                    </div>
                    <div className="text-white/50 font-mana text-xxxs">
                      {t("sparrow_algorithm_message")}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white/50 font-mana text-sm mb-2">
                      {t("ready_for_pattern_nesting")}
                    </div>
                    <div className="text-white/30 font-mana text-xxxs">
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
      />
    </div>
  );
};