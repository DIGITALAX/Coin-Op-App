import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import {
  ViewportPx,
  GarmentSize,
  HOODIE_FRONT_PANEL_DIMENSIONS,
  SHIRT_FRONT_PANEL_DIMENSIONS,
  PatternPiece,
  CustomDimensions,
} from "../types/pattern.types";

export const useSvgExport = () => {
  const generateManualSvg = useCallback(
    (manualPieces: any[], liveSvgContent: string) => {
      let modifiedSvg = liveSvgContent;

      manualPieces.forEach((piece, index) => {
        const newTransform = `translate(${piece.x} ${piece.y}), rotate(${piece.rotation})`;

        const useElements = [
          ...modifiedSvg.matchAll(
            /(<use href="#item_\d+"[^>]*transform=")[^"]*("[^>]*>)/g
          ),
        ];

        if (index < useElements.length) {
          const match = useElements[index];
          const fullMatch = match[0];
          const newUse = `${match[1]}${newTransform}${match[2]}`;
          modifiedSvg = modifiedSvg.replace(fullMatch, newUse);
        }

        const cdElements = [
          ...modifiedSvg.matchAll(
            /(<use href="#cd_shape_\d+"[^>]*transform=")[^"]*("[^>]*\/>)/g
          ),
        ];

        if (index < cdElements.length) {
          const match = cdElements[index];
          const fullMatch = match[0];
          const newCd = `${match[1]}${newTransform}${match[2]}`;
          modifiedSvg = modifiedSvg.replace(fullMatch, newCd);
        }
      });

      const oldViewBoxMatch = modifiedSvg.match(/viewBox="([^"]+)"/);
      const oldViewBox = oldViewBoxMatch?.[1]?.split(/[\s,]+/).map(parseFloat);

      if (!oldViewBox || oldViewBox.length < 4) {
        return modifiedSvg;
      }

      const sparrowWidth = oldViewBox[2];
      const sparrowHeight = oldViewBox[3];

      const canvasWidth = 800;
      const canvasHeight = 600;
      const scale = Math.min(
        canvasWidth / sparrowWidth,
        canvasHeight / sparrowHeight
      );
      const scaledWidth = sparrowWidth * scale;
      const scaledHeight = sparrowHeight * scale;
      const offsetX = (canvasWidth - scaledWidth) / 2;
      const offsetY = (canvasHeight - scaledHeight) / 2;

      const scaleX = 1 / scale;
      const scaleY = 1 / scale;

      const scaledPieces = manualPieces.map((p) => ({
        x: (p.x - offsetX) * scaleX + oldViewBox[0],
        y: (p.y - offsetY) * scaleY + oldViewBox[1],
        width: p.width * scaleX,
        height: p.height * scaleY,
      }));

      modifiedSvg = liveSvgContent;
      manualPieces.forEach((piece, index) => {
        const scaledX = (piece.x - offsetX) * scaleX + oldViewBox[0];
        const scaledY = (piece.y - offsetY) * scaleY + oldViewBox[1];
        const newTransform = `translate(${scaledX} ${scaledY}), rotate(${piece.rotation})`;

        const useElements = [
          ...modifiedSvg.matchAll(
            /(<use href="#item_\d+"[^>]*transform=")[^"]*("[^>]*>)/g
          ),
        ];
        if (index < useElements.length) {
          const match = useElements[index];
          const fullMatch = match[0];
          const newUse = `${match[1]}${newTransform}${match[2]}`;
          modifiedSvg = modifiedSvg.replace(fullMatch, newUse);
        }

        const cdElements = [
          ...modifiedSvg.matchAll(
            /(<use href="#cd_shape_\d+"[^>]*transform=")[^"]*("[^>]*\/>)/g
          ),
        ];
        if (index < cdElements.length) {
          const match = cdElements[index];
          const fullMatch = match[0];
          const newCd = `${match[1]}${newTransform}${match[2]}`;
          modifiedSvg = modifiedSvg.replace(fullMatch, newCd);
        }
      });

      let minX = Math.min(...scaledPieces.map((p) => p.x - p.width));
      let minY = Math.min(...scaledPieces.map((p) => p.y - p.height));
      let maxX = Math.max(...scaledPieces.map((p) => p.x + p.width));
      let maxY = Math.max(...scaledPieces.map((p) => p.y + p.height));

      const newWidth = maxX - minX;
      const newHeight = maxY - minY;
      const newViewBox = `${minX} ${minY} ${newWidth} ${newHeight}`;

      modifiedSvg = modifiedSvg.replace(
        /viewBox="[^"]+"/,
        `viewBox="${newViewBox}"`
      );

      return modifiedSvg;
    },
    []
  );

  const normalizeSvgForRealWorld = useCallback(
    async (
      svgElement: SVGSVGElement,
      size: GarmentSize,
      patternPieces: PatternPiece[],
      liveSvgContent: string,
      customDimensions: CustomDimensions | undefined,
      garmentType: "tshirt" | "hoodie"
    ): Promise<SVGSVGElement> => {
      if (!liveSvgContent) {
        return svgElement;
      }

      let cleanContent = liveSvgContent.trim().replace(/^\uFEFF/, "");
      cleanContent = cleanContent.replace(
        /(\s+fill-opacity="[^"]*")\s+fill-opacity="[^"]*"/g,
        "$1"
      );
      cleanContent = cleanContent.replace(
        /(\s+fill="[^"]*")\s+fill="[^"]*"/g,
        "$1"
      );
      cleanContent = cleanContent.replace(
        /(\s+stroke="[^"]*")\s+stroke="[^"]*"/g,
        "$1"
      );
      cleanContent = cleanContent.replace(
        /(\s+stroke-width="[^"]*")\s+stroke-width="[^"]*"/g,
        "$1"
      );

      const sparrowDoc = new DOMParser().parseFromString(
        cleanContent,
        "text/xml"
      );
      const sparrowRoot = sparrowDoc.documentElement;

      if (sparrowRoot.tagName === "parsererror") {
        return svgElement;
      }

      const host = document.createElement("div");
      host.style.position = "fixed";
      host.style.left = "-100000px";
      host.style.top = "-100000px";
      host.style.opacity = "0";
      document.body.appendChild(host);
      host.appendChild(sparrowRoot);

      const mmToPt = 72.0 / 25.4;
      const cmToPt = mmToPt * 10;

      const frontPanelIndex = patternPieces.findIndex((p) =>
        p.name.toLowerCase().includes("front panel")
      );

      const frontPanelRef =
        frontPanelIndex >= 0 ? `#item_${frontPanelIndex}` : "#item_1";
      const frontPanelElement = sparrowRoot.querySelector(
        frontPanelRef
      ) as SVGGraphicsElement | null;
      if (!frontPanelElement || !frontPanelElement.getBBox) {
        document.body.removeChild(host);
        return svgElement;
      }

      const frontPanelBBox = frontPanelElement.getBBox();

      const transform = frontPanelElement.getAttribute("transform") || "";
      const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
      const rotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;

      const originalViewBox = sparrowRoot.getAttribute("viewBox");
      if (!originalViewBox) {
        document.body.removeChild(host);
        return svgElement;
      }

      const allPatternElements = sparrowRoot.querySelectorAll(
        "use, path, rect, circle, polygon"
      );
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      allPatternElements.forEach((el) => {
        if ((el as any).getBBox) {
          const bbox = (el as any).getBBox();
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
        }
      });

      const dimensionTable =
        garmentType === "tshirt"
          ? SHIRT_FRONT_PANEL_DIMENSIONS
          : HOODIE_FRONT_PANEL_DIMENSIONS;
      const realWorldDimensions =
        size === "CUSTOM" && customDimensions
          ? customDimensions
          : dimensionTable[size as keyof typeof dimensionTable];

      let bboxWidth = frontPanelBBox.width;
      let bboxHeight = frontPanelBBox.height;

      const normalizedRotation = Math.abs(rotation) % 180;
      if (normalizedRotation > 45 && normalizedRotation < 135) {
        [bboxWidth, bboxHeight] = [bboxHeight, bboxWidth];
      }

      const scaleFactor = Math.min(
        (realWorldDimensions.widthCm * cmToPt) / bboxWidth,
        (realWorldDimensions.heightCm * cmToPt) / bboxHeight
      );

      const scaledSvg = sparrowRoot.cloneNode(true) as SVGSVGElement;

      const croppedCanvasWidthPt = (maxX - minX) * scaleFactor;
      const croppedCanvasHeightPt = (maxY - minY) * scaleFactor;

      scaledSvg.setAttribute("width", `${croppedCanvasWidthPt}pt`);
      scaledSvg.setAttribute("height", `${croppedCanvasHeightPt}pt`);

      const croppedViewBoxX = minX * scaleFactor;
      const croppedViewBoxY = minY * scaleFactor;
      const croppedViewBoxWidth = (maxX - minX) * scaleFactor;
      const croppedViewBoxHeight = (maxY - minY) * scaleFactor;

      scaledSvg.setAttribute(
        "viewBox",
        `${croppedViewBoxX} ${croppedViewBoxY} ${croppedViewBoxWidth} ${croppedViewBoxHeight}`
      );

      const scaleGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      scaleGroup.setAttribute("transform", `scale(${scaleFactor})`);

      while (scaledSvg.firstChild) {
        scaleGroup.appendChild(scaledSvg.firstChild);
      }
      scaledSvg.appendChild(scaleGroup);

      scaledSvg.setAttribute(
        "data-canvas-width",
        croppedCanvasWidthPt.toString()
      );
      scaledSvg.setAttribute(
        "data-canvas-height",
        croppedCanvasHeightPt.toString()
      );

      document.body.removeChild(host);
      return scaledSvg;
    },
    []
  );

  const exportSvgToPdf = useCallback(
    async (
      svgElement: SVGSVGElement | null,
      _viewportPx: ViewportPx,
      size: GarmentSize,
      patternPieces: PatternPiece[] = [],
      liveSvgContent: string,
      customDimensions: CustomDimensions | undefined,
      garmentType: "tshirt" | "hoodie",
      isManualMode: boolean | undefined,
      manualPieces?: any[],
      abortSignal?: AbortSignal
    ): Promise<{ success: boolean; filePath?: string; error?: string }> => {
      try {
        if (abortSignal?.aborted) {
          throw new Error("Export cancelled");
        }

        if (!svgElement) {
          throw new Error("No SVG element provided");
        }

        let contentToExport = liveSvgContent;

        if (abortSignal?.aborted) {
          throw new Error("Export cancelled");
        }

        if (isManualMode && manualPieces && manualPieces.length > 0) {
          contentToExport = generateManualSvg(manualPieces, liveSvgContent);
        }

        if (abortSignal?.aborted) {
          throw new Error("Export cancelled");
        }

        const scaledSvg = await normalizeSvgForRealWorld(
          svgElement,
          size,
          patternPieces,
          contentToExport
            ?.replace(/<text[^>]*>.*?<\/text>/gs, "")
            ?.replace(
              /(<path[^>]*stroke-dasharray[^>]*stroke-opacity=")[^"]*("[^>]*\/>)/g,
              "$10$2"
            )!,
          customDimensions!,
          garmentType
        );

        if (abortSignal?.aborted) {
          throw new Error("Export cancelled");
        }

        const svgString = new XMLSerializer().serializeToString(scaledSvg);

        if (!svgString.trim()) {
          throw new Error("Empty SVG content");
        }

        if (abortSignal?.aborted) {
          throw new Error("Export cancelled");
        }

        const defaultFilename = `pattern_${size}_${new Date().getTime()}.pdf`;

        const filePath = await save({
          defaultPath: defaultFilename,
          filters: [
            {
              name: "PDF Files",
              extensions: ["pdf"],
            },
          ],
          title: `Pattern-${size}`,
        });

        if (!filePath) {
          return { success: false, error: "Export cancelled by user" };
        }

        const canvasWidthPt = parseFloat(
          scaledSvg.getAttribute("data-canvas-width") || "0"
        );
        const canvasHeightPt = parseFloat(
          scaledSvg.getAttribute("data-canvas-height") || "0"
        );

        const result = await invoke<string>("crop_svg", {
          svgString,
          canvasWidthPt,
          canvasHeightPt,
          outPath: filePath,
        });

        return {
          success: true,
          filePath: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [normalizeSvgForRealWorld]
  );

  return {
    exportSvgToPdf,
  };
};
