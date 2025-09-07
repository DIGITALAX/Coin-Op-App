import { FunctionComponent, useCallback, useEffect } from "react";
import { usePackingCanvas } from "../hooks/usePackingCanvas";
import { PackingCanvasProps } from "../types/pattern.types";

export const PackingCanvas: FunctionComponent<PackingCanvasProps> = ({
  selectedPieces,
  selectedSize,
}) => {
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
  } = usePackingCanvas(selectedPieces, selectedSize);

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
            ZERO-WASTE PATTERN NESTING
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNestClick}
              disabled={
                isNesting ||
                isSparrowRunning ||
                selectedPieces.length === 0 ||
                isManualMode
              }
              className={`px-4 py-2 rounded font-mana text-xs ${
                isNesting ||
                isSparrowRunning ||
                selectedPieces.length === 0 ||
                isManualMode
                  ? "bg-gris/40 text-white/50 cursor-not-allowed"
                  : "bg-ama hover:opacity-70 text-black cursor-pointer"
              }`}
            >
              {isNesting ? "NESTING..." : "NEST"}
            </button>
            {(isNesting || isSparrowRunning) && (
              <button
                onClick={handleCancelNesting}
                className="px-4 py-2 bg-red-500 hover:opacity-70 text-white rounded font-mana text-xs cursor-pointer"
              >
                CANCEL
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
                  {isManualMode ? "AUTO MODE" : "MANUAL NEST"}
                </button>
                {isManualMode && (
                  <button
                    onClick={resetToAutoLayout}
                    className="px-4 py-2 bg-red-500 hover:opacity-70 text-white rounded font-mana text-xs cursor-pointer"
                  >
                    RESET TO AUTO
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

        <button
          onClick={() => savePatternState()}
          className="mb-4 px-4 py-2 bg-verde hover:opacity-70 text-black rounded font-mana text-xs cursor-pointer"
        >
          SAVE
        </button>

        {sparrowStats && (
          <div className="mb-4 p-3 bg-verde/20 border border-verde/50 rounded">
            <div className="text-verde font-mana text-xs mb-2">
              OPTIMIZATION STATS
            </div>
            <div className="text-white/70 font-mana text-xxxs space-y-1">
              <div>Phase: {sparrowStats.phase}</div>
              <div>Iteration: {sparrowStats.iteration}</div>
              <div>
                Utilization: {(sparrowStats.utilization * 100).toFixed(1)}%
              </div>
              <div>
                Waste: {((1 - sparrowStats.utilization) * 100).toFixed(1)}%
              </div>
              <div>
                Strip Size: {sparrowStats.width} × {sparrowStats.height}
              </div>
              <div>Density: {sparrowStats.density}</div>
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
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      const viewBoxMatch =
                        liveSvgContent.match(/viewBox="([^"]+)"/);
                      const originalViewBox = viewBoxMatch
                        ? viewBoxMatch[1]
                        : "0 0 100 100";
                      return liveSvgContent
                        .replace(/<text[^>]*>.*?<\/text>/gs, "")
                        .replace(
                          /<svg[^>]*>/,
                          `<svg width="${canvasWidth}" height="${canvasHeight}" viewBox="${originalViewBox}" preserveAspectRatio="xMidYMid meet">`
                        );
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
                      Optimizing Pattern Layout
                    </div>
                    <div className="text-white/50 font-mana text-xxxs">
                      Sparrow algorithm finding best arrangement...
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white/50 font-mana text-sm mb-2">
                      Ready for Pattern Nesting
                    </div>
                    <div className="text-white/30 font-mana text-xxxs">
                      Select pattern pieces and click NEST to begin
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
    </div>
  );
};
