import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import {
  ViewportPx,
  DEFAULT_SCALE_MULTIPLIERS,
  ISO_PAPER_SIZES_MM,
  SvgExportOptions,
  HoodieSize,
  HOODIE_FRONT_PANEL_DIMENSIONS,
  PatternPiece,
} from "../types/pattern.types";

export const useSvgExport = () => {
  const normalizeSvgForRealWorld = useCallback(
    async (svgElement: SVGSVGElement, hoodieSize: HoodieSize, patternPieces: PatternPiece[], liveSvgContent?: string): Promise<SVGSVGElement> => {
      // Find front panel piece only
      const frontPanelPiece = patternPieces.find(piece => 
        piece.name.toLowerCase().includes('front panel')
      );

      if (!frontPanelPiece) {
        return svgElement;
      }

      // Get rotation from liveSvgContent (actual Sparrow result)
      let canvasRotation = 0;
      
      if (liveSvgContent) {
        console.log("Using liveSvgContent for rotation detection");
        console.log("First 500 chars of liveSvgContent:", liveSvgContent.substring(0, 500));
        
        const parser = new DOMParser();
        const sparrowDoc = parser.parseFromString(liveSvgContent, "image/svg+xml");
        
        const svgRoot = sparrowDoc.documentElement;
        console.log("SVG root element:", svgRoot?.tagName);
        console.log("SVG root namespace:", svgRoot?.namespaceURI);
        
        if (svgRoot?.tagName === "parsererror") {
          console.log("Parser error detected:", svgRoot.textContent);
          console.log("Raw content causing error:", liveSvgContent.substring(0, 200));
        } else {
          console.log("SVG parsed successfully");
          console.log("Root element children:", svgRoot?.children.length);
          
          for (let i = 0; i < (svgRoot?.children.length || 0); i++) {
            const child = svgRoot?.children[i];
            console.log(`Child ${i}:`, child?.tagName, child?.getAttribute('id'));
          }
          
          const allElements = sparrowDoc.querySelectorAll('*');
          console.log("Total elements in document:", allElements.length);
          
          const useElements = sparrowDoc.querySelectorAll('use');
          console.log("Found <use> elements:", useElements.length);
          
          if (useElements.length > 0) {
            Array.from(useElements).forEach((useElement, i) => {
              const href = useElement.getAttribute('href') || useElement.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
              console.log(`Use element ${i}:`, href, useElement.getAttribute('transform'));
              
              if (href === '#item_0') {
                const transform = useElement.getAttribute('transform') || '';
                console.log("Front panel (item_0) transform:", transform);
                
                if (transform.includes('rotate')) {
                  const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
                  if (rotateMatch) {
                    canvasRotation = parseFloat(rotateMatch[1]);
                    console.log(`Found front panel Sparrow rotation:`, canvasRotation);
                  }
                }
              }
            });
          } else {
            console.log("No <use> elements found, checking for direct pattern matching");
            const textMatch = liveSvgContent.match(/<use[^>]*href="#item_0"[^>]*transform="([^"]+)"/);
            if (textMatch) {
              const transform = textMatch[1];
              console.log("Found item_0 transform via regex:", transform);
              
              if (transform.includes('rotate')) {
                const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
                if (rotateMatch) {
                  canvasRotation = parseFloat(rotateMatch[1]);
                  console.log(`Extracted rotation from regex:`, canvasRotation);
                }
              }
            } else {
              console.log("No item_0 pattern found in SVG content");
            }
          }
        }
      } else {
        console.log("No liveSvgContent provided, using empty svgElement");
      }

      // Fetch raw front panel SVG from IPFS
      let rawSvgContent = frontPanelPiece.svgPath;
      
      if (rawSvgContent.startsWith("ipfs://") || rawSvgContent.startsWith("Qm")) {
        const ipfsUrl = rawSvgContent.startsWith("ipfs://")
          ? `https://thedial.infura-ipfs.io/ipfs/${rawSvgContent.replace("ipfs://", "")}`
          : `https://thedial.infura-ipfs.io/ipfs/${rawSvgContent}`;
        
        try {
          const response = await fetch(ipfsUrl);
          if (response.ok) {
            rawSvgContent = await response.text();
          }
        } catch (error) {
          return svgElement;
        }
      }

      // Parse the raw SVG 
      const parser = new DOMParser();
      const rawSvgDoc = parser.parseFromString(rawSvgContent, "image/svg+xml");
      const rawSvgElement = rawSvgDoc.querySelector('svg');
      
      console.log("Final canvas rotation to apply:", canvasRotation);
      console.log("Raw SVG element before rotation:", rawSvgElement?.outerHTML.substring(0, 200));
      
      if (rawSvgElement && canvasRotation !== 0) {
        const viewBox = rawSvgElement.getAttribute("viewBox");
        const [vbX, vbY, vbWidth, vbHeight] = viewBox ? viewBox.split(/[\s,]+/).map(parseFloat) : [0, 0, parseFloat(rawSvgElement.getAttribute("width") || "0"), parseFloat(rawSvgElement.getAttribute("height") || "0")];
        
        const centerX = vbX + vbWidth / 2;
        const centerY = vbY + vbHeight / 2;
        
        const transformGroup = rawSvgDoc.createElementNS("http://www.w3.org/2000/svg", "g");
        transformGroup.setAttribute("transform", `rotate(${canvasRotation} ${centerX} ${centerY})`);
        
        while (rawSvgElement.firstChild) {
          transformGroup.appendChild(rawSvgElement.firstChild);
        }
        
        rawSvgElement.appendChild(transformGroup);
      }
      
      if (rawSvgElement) {
        const originalViewBox = rawSvgElement.getAttribute("viewBox");
        const [vbX, vbY, vbWidth, vbHeight] = originalViewBox ? originalViewBox.split(/[\s,]+/).map(parseFloat) : [0, 0, parseFloat(rawSvgElement.getAttribute("width") || "0"), parseFloat(rawSvgElement.getAttribute("height") || "0")];
        
        const a4WidthPx = 595;
        const a4HeightPx = 842;
        
        const pagesX = Math.ceil(vbWidth / a4WidthPx);
        const pagesY = Math.ceil(vbHeight / a4HeightPx);
        const totalPages = pagesX * pagesY;
        
        if (totalPages > 1) {
          const pages = [];
          for (let row = 0; row < pagesY; row++) {
            for (let col = 0; col < pagesX; col++) {
              const pageClone = rawSvgElement.cloneNode(true) as SVGSVGElement;
              const offsetX = col * a4WidthPx;
              const offsetY = row * a4HeightPx;
              
              pageClone.setAttribute("width", "210mm");
              pageClone.setAttribute("height", "297mm");
              pageClone.setAttribute("viewBox", `${offsetX} ${offsetY} ${a4WidthPx} ${a4HeightPx}`);
              
              pages.push(pageClone);
            }
          }
          
          rawSvgElement.setAttribute("data-pages", JSON.stringify(pages.map(p => new XMLSerializer().serializeToString(p))));
        }
        
        rawSvgElement.setAttribute("width", "210mm");
        rawSvgElement.setAttribute("height", "297mm");
        rawSvgElement.setAttribute("viewBox", "0 0 595 842");
        return rawSvgElement as SVGSVGElement;
      }
      
      return svgElement;
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

        const scaledSvg = await normalizeSvgForRealWorld(svgElement, hoodieSize, patternPieces, liveSvgContent);
        const svgString = new XMLSerializer().serializeToString(scaledSvg);

        if (!svgString.trim()) {
          throw new Error("Empty SVG content");
        }

        const paperInfo = ISO_PAPER_SIZES_MM[options.paper];
        const paperSize =
          options.orientation === "portrait"
            ? `${paperInfo.width}×${paperInfo.height}mm`
            : `${paperInfo.height}×${paperInfo.width}mm`;

        const defaultFilename = `pattern_${options.sizePreset}_${
          options.paper
        }_${options.orientation}_${new Date().getTime()}.pdf`;

        const filePath = await save({
          defaultPath: defaultFilename,
          filters: [
            {
              name: "PDF Files",
              extensions: ["pdf"],
            },
          ],
          title: `Export Pattern to ${paperSize} PDF`,
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
