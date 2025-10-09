import { InteractiveCanvasProps, ShowCanvasProps } from "../types/synth.types";
import { useTranslation } from "react-i18next";
import useInteractive from "../hooks/useInteractive";
import { useApp } from "../../../context/AppContext";
import { getCurrentTemplate } from "../utils/templateHelpers";
import { useFileStorage } from "../../Activity/hooks/useFileStorage";
import { useState, useEffect } from "react";

export default function InteractiveCanvas({
  templateChild,
  onChildClick,
}: InteractiveCanvasProps) {
  const { t } = useTranslation();
  const { canFlip, flipCanvas, selectedLayer, isBackSide } = useApp();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { getBinaryFileUrl } = useFileStorage();
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
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

  useEffect(() => {
    const loadImageUrls = async () => {
      if (!templateChild?.childReferences) return;

      const newImageUrls: Record<string, string> = {};

      for (const child of templateChild.childReferences) {
        const imageRef = child.child?.metadata?.image;
        if (imageRef && !imageRef.startsWith("data:") && !imageUrls[imageRef]) {
          try {
            const url = await getBinaryFileUrl(imageRef);
            newImageUrls[imageRef] = url;
          } catch (error) {}
        }
      }

      if (Object.keys(newImageUrls).length > 0) {
        setImageUrls((prev) => ({ ...prev, ...newImageUrls }));
      }
    };

    loadImageUrls();
  }, [templateChild, getBinaryFileUrl]);

  return (
    <div
      ref={containerRef}
      className="fixed z-50 flex flex-col items-center bg-white border border-crema rounded overflow-hidden shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: "none",
        width: canvasWidth ? `${canvasWidth}px` : "auto",
        zIndex: 50,
      }}
    >
      <div
        className={`w-full h-5 bg-crema border-b border-crema flex items-center justify-center ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-white rounded-full"></div>
          <div className="w-1 h-1 bg-white rounded-full"></div>
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
      </div>
      <div className="relative w-full h-fit flex flex-row border-b border-crema">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="relative flex-1 py-1 bg-white hover:bg-crema text-black font-agency text-xs transition-colors"
        >
          {isCollapsed ? t("show_canvas") : t("hide_canvas")}
        </button>
        {canFlip && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              flipCanvas();
            }}
            className="relative flex-1 py-1 bg-white hover:bg-crema border-l border-crema text-black font-agency text-xs transition-colors"
          >
            {isBackSide ? t("show_front") : t("show_back")}
          </button>
        )}
      </div>
      <div style={{ display: isCollapsed ? "none" : "block" }}>
        <ShowCanvas
          key={`${isBackSide ? "back" : "front"}-${imageLoaded}-${
            templateChild?.uri || "none"
          }`}
          canvasWidth={canvasWidth}
          templateChild={templateChild}
          imageUrls={imageUrls}
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
  imageUrls,
  onImageLoad,
}: ShowCanvasProps & { onImageLoad: () => void }) => {
  const { t } = useTranslation();
  const imageSrc = getImageSrc(baseTemplateChild?.child?.metadata?.image || "");

  const getImageUrl = (imageRef: string): string => {
    if (imageRef.startsWith("data:")) {
      return imageRef;
    }
    return imageUrls[imageRef] || "";
  };

  return (
    <div
      ref={canvasContainerRef}
      className={`relative bg-black`}
    >
      <img
        ref={imageRef}
        src={imageSrc}
        key={imageSrc}
        alt={t("base_template")}
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
        .filter((child) => child.child.metadata?.tags?.includes("zone"))
        .map((child, index: number) => {
          if (!child.metadata) {
            return null;
          }
          const pixelPosition = convertCoordinatesToPixels(
            child.metadata.x,
            child.metadata.y,
            child.metadata.scale,
            child.metadata.flip,
            child.metadata.rotation
          );

          if (!pixelPosition) {
            return null;
          }

          const isSavedCanvas =
            child.child.metadata.image &&
            (child.child.metadata.image.startsWith("data:") ||
              !child.child.metadata.image.startsWith("http"));
          let originalImageUri;

          if (isSavedCanvas && child.child) {
            const originalChild = currentTemplate?.childReferences?.find(
              (chi) =>
                chi.uri == child.uri &&
                chi.childId == child.childId &&
                chi.childContract == child.childContract
            );
            originalImageUri = originalChild?.child.metadata.image;
          } else {
            originalImageUri = child.child.metadata.image;
          }

          const dims = imageDimensions[child.uri];
          if (!dims) {
            return (
              <img
                key={`${child.uri}-${index}-${canvasWidth}`}
                src={getImageSrc(originalImageUri!)}
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
              <div key={`${child.uri}-${index}-container-${canvasWidth}`}>
                {child.child.metadata.image &&
                  getImageUrl(child.child.metadata.image) && (
                    <img
                      key={`${child.uri}-${index}-data`}
                      src={getImageSrc(getImageUrl(child.child.metadata.image))}
                      alt={`Pattern ${index}`}
                      width={w}
                      height={h}
                      draggable={false}
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
                  key={`${child.uri}-${index}-${canvasWidth}`}
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
