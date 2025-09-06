import { FunctionComponent } from "react";
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
    parseSparrowSVG
  } = usePackingCanvas(selectedPieces, selectedSize);

  const renderManualCanvas = () => {
    if (!liveSvgContent) return null;

    const sparrowPatterns = parseSparrowSVG(liveSvgContent);
    if (sparrowPatterns.length === 0) return null;

    let bboxWidth = 48.1;
    let bboxHeight = 94.5;
    let xMin = 0.0;
    let yMin = -4.5;

    const viewBoxMatch = liveSvgContent.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const viewBoxValues = viewBoxMatch[1].split(/[\s,]+/).map(parseFloat);
      bboxWidth = viewBoxValues[2];
      bboxHeight = viewBoxValues[3];
    }

    const targetWidth = canvasWidth - 40;
    const targetHeight = canvasHeight - 40;
    const scale = Math.min(targetWidth / bboxWidth, targetHeight / bboxHeight);
    const margin = 20;

    return (
      <div className="relative bg-gray-800 rounded border border-yellow-500 border-4">
        <div className="absolute top-2 left-2 text-yellow-500 font-mana text-xs bg-black px-2 py-1 rounded">
          MANUAL MODE
        </div>
        <svg width={canvasWidth} height={canvasHeight}>
          {sparrowPatterns.map((pattern, index) => {
            const scaledX = (pattern.x - xMin) * scale + margin;
            const scaledY = (pattern.y - yMin) * scale + margin;

            return (
              <g
                key={`${pattern.id}-${index}`}
                transform={`translate(${scaledX}, ${scaledY}) rotate(${pattern.rotation}) scale(${scale})`}
                style={{ cursor: 'move' }}
              >
                <path
                  d={pattern.pathData}
                  fill={pattern.color}
                  fillOpacity={0.7}
                />
              </g>
            );
          })}
        </svg>
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
              disabled={isNesting || isSparrowRunning || selectedPieces.length === 0}
              className={`px-4 py-2 rounded font-mana text-xs ${
                isNesting || isSparrowRunning || selectedPieces.length === 0
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
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 font-mana text-xs">
            {error}
          </div>
        )}

        {sparrowStats && (
          <div className="mb-4 p-3 bg-verde/20 border border-verde/50 rounded">
            <div className="text-verde font-mana text-xs mb-2">
              OPTIMIZATION STATS
            </div>
            <div className="text-white/70 font-mana text-xxxs space-y-1">
              <div>Phase: {sparrowStats.phase}</div>
              <div>Iteration: {sparrowStats.iteration}</div>
              <div>Utilization: {(sparrowStats.utilization * 100).toFixed(1)}%</div>
              <div>Waste: {((1 - sparrowStats.utilization) * 100).toFixed(1)}%</div>
              <div>Strip Size: {sparrowStats.width} × {sparrowStats.height}</div>
              <div>Density: {sparrowStats.density}</div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded p-4 min-h-[400px]">
          {liveSvgContent ? (
            isManualMode ? (
              renderManualCanvas()
            ) : (
              <div className="border border-red-500 rounded bg-white/10 overflow-visible relative sparrow-svg-container"
                   style={{ width: canvasWidth, height: canvasHeight }}>
                <div className="w-full h-full"
                     dangerouslySetInnerHTML={{ 
                       __html: (() => {
                         const viewBoxMatch = liveSvgContent.match(/viewBox="([^"]+)"/);
                         const originalViewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 100 100";
                         return liveSvgContent
                           .replace(/<text[^>]*>.*?<\/text>/gs, '')
                           .replace(/<svg[^>]*>/, 
                             `<svg width="${canvasWidth}" height="${canvasHeight}" viewBox="${originalViewBox}" preserveAspectRatio="xMidYMid meet">`);
                       })()
                     }}/>
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