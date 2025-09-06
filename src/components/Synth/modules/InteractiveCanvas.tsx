import { InteractiveCanvasProps, ShowCanvasProps } from "../types/synth.types";
import useInteractive from "../hooks/useInteractive";
import { useApp } from "../../../context/AppContext";
import { getCurrentTemplate } from "../utils/templateHelpers";

export default function InteractiveCanvas({
  templateChild,
  size = "small",
  onChildClick,
}: InteractiveCanvasProps) {
  const { canFlip, flipCanvas, selectedLayer, isBackSide } = useApp();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const {
    getImageSrc,
    convertCoordinatesToPixels,
    baseTemplateChild,
    imageRef,
    setCanvasWidth,
    imageDimensions,
    setImageDimensions,
    canvasContainerRef,
    canvasWidth,
    setIsCollapsed,
    containerRef,
    handleMouseDown,
    isCollapsed,
    position,
    isDragging,
    parsedSvgCache,
    createReactElement,
    onImageLoad,
    imageLoaded,
  } = useInteractive(templateChild);

  const isLarge = size === "large";

  if (isLarge) {
    return (
      <div className="flex flex-col justify-center items-center gap-4">
        {canFlip && (
          <button
            onClick={flipCanvas}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded transition-colors"
          >
            {isBackSide ? "Show Front" : "Show Back"}
          </button>
        )}
        <ShowCanvas
          key={`${isBackSide ? "back" : "front"}-${imageLoaded}-${templateChild?.uri || 'none'}`}
          canvasWidth={canvasWidth}
          templateChild={templateChild}
          size={size}
          getImageSrc={getImageSrc}
          currentTemplate={currentTemplate}
          onChildClick={onChildClick}
          convertCoordinatesToPixels={convertCoordinatesToPixels}
          baseTemplateChild={baseTemplateChild}
          imageRef={imageRef}
          setCanvasWidth={setCanvasWidth}
          imageDimensions={imageDimensions}
          setImageDimensions={setImageDimensions}
          canvasContainerRef={canvasContainerRef}
          parsedSvgCache={parsedSvgCache}
          createReactElement={createReactElement}
          onImageLoad={onImageLoad}
        />
      </div>
    );
  }
  return (
    <div
      ref={containerRef}
      className="absolute z-50 flex flex-col items-center"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: "none",
        width: canvasWidth ? `${canvasWidth}px` : "auto",
        zIndex: 50,
      }}
    >
      <div
        className={`w-full h-6 bg-ama/20 rounded-t-lg flex items-center justify-center ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-ama rounded-full"></div>
          <div className="w-1 h-1 bg-ama rounded-full"></div>
          <div className="w-1 h-1 bg-ama rounded-full"></div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsCollapsed(!isCollapsed);
        }}
        className="w-full py-1 bg-ama hover:bg-ama/80 text-black font-bold text-xs transition-colors"
      >
        {isCollapsed ? "Show Canvas" : "Hide Canvas"}
      </button>
      {canFlip && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            flipCanvas();
          }}
          className="w-full py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition-colors"
        >
          {isBackSide ? "Show Front" : "Show Back"}
        </button>
      )}
      <div style={{ display: isCollapsed ? "none" : "block" }}>
        <ShowCanvas
          key={`${isBackSide ? "back" : "front"}-${imageLoaded}-${templateChild?.uri || 'none'}`}
          canvasWidth={canvasWidth}
          templateChild={templateChild}
          size={size}
          getImageSrc={getImageSrc}
          currentTemplate={currentTemplate}
          onChildClick={onChildClick}
          convertCoordinatesToPixels={convertCoordinatesToPixels}
          baseTemplateChild={baseTemplateChild}
          imageRef={imageRef}
          setCanvasWidth={setCanvasWidth}
          imageDimensions={imageDimensions}
          setImageDimensions={setImageDimensions}
          canvasContainerRef={canvasContainerRef}
          parsedSvgCache={parsedSvgCache}
          createReactElement={createReactElement}
          onImageLoad={onImageLoad}
        />
      </div>
    </div>
  );
}

const ShowCanvas = ({
  size,
  convertCoordinatesToPixels,
  baseTemplateChild,
  imageRef,
  setCanvasWidth,
  imageDimensions,
  setImageDimensions,
  canvasContainerRef,
  parsedSvgCache,
  createReactElement,
  getImageSrc,
  currentTemplate,
  canvasWidth,
  templateChild,
  onChildClick,
  onImageLoad,
}: ShowCanvasProps & { onImageLoad: () => void }) => {
  const imageSrc = getImageSrc(baseTemplateChild?.child?.metadata?.image || "");
  


  const getHardcodedValues = (childUri: string) => {
    const hardcodedMap: Record<
      string,
      { x: number; y: number; scale?: number; flip?: number; rotation?: number }
    > = {
     "ipfs://Qmc1hgGG3sCKmx88N3yvFmd1aMf3ph6hTnpLLd7qvMuFZE": {
    scale: 0.7,
            x: 1.5,
            y: 1.6,
     }
    };
    return hardcodedMap[childUri] || null;
  };

  return (
    <div
      ref={size == "small" ? canvasContainerRef : null}
      className={`relative bg-gray-800 ${size == "large" ? "block" : ""}`}
    >
      <img
        ref={imageRef}
        src={imageSrc}
        key={imageSrc}
        alt="Base template"
        draggable={false}
        onLoad={() => {
          if (canvasContainerRef.current && !canvasWidth) {
            const width = canvasContainerRef.current.offsetWidth;
            if (width > 0) {
              setCanvasWidth(width);
            }
          }
          onImageLoad();
        }}
        style={{
          height: "auto",
          display: "block",
        }}
      />
      {(templateChild?.childReferences || [])
        .filter(
          (child) => 
       child.child.metadata.tags.includes("zone")
        )
        .map((child, index: number) => {
         
          const hardcodedValues = getHardcodedValues(
            child.child.metadata.image
          );
          const finalX = hardcodedValues?.x ?? child.metadata.x;
          const finalY = hardcodedValues?.y ?? child.metadata.y;
          const finalScale = hardcodedValues?.scale ?? child.metadata.scale;
          const finalFlip = hardcodedValues?.flip ?? child.metadata.flip;
          const finalRotation =
            hardcodedValues?.rotation ?? child.metadata.rotation;

          const pixelPosition = convertCoordinatesToPixels(
            finalX,
            finalY,
            finalScale,
            finalFlip,
            finalRotation
          );

          if (!pixelPosition) {
            return null;
          }

          const dims = imageDimensions[child.uri];
          if (!dims) {
            return (
              <img
                key={`${child.uri}-${index}`}
                src={getImageSrc(child.child.metadata.image)}
                alt={`Pattern ${index}`}
                className="absolute transition-opacity"
                draggable={false}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;

                  setImageDimensions((prev) => ({
                    ...prev,
                    [child.uri]: {
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    },
                  }));
                }}
                style={{
                  left: `${pixelPosition.left}px`,
                  top: `${pixelPosition.top}px`,
                  width: "auto",
                  height: "auto",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
            );
          }

          const w = dims.width;
          const h = dims.height;
          const sx = (pixelPosition.scale || 1) * (pixelPosition.flip ? -1 : 1);
          const sy = pixelPosition.scale || 1;
          const theta = ((pixelPosition.rotation || 0) * Math.PI) / 180;

          const cos = Math.cos(theta);
          const sin = Math.sin(theta);
          const a = cos * sx;
          const b = sin * sx;
          const c = -sin * sy;
          const d = cos * sy;

          const corners = [
            { x: 0, y: 0 },
            { x: w, y: 0 },
            { x: 0, y: h },
            { x: w, y: h },
          ].map((p) => ({
            x: a * p.x + c * p.y,
            y: b * p.x + d * p.y,
          }));

          const minX = Math.min(...corners.map((p) => p.x));
          const minY = Math.min(...corners.map((p) => p.y));

          const preTranslateX = -minX;
          const preTranslateY = -minY;

          const transform = `translate(${preTranslateX}px, ${preTranslateY}px) rotate(${
            pixelPosition.rotation || 0
          }deg) scale(${sx}, ${sy})`;

          const isSavedCanvas = child.child.metadata.image.startsWith("data:");
          let originalImageUri;

          if (isSavedCanvas && child.child) {
            originalImageUri = currentTemplate?.childReferences?.find(
              (chi) =>
                chi.uri == child.uri &&
                chi.childId == child.childId &&
                chi.childContract == child.childContract
            )?.child.metadata.image;
          } else {
            originalImageUri = child.child.metadata.image;
          }
          const parsedSvg = originalImageUri
            ? parsedSvgCache[originalImageUri]
            : null;
          if (parsedSvg) {
            const svgChildren = parsedSvg.children.map(
              (childEl: any, childIndex: number) =>
                createReactElement(
                  childEl,
                  `${child.uri}-${index}-${childIndex}`,
                  onChildClick,
                  child.uri
                )
            );
            return (
              <div key={`${child.uri}-${index}-container`}>
                {child.child.metadata.image.startsWith("data:") && (
                  <img
                    key={`${child.uri}-${index}-data`}
                    src={getImageSrc(child.child.metadata.image)}
                    alt={`Pattern ${index}`}
                    width={w}
                    height={h}
                    className="absolute"
                    style={{
                      left: `${pixelPosition.left}px`,
                      top: `${pixelPosition.top}px`,
                      transform,
                      transformOrigin: "0 0",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />
                )}
                <svg
                  key={`${child.uri}-${index}`}
                  {...parsedSvg.props}
                  className="absolute transition-opacity"
                  style={{
                    left: `${pixelPosition.left}px`,
                    top: `${pixelPosition.top}px`,
                    transform,
                    transformOrigin: "0 0",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  {svgChildren}
                </svg>
              </div>
            );
          }
        })}
    </div>
  );
};
