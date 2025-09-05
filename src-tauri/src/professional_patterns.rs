use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use roxmltree::Document;
use printpdf::*;
use chrono::{DateTime, Utc};
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternPiece {
    pub name: String,
    pub svg_file: String,
    pub width_mm: f64,
    pub height_mm: f64,
    pub path_data: String,
    pub scale_factor: f64,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfessionalPatternRequest {
    pub garment_type: String,
    pub size: String,
    pub pieces: Vec<String>,
    pub project_name: String,
    pub seam_allowance_mm: f64,
}
#[derive(Debug, Clone)]
pub struct PatternPage {
    pub page_key: String,
    pub width_mm: f64,
    pub height_mm: f64,
    pub pattern_sections: Vec<PatternSection>,
}
#[derive(Debug, Clone)]
pub struct PatternSection {
    pub piece_name: String,
    pub x_offset: f64,
    pub y_offset: f64,
    pub width_mm: f64,
    pub height_mm: f64,
    pub path_data: String,
    pub assembly_marks: Vec<AssemblyMark>,
}
#[derive(Debug, Clone)]
pub struct AssemblyMark {
    pub mark_type: String,
    pub x: f64,
    pub y: f64,
    pub connects_to: Option<String>,
}
pub struct ProfessionalPatternExporter {
    pub page_width_mm: f64,
    pub page_height_mm: f64,
    pub margin_mm: f64,
    pub overlap_mm: f64,
}
impl ProfessionalPatternExporter {
    pub fn new() -> Self {
        Self {
            page_width_mm: 210.0,  
            page_height_mm: 297.0, 
            margin_mm: 10.0,
            overlap_mm: 15.0,
        }
    }
    pub fn load_pattern_svg(&self, svg_path: &str) -> Result<PatternPiece, String> {
        let svg_content = fs::read_to_string(svg_path)
            .map_err(|e| format!("Failed to read SVG file {}: {}", svg_path, e))?;
        let doc = Document::parse(&svg_content)
            .map_err(|e| format!("Failed to parse SVG: {}", e))?;
        let svg_node = doc.root_element();
        let width_str = svg_node.attribute("width").unwrap_or("0mm");
        let height_str = svg_node.attribute("height").unwrap_or("0mm");
        let width_mm = self.parse_mm_value(width_str)?;
        let height_mm = self.parse_mm_value(height_str)?;
        let path_data = self.extract_path_data(&doc)?;
        let piece_name = Path::new(svg_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown")
            .to_string();
        Ok(PatternPiece {
            name: piece_name,
            svg_file: svg_path.to_string(),
            width_mm,
            height_mm,
            path_data,
            scale_factor: 1.0, 
        })
    }
    fn parse_mm_value(&self, value_str: &str) -> Result<f64, String> {
        let value_str = value_str.trim().replace("mm", "");
        value_str.parse::<f64>()
            .map_err(|e| format!("Failed to parse dimension value '{}': {}", value_str, e))
    }
    fn extract_path_data(&self, doc: &Document) -> Result<String, String> {
        for node in doc.descendants() {
            if node.has_tag_name("path") {
                if let Some(d) = node.attribute("d") {
                    return Ok(d.to_string());
                }
            }
        }
        Err("No path data found in SVG".to_string())
    }
    pub fn calculate_size_scale_factor(&self, size: &str) -> f64 {
        match size {
            "XS" => 0.85,
            "S" => 0.92,
            "M" => 1.0,
            "L" => 1.08,
            "XL" => 1.16,
            "XXL" => 1.24,
            _ => 1.0,
        }
    }
    pub fn calculate_pages_needed(&self, piece: &PatternPiece, scale_factor: f64) -> (u32, u32) {
        let scaled_width = piece.width_mm * scale_factor;
        let scaled_height = piece.height_mm * scale_factor;
        let usable_width = self.page_width_mm - (2.0 * self.margin_mm);
        let usable_height = self.page_height_mm - (2.0 * self.margin_mm);
        let pages_x = ((scaled_width / usable_width).ceil() as u32).max(1);
        let pages_y = ((scaled_height / usable_height).ceil() as u32).max(1);
        (pages_x, pages_y)
    }
    pub fn generate_assembly_keys(&self, pages_x: u32, pages_y: u32) -> Vec<Vec<String>> {
        let mut keys = Vec::new();
        for row in 0..pages_y {
            let mut row_keys = Vec::new();
            for col in 0..pages_x {
                let col_letter = (b'A' + (col as u8)) as char;
                let row_number = row + 1;
                row_keys.push(format!("{}{}", col_letter, row_number));
            }
            keys.push(row_keys);
        }
        keys
    }
}
#[tauri::command]
pub async fn export_professional_pattern(
    _app_handle: tauri::AppHandle,
    request: ProfessionalPatternRequest
) -> Result<String, String> {
    let exporter = ProfessionalPatternExporter::new();
    let now: DateTime<Utc> = Utc::now();
    let timestamp = now.format("%Y%m%d_%H%M%S").to_string();
    let default_filename = format!("{}_{}_size{}_{}.pdf", 
        request.project_name,
        request.garment_type,
        request.size,
        timestamp
    );
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    let desktop_dir = format!("{}/Desktop", home_dir);
    let file_path = std::path::Path::new(&desktop_dir).join(&default_filename);
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    let (doc, page1, layer1) = PdfDocument::new(
        &format!("Professional Pattern - {}", request.project_name),
        Mm(exporter.page_width_mm as f32),
        Mm(exporter.page_height_mm as f32),
        "Layer 1"
    );
    let current_layer = doc.get_page(page1).get_layer(layer1);
    let font = doc.add_builtin_font(printpdf::BuiltinFont::HelveticaBold)
        .map_err(|e| format!("Failed to add font: {}", e))?;
    let title = format!("Professional Pattern - {} {} - Size {}", 
        request.project_name, 
        request.garment_type.to_uppercase(), 
        request.size
    );
    current_layer.use_text(title, 16.0, Mm(10.0), Mm(280.0), &font);
    let request_info = format!("Garment: {}, Size: {}, Scale: {:.2}, Pieces: {:?}", 
        request.garment_type, 
        request.size, 
        exporter.calculate_size_scale_factor(&request.size),
        request.pieces
    );
    current_layer.use_text(request_info, 10.0, Mm(10.0), Mm(265.0), &font);
    let scale_factor = exporter.calculate_size_scale_factor(&request.size);
    let pattern_dir = format!("../public/patterns/{}", request.garment_type);
    let mut total_pages = 1; 
    for piece_name in &request.pieces {
        let svg_path = format!("{}/{}.svg", pattern_dir, piece_name);
        let debug_info = format!("Attempting to load: {}", svg_path);
        let y_pos = 250.0 - (total_pages as f32 * 15.0);
        current_layer.use_text(
            debug_info,
            8.0,
            Mm(10.0),
            Mm(y_pos),
            &font
        );
        total_pages += 1;
        match exporter.load_pattern_svg(&svg_path) {
            Ok(mut piece) => {
                piece.scale_factor = scale_factor;
                let (pages_x, pages_y) = exporter.calculate_pages_needed(&piece, scale_factor);
                let _assembly_keys = exporter.generate_assembly_keys(pages_x, pages_y);
                let piece_info = format!(
                    "✓ {}: {:.1}x{:.1}mm (scaled), {} pages ({}x{})",
                    piece.name,
                    piece.width_mm * scale_factor,
                    piece.height_mm * scale_factor,
                    pages_x * pages_y,
                    pages_x,
                    pages_y
                );
                let y_pos_success = 250.0 - (total_pages as f32 * 15.0);
                current_layer.use_text(
                    piece_info,
                    8.0,
                    Mm(10.0),
                    Mm(y_pos_success),
                    &font
                );
                total_pages += pages_x * pages_y;
            }
            Err(e) => {
                let error_info = format!("✗ Failed to load {}: {}", piece_name, e);
                let y_pos_error = 250.0 - (total_pages as f32 * 15.0);
                current_layer.use_text(
                    error_info,
                    8.0,
                    Mm(10.0),
                    Mm(y_pos_error),
                    &font
                );
                total_pages += 1;
                continue;
            }
        }
    }
    doc.save(&mut std::io::BufWriter::new(
        std::fs::File::create(&file_path)
            .map_err(|e| format!("Failed to create PDF file: {}", e))?
    )).map_err(|e| format!("Failed to save PDF: {}", e))?;
    Ok(format!("Professional pattern exported to Desktop: {}", default_filename))
}