import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import {
  ViewportPx,
  HoodieSize,
  HOODIE_FRONT_PANEL_DIMENSIONS,
  PatternPiece,
} from "../types/pattern.types";

export const useSvgExport = () => {
  const normalizeSvgForRealWorld = useCallback(
    async (
      svgElement: SVGSVGElement,
      hoodieSize: HoodieSize,
      patternPieces: PatternPiece[],
      liveSvgContent?: string
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

      const realWorldDimensions = HOODIE_FRONT_PANEL_DIMENSIONS[hoodieSize];

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
      size: HoodieSize,
      patternPieces: PatternPiece[] = [],
      liveSvgContent?: string
    ): Promise<{ success: boolean; filePath?: string; error?: string }> => {
      try {
        if (!svgElement) {
          throw new Error("No SVG element provided");
        }

        const scaledSvg = await normalizeSvgForRealWorld(
          svgElement,
          size,
          patternPieces,
          liveSvgContent
            ?.replace(/<text[^>]*>.*?<\/text>/gs, "")
            ?.replace(
              /(<path[^>]*stroke-dasharray[^>]*stroke-opacity=")[^"]*("[^>]*\/>)/g,
              "$10$2"
            )
        );
        const svgString = new XMLSerializer().serializeToString(scaledSvg);

        if (!svgString.trim()) {
          throw new Error("Empty SVG content");
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
