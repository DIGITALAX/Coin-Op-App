use serde::{Deserialize, Serialize};
use printpdf::*;
use std::io::BufWriter;

#[derive(Debug, Serialize, Deserialize)]
pub struct PatternPieceExport {
    pub id: String,
    pub name: String,
    pub x: f64,
    pub y: f64,
    pub rotation: f64,
    pub path_data: String,
    pub seam_allowance_mm: f64,
    pub grain_direction: String,
    pub width_mm: f64,
    pub height_mm: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintTile {
    pub row: i32,
    pub col: i32,
    pub page_x: f64,
    pub page_y: f64,
    pub grid_ref: String,
    pub pieces_on_page: Vec<PatternPieceExport>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LayoutBounds {
    pub min_x: f64,
    pub min_y: f64,
    pub max_x: f64,
    pub max_y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintExportData {
    pub pieces: Vec<PatternPieceExport>,
    pub layout_bounds: LayoutBounds,
    pub tiles: Vec<PrintTile>,
    pub tile_info: TileInfo,
    pub selected_size: String,
    pub garment_type: String,
    pub is_manual_mode: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TileInfo {
    pub tiles_x: i32,
    pub tiles_y: i32,
    pub tile_width: f64,
    pub tile_height: f64,
    pub total_pages: i32,
}

#[tauri::command]
pub async fn export_multi_page_pattern_print(export_data: PrintExportData) -> Result<Vec<u8>, String> {
    const A4_WIDTH_MM: f32 = 210.0;
    const A4_HEIGHT_MM: f32 = 297.0;
    const MARGIN_MM: f32 = 10.0;
    
    let total_pages = export_data.tiles.len();
    if total_pages == 0 {
        return Err("No pages to export".to_string());
    }
    
    let (doc, page1, layer1) = PdfDocument::new(
        &format!("Pattern {} {} {}", 
            export_data.garment_type, 
            export_data.selected_size,
            if export_data.is_manual_mode { "Manual" } else { "Auto" }
        ),
        Mm(A4_WIDTH_MM),
        Mm(A4_HEIGHT_MM),
        "Pattern Layer"
    );
    
    let font = doc.add_builtin_font(printpdf::BuiltinFont::Helvetica)
        .map_err(|e| format!("Failed to load font: {}", e))?;
    
    for (page_index, tile) in export_data.tiles.iter().enumerate() {
        let current_layer = if page_index == 0 {
            doc.get_page(page1).get_layer(layer1)
        } else {
            let (page, layer) = doc.add_page(Mm(A4_WIDTH_MM), Mm(A4_HEIGHT_MM), &format!("Page {}", page_index + 1));
            doc.get_page(page).get_layer(layer)
        };
        
        current_layer.use_text(
            &format!("Page {} of {} - Grid: {}", page_index + 1, total_pages, tile.grid_ref),
            12.0,
            Mm(MARGIN_MM),
            Mm(A4_HEIGHT_MM - MARGIN_MM - 5.0),
            &font
        );
        
        current_layer.use_text(
            &format!("{} {} - {} Mode", 
                export_data.garment_type.to_uppercase(), 
                export_data.selected_size,
                if export_data.is_manual_mode { "Manual" } else { "Auto" }
            ),
            10.0,
            Mm(MARGIN_MM),
            Mm(A4_HEIGHT_MM - MARGIN_MM - 15.0),
            &font
        );
        
        current_layer.use_text(
            &format!("Real size: {:.0}×{:.0}mm", 
                export_data.layout_bounds.width, 
                export_data.layout_bounds.height
            ),
            8.0,
            Mm(A4_WIDTH_MM - 60.0),
            Mm(MARGIN_MM + 5.0),
            &font
        );
        
        current_layer.use_text(
            "Assembly: Match alignment marks",
            8.0,
            Mm(A4_WIDTH_MM - 60.0),
            Mm(MARGIN_MM + 15.0),
            &font
        );
        
        for piece in &tile.pieces_on_page {
            if !piece.path_data.is_empty() {
                let relative_x = piece.x - tile.page_x;
                let relative_y = piece.y - tile.page_y;
                
                if relative_x >= -piece.width_mm/2.0 && relative_x <= export_data.tile_info.tile_width + piece.width_mm/2.0 &&
                   relative_y >= -piece.height_mm/2.0 && relative_y <= export_data.tile_info.tile_height + piece.height_mm/2.0 {
                    
                    let pdf_x = MARGIN_MM + relative_x as f32;
                    let pdf_y = A4_HEIGHT_MM - MARGIN_MM - relative_y as f32;
                    
                    current_layer.use_text(
                        &piece.name,
                        8.0,
                        Mm(pdf_x),
                        Mm(pdf_y),
                        &font
                    );
                    
                    current_layer.use_text(
                        &format!("{:.1}×{:.1}mm", piece.width_mm, piece.height_mm),
                        6.0,
                        Mm(pdf_x),
                        Mm(pdf_y - 8.0),
                        &font
                    );
                    
                    current_layer.use_text(
                        &format!("Seam: {}mm", piece.seam_allowance_mm),
                        5.0,
                        Mm(pdf_x),
                        Mm(pdf_y - 15.0),
                        &font
                    );
                    
                    current_layer.use_text(
                        &format!("Grain: {}", piece.grain_direction),
                        5.0,
                        Mm(pdf_x),
                        Mm(pdf_y - 22.0),
                        &font
                    );
                }
            }
        }
    }
    
    let mut pdf_bytes = Vec::new();
    {
        let mut cursor = std::io::Cursor::new(&mut pdf_bytes);
        let mut writer = BufWriter::new(&mut cursor);
        doc.save(&mut writer)
            .map_err(|e| format!("Failed to generate PDF: {}", e))?;
    }
    
    Ok(pdf_bytes)
}