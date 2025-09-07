import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { CanvasPanel, LayoutBounds, PrintExportOptions, PrintTile } from "../types/pattern.types";
import { Size, UNISEX_T_SHIRT_SIZING, UNISEX_HOODIE_SIZING } from "../types/pattern.types";


export const usePrintExport = () => {
  const calculateLayoutBounds = useCallback((pieces: CanvasPanel[]): LayoutBounds => {
    if (pieces.length === 0) {
      return { min_x: 0, min_y: 0, max_x: 0, max_y: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...pieces.map(p => p.x - p.width/2));
    const minY = Math.min(...pieces.map(p => p.y - p.height/2));
    const maxX = Math.max(...pieces.map(p => p.x + p.width/2));
    const maxY = Math.max(...pieces.map(p => p.y + p.height/2));

    return {
      min_x: minX,
      min_y: minY,
      max_x: maxX,
      max_y: maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, []);

  const scaleToRealSize = useCallback((
    pieces: CanvasPanel[],
    selectedSize: Size,
    garmentType: "tshirt" | "hoodie",
    currentCanvasWidth: number,
    currentCanvasHeight: number
  ): CanvasPanel[] => {
    const sizing = garmentType === "tshirt" 
      ? UNISEX_T_SHIRT_SIZING[selectedSize]
      : UNISEX_HOODIE_SIZING[selectedSize];

    const realWidth = sizing.chest;
    const realHeight = sizing.length;
    
    const scaleX = realWidth / currentCanvasWidth;
    const scaleY = realHeight / currentCanvasHeight;

    return pieces.map(piece => ({
      ...piece,
      x: piece.x * scaleX,
      y: piece.y * scaleY,
      width: piece.width * scaleX,
      height: piece.height * scaleY,
    }));
  }, []);

  const calculatePrintTiles = useCallback((layoutBounds: LayoutBounds): { 
    tiles_x: number; 
    tiles_y: number; 
    tile_width: number; 
    tile_height: number;
    total_pages: number;
  } => {
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;
    const OVERLAP = 15;
    const MARGIN = 10;

    const tileWidth = A4_WIDTH - MARGIN * 2 - OVERLAP;
    const tileHeight = A4_HEIGHT - MARGIN * 2 - OVERLAP;

    const tilesX = Math.ceil(layoutBounds.width / tileWidth);
    const tilesY = Math.ceil(layoutBounds.height / tileHeight);

    return {
      tiles_x: tilesX,
      tiles_y: tilesY,
      tile_width: tileWidth,
      tile_height: tileHeight,
      total_pages: tilesX * tilesY
    };
  }, []);

  const generatePrintTiles = useCallback((
    pieces: CanvasPanel[],
    layoutBounds: LayoutBounds,
    tileInfo: { tiles_x: number; tiles_y: number; tile_width: number; tile_height: number }
  ): PrintTile[] => {
    const tiles: PrintTile[] = [];

    for (let row = 0; row < tileInfo.tiles_y; row++) {
      for (let col = 0; col < tileInfo.tiles_x; col++) {
        const pageX = layoutBounds.min_x + col * tileInfo.tile_width;
        const pageY = layoutBounds.min_y + row * tileInfo.tile_height;

        const piecesOnPage = pieces.filter(piece => {
          const pieceLeft = piece.x - piece.width/2;
          const pieceRight = piece.x + piece.width/2;
          const pieceTop = piece.y - piece.height/2;
          const pieceBottom = piece.y + piece.height/2;

          const pageRight = pageX + tileInfo.tile_width;
          const pageBottom = pageY + tileInfo.tile_height;

          return !(pieceRight < pageX || pieceLeft > pageRight || 
                  pieceBottom < pageY || pieceTop > pageBottom);
        });

        const gridRef = String.fromCharCode(65 + row) + (col + 1);

        tiles.push({
          row,
          col,
          page_x: pageX,
          page_y: pageY,
          grid_ref: gridRef,
          pieces_on_page: piecesOnPage
        });
      }
    }

    return tiles;
  }, []);

  const exportToMultiPagePrint = useCallback(async (options: PrintExportOptions) => {
    try {
      const currentPieces = options.isManualMode ? options.manualPieces : options.autoBasePieces;

      
      if (currentPieces.length === 0) {
        throw new Error("No pattern pieces to export");
      }

      const scaledPieces = scaleToRealSize(
        currentPieces,
        options.selectedSize,
        options.garmentType,
        options.canvasWidth,
        options.canvasHeight
      );

      const transformedPieces = scaledPieces.map(piece => ({
        id: piece.id,
        name: piece.name,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation,
        path_data: piece.pathData || "",
        seam_allowance_mm: 10.0,
        grain_direction: "lengthwise",
        width_mm: piece.width,
        height_mm: piece.height
      }));

      const layoutBounds = calculateLayoutBounds(scaledPieces);
      
      const tileInfo = calculatePrintTiles(layoutBounds);
      
      const printTiles = generatePrintTiles(scaledPieces, layoutBounds, tileInfo);

      const tilesWithTransformedPieces = printTiles.map(tile => ({
        ...tile,
        pieces_on_page: tile.pieces_on_page.map((piece: any) => ({
          id: piece.id,
          name: piece.name,
          x: piece.x,
          y: piece.y,
          rotation: piece.rotation,
          path_data: piece.pathData || "",
          seam_allowance_mm: 10.0,
          grain_direction: "lengthwise",
          width_mm: piece.width,
          height_mm: piece.height
        }))
      }));

      const exportData = {
        pieces: transformedPieces,
        layout_bounds: layoutBounds,
        tiles: tilesWithTransformedPieces,
        tile_info: tileInfo,
        selected_size: options.selectedSize,
        garment_type: options.garmentType,
        is_manual_mode: options.isManualMode
      };

      const pdfBytes = await invoke<number[]>("export_multi_page_pattern_print", {
        exportData
      });

      const defaultFilename = `pattern_${options.garmentType}_${options.selectedSize}_${options.isManualMode ? 'manual' : 'auto'}_${new Date().getTime()}.pdf`;
      
      const filePath = await save({
        defaultPath: defaultFilename,
        filters: [{
          name: 'PDF Files',
          extensions: ['pdf']
        }]
      });

      if (filePath) {
        await invoke("write_file_bytes", {
          path: filePath,
          contents: pdfBytes
        });
      } else {
        throw new Error("Export cancelled by user");
      }

      return {
        success: true,
        totalPages: printTiles.length,
        realDimensions: {
          width: layoutBounds.width,
          height: layoutBounds.height
        }
      };

    } catch (error) {
      throw new Error(`Print export failed: ${error}`);
    }
  }, [calculateLayoutBounds, scaleToRealSize, calculatePrintTiles, generatePrintTiles]);

  return {
    exportToMultiPagePrint,
    calculateLayoutBounds,
    scaleToRealSize,
    calculatePrintTiles,
    generatePrintTiles
  };
};