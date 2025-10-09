import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import { INFURA_GATEWAY } from "../../../lib/constants";
import useChildren from "../hooks/useChildren";
import HoldButton from "./HoldButton";
import { useSynthCanvas } from "../hooks/useSynthCanvas";
import { SynthCanvasProps } from "../types/synth.types";

export default function SynthCanvas({ onCanvasSave }: SynthCanvasProps) {
  const { t } = useTranslation();
  const { selectedLayer, selectedPatternChild, setSelectedPatternChild } =
    useApp();
  const {
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
    undo,
    redo,
    undoHistory,
    redoHistory,
    adjustImageWidth,
    loadImageToCanvas,
    saveCanvasToHistory,
    selectedImageElement,
    adjustImageHeight,
    moveImage,
    rotateImage,
    deleteImage,
    setElements,
    loadFromHistory,
  } = useSynthCanvas({ onCanvasSave });
  const { getVisibleChildren, navigateChild } = useChildren();
  useEffect(() => {
    try {
      if (setElements && loadFromHistory) {
        (window as any).canvasSetElements = setElements;
        (window as any).canvasLoadFromHistory = loadFromHistory;
      }
    } catch (error) {}
  }, [setElements, loadFromHistory]);
  if (!selectedLayer) {
    return (
      <div className="w-full h-full flex items-center justify-center border border-crema rounded">
        <p className="text-crema font-agency text-sm">{t("no_layer_selected")}</p>
      </div>
    );
  }
  return (
    <div className="relative w-full h-full flex flex-col gap-3">
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div
            onClick={() => setTool("pencil")}
            className={`px-3 py-1.5 rounded-sm font-agency text-xs cursor-pointer ${
              tool === "pencil"
                ? "bg-white text-black"
                : "bg-crema text-black hover:opacity-70"
            }`}
          >
            {t("brush")}
          </div>
          <div
            onClick={() => setTool("erase")}
            className={`px-3 py-1.5 rounded-sm font-agency text-xs cursor-pointer ${
              tool === "erase"
                ? "bg-white text-black"
                : "bg-crema text-black hover:opacity-70"
            }`}
          >
            {t("eraser")}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black font-agency text-xs">{t("size")}:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={brushWidth}
              onChange={(e) => setBrushWidth(Number(e.target.value))}
              className="w-16"
            />
            <span className="text-black font-agency text-xs w-6">
              {brushWidth}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black font-agency text-xs">{t("color")}:</span>
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="w-6 h-5 rounded border-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            onClick={recenterCanvas}
            className="px-3 py-1.5 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs cursor-pointer"
          >
            {t("recenter")}
          </div>
          <div
            onClick={saveCanvasToHistory}
            className="px-3 py-1.5 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs cursor-pointer"
          >
            {t("save")}
          </div>
          <div
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                  loadImageToCanvas(file);
                }
              };
              input.click();
            }}
            className="px-3 py-1.5 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs cursor-pointer"
          >
            {t("load_image")}
          </div>
          <div
            onClick={clearCanvas}
            className="px-3 py-1.5 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs cursor-pointer"
          >
            {t("clear")}
          </div>
          <div
            onClick={() => undoHistory.length > 0 && undo()}
            className={`px-3 py-1.5 text-black rounded-sm font-agency text-xs cursor-pointer ${
              undoHistory.length === 0
                ? "bg-crema/40 cursor-not-allowed"
                : "bg-crema hover:opacity-70"
            }`}
            title= {t("undo")}
          >
            {t("undo")}
          </div>
          <div
            onClick={() => redoHistory.length > 0 && redo()}
            className={`px-3 py-1.5 text-black rounded-sm font-agency text-xs cursor-pointer ${
              redoHistory.length === 0
                ? "bg-crema/40 cursor-not-allowed"
                : "bg-crema hover:opacity-70"
            }`}
            title={t("redo")}
          >
            {t("redo")}
          </div>
        </div>
        {selectedImageElement && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-crema">
            <span className="text-black font-agency text-xs">{t("size")}:</span>
            <HoldButton
              onAction={() => {
                if (adjustImageWidth) adjustImageWidth(-5);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs"
            >
              W-
            </HoldButton>
            <HoldButton
              onAction={() => {
                if (adjustImageWidth) adjustImageWidth(5);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs"
            >
              W+
            </HoldButton>
            <HoldButton
              onAction={() => {
                if (adjustImageHeight) adjustImageHeight(-5);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs"
            >
              H-
            </HoldButton>
            <HoldButton
              onAction={() => {
                if (adjustImageHeight) adjustImageHeight(5);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs"
            >
              H+
            </HoldButton>
            <span className="text-black font-agency text-xs ml-2">{t("move")}:</span>
            <HoldButton
              onAction={() => {
                if (moveImage) moveImage(0, -3);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs"
            >
              ↑
            </HoldButton>
            <HoldButton
              onAction={() => {
                if (moveImage) moveImage(0, 3);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs"
            >
              ↓
            </HoldButton>
            <HoldButton
              onAction={() => {
                if (moveImage) moveImage(-3, 0);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs"
            >
              ←
            </HoldButton>
            <HoldButton
              onAction={() => {
                if (moveImage) moveImage(3, 0);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs"
            >
              →
            </HoldButton>
            <span className="text-black font-agency text-xs ml-2">{t("rotate")}:</span>
            <div
              onClick={() => {
                if (rotateImage) rotateImage(-15);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs cursor-pointer"
            >
              ↶
            </div>
            <div
              onClick={() => {
                if (rotateImage) rotateImage(15);
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs cursor-pointer"
            >
              ↷
            </div>
            <span className="text-black font-agency text-xs ml-2">{t("delete")}:</span>
            <div
              onClick={() => {
                if (deleteImage) deleteImage();
              }}
              className="px-2 py-1 bg-crema hover:opacity-70 text-black rounded-sm font-agency text-xs cursor-pointer"
            >
              ×
            </div>{" "}
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className="h-full w-full rounded border border-crema relative overflow-hidden bg-black"
      >
        <canvas
          ref={canvasRef}
          id="synth-canvas-id"
          className={`absolute inset-0 ${
            tool === "pencil" ? "cursor-crosshair" : "cursor-cell"
          }`}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div className="w-full flex justify-center items-center gap-3 relative h-24 flex-row">
        <div className="relative w-full h-full flex flex-row items-center justify-start">
          <div className="relative w-fit h-full items-center justify-start flex flex-row gap-3">
            {getVisibleChildren().map((child, index) => (
              <div
                key={index}
                className={`relative w-20 h-full flex flex-row items-center justify-center gap-2 border hover:opacity-70 rounded cursor-pointer bg-black ${
                  selectedPatternChild?.uri === child?.uri
                    ? "border-rosa"
                    : "border-crema"
                }`}
                onClick={() => setSelectedPatternChild(child)}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={`${INFURA_GATEWAY}/ipfs/${
                      child?.child.metadata.image?.split("ipfs://")[1]
                    }`}
                    className="object-contain"
                    draggable={false}
                    alt="pattern"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative w-fit h-full flex flex-row items-center justify-center gap-1.5">
          <div
            className="relative w-5 h-5 flex items-center justify-center cursor-pointer active:scale-95 rotate-180"
            onClick={() => navigateChild("prev")}
          >
            <img
              src="/images/arrow.png"
              className="w-full h-full object-contain"
              draggable={false}
              alt="previous"
            />
          </div>
          <div
            className="relative w-5 h-5 flex items-center justify-center cursor-pointer active:scale-95"
            onClick={() => navigateChild("next")}
          >
            <img
              src="/images/arrow.png"
              className="w-full h-full object-contain"
              draggable={false}
              alt="next"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
