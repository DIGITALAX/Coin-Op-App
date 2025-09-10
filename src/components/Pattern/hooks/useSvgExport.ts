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

      const originalViewBox = sparrowRoot.getAttribute("viewBox");
      if (!originalViewBox) {
        document.body.removeChild(host);
        return svgElement;
      }

      const [vbX, vbY, vbWidth, vbHeight] = originalViewBox
        .split(/[\s,]+/)
        .map(parseFloat);

      const realWorldDimensions = HOODIE_FRONT_PANEL_DIMENSIONS[hoodieSize];

      const scaleFactor = Math.max(
        (realWorldDimensions.widthCm * cmToPt) / frontPanelBBox.width,
        (realWorldDimensions.heightCm * cmToPt) / frontPanelBBox.height
      );

      const actualCanvasWidthPt = vbWidth * scaleFactor;
      const actualCanvasHeightPt = vbHeight * scaleFactor;

      console.log(`🔍 SCALING DEBUG for ${hoodieSize}:`);
      console.log(`📐 Sparrow viewBox: ${vbWidth} x ${vbHeight} units`);
      console.log(`📏 Front panel bbox: ${frontPanelBBox.width} x ${frontPanelBBox.height} units`);
      console.log(`🎯 Target front panel: ${realWorldDimensions.widthCm}cm x ${realWorldDimensions.heightCm}cm`);
      console.log(`⚖️ Scale factor: ${scaleFactor.toFixed(2)}`);
      console.log(`📦 Final canvas: ${actualCanvasWidthPt.toFixed(0)}pt x ${actualCanvasHeightPt.toFixed(0)}pt`);
      console.log(`📏 That's ${(actualCanvasWidthPt/cmToPt).toFixed(1)}cm x ${(actualCanvasHeightPt/cmToPt).toFixed(1)}cm`);
      
      const A4_WIDTH = 595, A4_HEIGHT = 842;
      const cols = Math.ceil(actualCanvasWidthPt / A4_WIDTH);
      const rows = Math.ceil(actualCanvasHeightPt / A4_HEIGHT);
      console.log(`📄 A4 pages: ${cols} x ${rows} = ${cols * rows} pages`);

      const scaledSvg = sparrowRoot.cloneNode(true) as SVGSVGElement;

      scaledSvg.setAttribute("width", `${actualCanvasWidthPt}pt`);
      scaledSvg.setAttribute("height", `${actualCanvasHeightPt}pt`);

      const scaledViewBoxWidth = vbWidth * scaleFactor;
      const scaledViewBoxHeight = vbHeight * scaleFactor;
      const scaledViewBoxX = vbX * scaleFactor;
      const scaledViewBoxY = vbY * scaleFactor;

      scaledSvg.setAttribute(
        "viewBox",
        `${scaledViewBoxX} ${scaledViewBoxY} ${scaledViewBoxWidth} ${scaledViewBoxHeight}`
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
      
      scaledSvg.setAttribute('data-canvas-width', actualCanvasWidthPt.toString());
      scaledSvg.setAttribute('data-canvas-height', actualCanvasHeightPt.toString());

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

        const defaultFilename = `pattern_${
          size
        }_${new Date().getTime()}.pdf`;

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

        const canvasWidthPt = parseFloat(scaledSvg.getAttribute('data-canvas-width') || '0');
        const canvasHeightPt = parseFloat(scaledSvg.getAttribute('data-canvas-height') || '0');
                
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

// KEEP THIS HERE
/* 

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

      // UNIFORM SCALING APPROACH: Scale entire Sparrow result based on front panel real-world size
      console.log(
        `Using uniform scaling approach for hoodie size: ${hoodieSize}`
      );

      // Clean and parse Sparrow SVG
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
        console.log("SVG parsing failed, returning original");
        return svgElement;
      }

      // Mount offscreen to get accurate DOM measurements
      const host = document.createElement("div");
      host.style.position = "fixed";
      host.style.left = "-100000px";
      host.style.top = "-100000px";
      host.style.opacity = "0";
      document.body.appendChild(host);
      host.appendChild(sparrowRoot);

      try {
        // Manufacturing-accurate conversion constants
        const mmToPt = 72.0 / 25.4; // 72 points per inch ÷ 25.4mm per inch
        const cmToPt = mmToPt * 10; // 10mm per cm = 28.346 points per cm

        // 1. Find front panel in Sparrow result by name
        const frontPanelIndex = patternPieces.findIndex((p) =>
          p.name.toLowerCase().includes("front panel")
        );

        const frontPanelRef =
          frontPanelIndex >= 0 ? `#item_${frontPanelIndex}` : "#item_1"; // Default to item_1 if not found
        console.log(`🎯 Using front panel reference: ${frontPanelRef}`);

        // 2. Get front panel bbox in Sparrow coordinates
        const frontPanelElement = sparrowRoot.querySelector(
          frontPanelRef
        ) as SVGGraphicsElement | null;
        if (!frontPanelElement || !frontPanelElement.getBBox) {
          console.log("❌ Could not find front panel element with getBBox");
          document.body.removeChild(host);
          return svgElement;
        }

        const frontPanelBBox = frontPanelElement.getBBox();
        console.log(
          `📏 Sparrow front panel bbox: ${frontPanelBBox.width} × ${frontPanelBBox.height} units`
        );

        // 3. Get original canvas dimensions from viewBox
        const originalViewBox = sparrowRoot.getAttribute("viewBox");
        if (!originalViewBox) {
          console.log("❌ No viewBox found in Sparrow SVG");
          document.body.removeChild(host);
          return svgElement;
        }

        const [vbX, vbY, vbWidth, vbHeight] = originalViewBox
          .split(/[\s,]+/)
          .map(parseFloat);
        console.log(
          `📐 Sparrow canvas: ${vbWidth} × ${vbHeight} units (viewBox: ${vbX}, ${vbY}, ${vbWidth}, ${vbHeight})`
        );

        // 4. Calculate canvas-to-front-panel ratios
        const canvasWidthRatio = vbWidth / frontPanelBBox.width; // How much wider is canvas than front panel
        const canvasHeightRatio = vbHeight / frontPanelBBox.height; // How much taller is canvas than front panel
        console.log(
          `📊 Canvas ratios - Width: ${canvasWidthRatio.toFixed(
            2
          )}x, Height: ${canvasHeightRatio.toFixed(2)}x`
        );

        // 5. Get target real-world front panel dimensions
        const realWorldDimensions = HOODIE_FRONT_PANEL_DIMENSIONS[hoodieSize];
        console.log(
          `🎯 Target front panel for ${hoodieSize}: ${realWorldDimensions.widthCm}cm × ${realWorldDimensions.heightCm}cm`
        );

        // 6. Calculate scale factor based on front panel real-world size
        const scaleFactor = Math.max(
          (realWorldDimensions.widthCm * cmToPt) / frontPanelBBox.width,
          (realWorldDimensions.heightCm * cmToPt) / frontPanelBBox.height
        );
        console.log(`🔧 Calculated scale factor: ${scaleFactor}`);

        // 7. Calculate actual canvas size needed for ALL scaled content
        const actualCanvasWidthPt = vbWidth * scaleFactor;
        const actualCanvasHeightPt = vbHeight * scaleFactor;
        console.log(
          `📏 Actual canvas needed: ${actualCanvasWidthPt.toFixed(
            1
          )}pt × ${actualCanvasHeightPt.toFixed(1)}pt`
        );
        console.log(
          `📏 That's ${(actualCanvasWidthPt / cmToPt).toFixed(1)}cm × ${(
            actualCanvasHeightPt / cmToPt
          ).toFixed(1)}cm`
        );

        // 8. Create scaled SVG with exact manufacturing dimensions
        const scaledSvg = sparrowRoot.cloneNode(true) as SVGSVGElement;

        // Set canvas to fit ALL scaled content
        scaledSvg.setAttribute("width", `${actualCanvasWidthPt}pt`);
        scaledSvg.setAttribute("height", `${actualCanvasHeightPt}pt`);

        // Scale viewBox to encompass all transformed content
        const scaledViewBoxWidth = vbWidth * scaleFactor; // 33 * 62.4 = 2059
        const scaledViewBoxHeight = vbHeight * scaleFactor; // 46 * 62.4 = 2870
        const scaledViewBoxX = vbX * scaleFactor; // -1.5 * 62.4 = -93.6
        const scaledViewBoxY = vbY * scaleFactor; // -2.1 * 62.4 = -131

        scaledSvg.setAttribute(
          "viewBox",
          `${scaledViewBoxX} ${scaledViewBoxY} ${scaledViewBoxWidth} ${scaledViewBoxHeight}`
        );

        // Create wrapper group with scale transform
        const scaleGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        scaleGroup.setAttribute("transform", `scale(${scaleFactor})`);

        // Move all children into scale group
        while (scaledSvg.firstChild) {
          scaleGroup.appendChild(scaledSvg.firstChild);
        }
        scaledSvg.appendChild(scaleGroup);

        console.log(`🔧 Using transform scale approach: scale(${scaleFactor})`);
        console.log(
          `🔧 Original viewBox: (${vbX}, ${vbY}, ${vbWidth}, ${vbHeight})`
        );

        console.log(
          `✅ Final SVG: ${actualCanvasWidthPt.toFixed(
            1
          )}pt × ${actualCanvasHeightPt.toFixed(1)}pt`
        );
        console.log(
          `✅ Front panel will be: ${realWorldDimensions.widthCm}cm × ${realWorldDimensions.heightCm}cm`
        );

        if (hoodieSize === "5XL") {
          console.log(`🚨 5XL CHECK: Front panel should be 40.2cm × 79.4cm`);
          console.log(
            `🚨 Total canvas: ${(actualCanvasWidthPt / cmToPt).toFixed(
              1
            )}cm × ${(actualCanvasHeightPt / cmToPt).toFixed(1)}cm`
          );
        }

        document.body.removeChild(host);
        return scaledSvg;
      } catch (error) {
        console.log("❌ Error in real-world scaling:", error);
        document.body.removeChild(host);
        return svgElement;
      }
    },
    []
  );

  const exportSvgToPdf = useCallback(
    async (
      svgElement: SVGSVGElement | null,
      _viewportPx: ViewportPx,
      options: SvgExportOptions,
      patternPieces: PatternPiece[] = [],
      liveSvgContent?: string
    ): Promise<{ success: boolean; filePath?: string; error?: string }> => {
      try {
        if (!svgElement) {
          throw new Error("No SVG element provided");
        }

        const hoodieSize = options.hoodieSize || "M";

        const scaledSvg = await normalizeSvgForRealWorld(
          svgElement,
          hoodieSize,
          patternPieces,
          liveSvgContent
            ?.replace(/<text[^>]*>.*?<\/text>/gs, "")
            ?.replace(/(<path[^>]*stroke-dasharray[^>]*stroke-opacity=")[^"]*("[^>]*\/>)/g,
  '$10$2')

        );
        const svgString = new XMLSerializer().serializeToString(scaledSvg);

        if (!svgString.trim()) {
          throw new Error("Empty SVG content");
        }

        // Use real-world content dimensions instead of fixed paper sizes
        const defaultFilename = `pattern_${hoodieSize}_${
          options.sizePreset
        }_${new Date().getTime()}.pdf`;

        const filePath = await save({
          defaultPath: defaultFilename,
          filters: [
            {
              name: "PDF Files",
              extensions: ["pdf"],
            },
          ],
          title: `Export Pattern - Real World ${hoodieSize} Size`,
        });

        if (!filePath) {
          return { success: false, error: "Export cancelled by user" };
        }

        const result = await invoke<string>("export_pattern_to_pdf", {
          svgString,
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

  const getEstimatedPageCount = useCallback(
    (viewportPx: ViewportPx, options: SvgExportOptions): number => {
      const scale = DEFAULT_SCALE_MULTIPLIERS[options.sizePreset];
      const pxToPt = 72.0 / 96.0;

      const canvasWPt = viewportPx.width * pxToPt * scale;
      const canvasHPt = viewportPx.height * pxToPt * scale;

      const paperSizeMm = ISO_PAPER_SIZES_MM[options.paper];
      const [paperWMm, paperHMm] =
        options.orientation === "portrait"
          ? [paperSizeMm.width, paperSizeMm.height]
          : [paperSizeMm.height, paperSizeMm.width];

      const mmToPt = 72.0 / 25.4;
      const pageWPt = paperWMm * mmToPt;
      const pageHPt = paperHMm * mmToPt;

      const marginPt = options.marginMm * mmToPt;
      const overlapPt = options.overlapMm * mmToPt;

      const contentW = pageWPt - marginPt * 2.0;
      const contentH = pageHPt - marginPt * 2.0;

      const effW = contentW - overlapPt;
      const effH = contentH - overlapPt;

      const cols = Math.ceil((canvasWPt + overlapPt) / effW);
      const rows = Math.ceil((canvasHPt + overlapPt) / effH);

      return Math.max(1, cols * rows);
    },
    []
  );

  return {
    exportSvgToPdf,
    getEstimatedPageCount,
  };
};

*/
