use serde::{ Deserialize, Serialize };
use serde_json::json;
use tauri::command;
use std::path::Path;
use anyhow::Result;
use regex::Regex;
use std::sync::{ Arc, Mutex };
use std::process::{ Child, Command };
#[cfg(unix)]
use std::os::unix::process::CommandExt;
use once_cell::sync::Lazy;
use reqwest;
static SPARROW_PROCESS: Lazy<Arc<Mutex<Option<Child>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

#[derive(Debug, Serialize, Deserialize)]
pub struct NestingResult {
    pub placed_items: Vec<PlacedItem>,
    pub strip_height: f64,
    pub utilization: f64,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct SparrowStats {
    pub iteration: String,
    pub strip_width: String,
    pub phase: String,
    pub utilization: f64,
    pub height: String,
    pub width: String,
    pub density: String,
    pub full_stats: String,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct PlacedItem {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub rotation: f64,
}
#[derive(Debug, Deserialize)]
pub struct NestingRequest {
    pub pattern_pieces: Vec<PatternPiece>,
    pub settings: NestingSettings,
}
#[derive(Debug, Deserialize)]
pub struct NestingSettings {
    #[serde(rename = "minItemSeparation")]
    pub min_item_separation: f64,
    #[serde(rename = "allowedRotations")]
    pub allowed_rotations: Vec<f64>,
    #[serde(rename = "stripWidthMultiplier")]
    pub strip_width_multiplier: f64,
    #[serde(rename = "iterationLimit")]
    pub iteration_limit: u64,
    #[serde(rename = "strikeLimit")]
    pub strike_limit: u64,
}
#[derive(Debug, Deserialize)]
pub struct PatternPiece {
    pub svg_path: String,
    pub demand: i32,
}
#[command]
pub async fn nest_pattern_pieces(request: NestingRequest) -> Result<NestingResult, String> {
    let temp_dir = std::env::temp_dir().join("coinop_sparrow_custom");
    std::fs::create_dir_all(&temp_dir).map_err(|e| format!("Failed to create temp dir: {}", e))?;
    let custom_json = convert_svgs_to_sparrow_json(request).await.map_err(|e|
        format!("SVG conversion failed: {}", e)
    )?;
    let json_dest = temp_dir.join("custom_patterns.json");
    std::fs::write(&json_dest, custom_json).map_err(|e| format!("Failed to write JSON: {}", e))?;
    let sparrow_binary = Path::new("../sparrow/target/release/sparrow");
    if !sparrow_binary.exists() {
        return Err(
            "Sparrow binary not found. Run: cd ../sparrow && cargo build --release".to_string()
        );
    }
    let json_path = json_dest.to_string_lossy();
    let mut command = Command::new("cargo");
    command
        .args(&["run", "--release", "--features=live_svg", "--", "-i", &json_path, "-t", "60"])
        .current_dir("../sparrow");
    
    #[cfg(unix)]
    command.process_group(0);
    
    let child = command
        .spawn()
        .map_err(|e| format!("Failed to start Sparrow binary: {} (Make sure to build with: cargo build --release --features=live_svg)", e))?;
    
    let pid = child.id();
    eprintln!("DEBUG: Spawned Sparrow with PID: {}", pid);
    
    {
        let mut process_guard = SPARROW_PROCESS.lock().unwrap();
        *process_guard = Some(child);
    }
    Ok(NestingResult {
        placed_items: vec![],
        strip_height: 400.0,
        utilization: 0.0,
    })
}
#[command]
pub async fn get_live_sparrow_svg() -> Result<String, String> {
    let live_svg_path = Path::new("../sparrow/data/live/.live_solution.svg");
    if live_svg_path.exists() {
        let svg_content = std::fs
            ::read_to_string(live_svg_path)
            .map_err(|e| format!("Failed to read live SVG: {}", e))?;
        
        Ok(svg_content)
    } else {
        Err("Live SVG not yet available".to_string())
    }
}
#[command]
pub async fn get_sparrow_stats() -> Result<SparrowStats, String> {
    let live_svg_path = Path::new("../sparrow/data/live/.live_solution.svg");
    if live_svg_path.exists() {
        let svg_content = std::fs
            ::read_to_string(live_svg_path)
            .map_err(|e| format!("Failed to read live SVG: {}", e))?;
        let stats = extract_stats_from_svg(&svg_content);
        Ok(stats)
    } else {
        Err("Live stats not yet available".to_string())
    }
}

#[command] 
pub async fn is_sparrow_process_running() -> Result<bool, String> {
    let mut process_guard = SPARROW_PROCESS.lock().unwrap();
    if let Some(child) = process_guard.as_mut() {
        match child.try_wait() {
            Ok(Some(_exit_status)) => {
                *process_guard = None;
                Ok(false)
            }
            Ok(None) => Ok(true),
            Err(_) => {
                *process_guard = None;
                Ok(false)
            }
        }
    } else {
        Ok(false)
    }
}

#[command]
pub async fn clear_sparrow_data() -> Result<String, String> {
    let live_data_dir = Path::new("../sparrow/data/live/");
    if live_data_dir.exists() {
        if let Err(e) = std::fs::remove_dir_all(live_data_dir) {
            return Err(format!("Failed to clear Sparrow data: {}", e));
        }
    }
    if let Err(e) = std::fs::create_dir_all(live_data_dir) {
        return Err(format!("Failed to recreate live data directory: {}", e));
    }
    Ok("Sparrow data cleared".to_string())
}

#[command]
pub async fn cancel_sparrow_process() -> Result<String, String> {
    let mut process_guard = SPARROW_PROCESS.lock().unwrap();
    if let Some(child) = process_guard.take() {
        let pid = child.id() as i32;
        eprintln!("DEBUG: Attempting to kill process with PID: {}", pid);
        
        #[cfg(unix)]
        {
            unsafe {
                let result = libc::kill(-pid, libc::SIGKILL);
                eprintln!("DEBUG: kill(-{}, SIGKILL) returned: {}", pid, result);

                if result != 0 {
                    #[cfg(target_os = "macos")]
                    let errno = *libc::__error();
                    #[cfg(target_os = "linux")]
                    let errno = *libc::__errno_location();
                    eprintln!("DEBUG: errno: {}", errno);
                }
            }
        }
        
        #[cfg(not(unix))]
        {
            let mut child = child;
            let _ = child.kill();
        }
        
        Ok(format!("Kill attempted for PID: {}", pid))
    } else {
        Ok("No Sparrow process running".to_string())
    }
}
async fn convert_svgs_to_sparrow_json(request: NestingRequest) -> Result<String> {
    let mut all_dimensions = Vec::new();
    for piece in &request.pattern_pieces {
        let svg_content = get_svg_content(&piece.svg_path).await?;
        let coordinates = parse_svg_to_coordinates(&svg_content)?;
        let mut min_x = coordinates[0][0];
        let mut max_x = coordinates[0][0];
        let mut min_y = coordinates[0][1];
        let mut max_y = coordinates[0][1];
        for coord in &coordinates {
            min_x = min_x.min(coord[0]);
            max_x = max_x.max(coord[0]);
            min_y = min_y.min(coord[1]);
            max_y = max_y.max(coord[1]);
        }
        let width = max_x - min_x;
        let height = max_y - min_y;
        let max_dimension = width.max(height);
        all_dimensions.push(max_dimension);
    }
    let global_max_dimension = all_dimensions.iter().fold(0.0f64, |acc, &x| acc.max(x));
    let global_scale_factor = if global_max_dimension > 0.0 {
        40.0 / global_max_dimension
    } else {
        1.0
    };
    let mut items = Vec::new();
    let mut item_id = 0;
    for piece in request.pattern_pieces {
        let svg_content = get_svg_content(&piece.svg_path).await?;
        let coordinates = parse_svg_to_coordinates_with_scale(&svg_content, global_scale_factor)?;
        let item =
            json!({
            "id": item_id,
            "demand": piece.demand,
            "dxf": format!("custom_{}.dxf", item_id),
            "allowed_orientations": request.settings.allowed_rotations,
            "shape": {
                "type": "simple_polygon", 
                "data": coordinates
            }
        });
        items.push(item);
        item_id += 1;
    }
    let pattern_count = items.len() as f64;
    let target_pattern_size = 30.0;
    let base_constraint = target_pattern_size * pattern_count.max(2.0);
    
    let scaled_strip_width = base_constraint / request.settings.strip_width_multiplier;
    let sparrow_json =
        json!({
        "name": "custom_patterns", 
        "items": items,
        "strip_height": scaled_strip_width,  
        "min_item_separation": request.settings.min_item_separation,
        "iteration_limit": request.settings.iteration_limit,
        "strike_limit": request.settings.strike_limit
    });
    let json_string = serde_json::to_string_pretty(&sparrow_json)?;
    Ok(json_string)
}
fn parse_svg_to_coordinates(svg_content: &str) -> Result<Vec<[f64; 2]>> {
    parse_svg_to_coordinates_with_scale(svg_content, 1.0)
}
fn parse_svg_to_coordinates_with_scale(
    svg_content: &str,
    scale_factor: f64
) -> Result<Vec<[f64; 2]>> {
    let path_regex = Regex::new(r#"<path[^>]*\sd="([^"]*)"[^>]*/?>"#).unwrap();
    let polygon_regex = Regex::new(r#"<polygon[^>]*\spoints="([^"]*)"[^>]*/?>"#).unwrap();
    
    let coordinates = if let Some(captures) = path_regex.captures(svg_content) {
        let path_data = captures.get(1).unwrap().as_str();
        parse_path_data(path_data)?
    } else if let Some(captures) = polygon_regex.captures(svg_content) {
        let points_data = captures.get(1).unwrap().as_str();
        parse_polygon_points(points_data)?
    } else {
        return Err(anyhow::anyhow!("No path or polygon element found in SVG"));
    };
    
    if coordinates.is_empty() {
        return Err(anyhow::anyhow!("No coordinates extracted from SVG"));
    }
    
    let mut min_x = coordinates[0][0];
    let mut max_x = coordinates[0][0];
    let mut min_y = coordinates[0][1];
    let mut max_y = coordinates[0][1];
    for coord in &coordinates {
        min_x = min_x.min(coord[0]);
        max_x = max_x.max(coord[0]);
        min_y = min_y.min(coord[1]);
        max_y = max_y.max(coord[1]);
    }
    
    let mut scaled_coordinates = Vec::new();
    for coord in coordinates {
        let scaled_x = (coord[0] - min_x) * scale_factor;
        let scaled_y = (coord[1] - min_y) * scale_factor;
        scaled_coordinates.push([scaled_x, scaled_y]);
    }
    Ok(scaled_coordinates)
}

fn parse_polygon_points(points_data: &str) -> Result<Vec<[f64; 2]>> {
    let mut coordinates = Vec::new();
    let coords: Vec<f64> = points_data
        .split_whitespace()
        .filter_map(|s| s.parse::<f64>().ok())
        .collect();
    
    for i in (0..coords.len()).step_by(2) {
        if i + 1 < coords.len() {
            coordinates.push([coords[i], coords[i + 1]]);
        }
    }
    Ok(coordinates)
}

fn parse_path_data(path_data: &str) -> Result<Vec<[f64; 2]>> {
    let mut coordinates = Vec::new();
    let mut current_x = 0.0;
    let mut current_y = 0.0;
    let mut start_x = 0.0;
    let mut start_y = 0.0;
    let mut tokens = Vec::new();
    let mut current_token = String::new();
    for ch in path_data.chars() {
        match ch {
            | 'M'
            | 'm'
            | 'L'
            | 'l'
            | 'H'
            | 'h'
            | 'V'
            | 'v'
            | 'C'
            | 'c'
            | 'S'
            | 's'
            | 'Q'
            | 'q'
            | 'T'
            | 't'
            | 'A'
            | 'a'
            | 'Z'
            | 'z' => {
                if !current_token.is_empty() {
                    tokens.push(current_token.trim().to_string());
                    current_token.clear();
                }
                tokens.push(ch.to_string());
            }
            '0'..='9' | '.' | '-' => {
                current_token.push(ch);
            }
            ' ' | ',' | '\t' | '\n' | '\r' => {
                if !current_token.is_empty() {
                    tokens.push(current_token.trim().to_string());
                    current_token.clear();
                }
            }
            _ => {}
        }
    }
    if !current_token.is_empty() {
        tokens.push(current_token.trim().to_string());
    }
    let mut i = 0;
    while i < tokens.len() {
        let token = &tokens[i];
        if token.len() == 1 && token.chars().next().unwrap().is_alphabetic() {
            let command = token.chars().next().unwrap();
            i += 1;
            match command {
                'M' | 'm' => {
                    if i + 1 < tokens.len() {
                        if
                            let (Ok(x), Ok(y)) = (
                                tokens[i].parse::<f64>(),
                                tokens[i + 1].parse::<f64>(),
                            )
                        {
                            if command == 'M' {
                                current_x = x;
                                current_y = y;
                            } else {
                                current_x += x;
                                current_y += y;
                            }
                            start_x = current_x;
                            start_y = current_y;
                            coordinates.push([current_x, current_y]);
                        }
                        i += 2;
                        while i + 1 < tokens.len() {
                            if
                                tokens[i].len() == 1 &&
                                tokens[i].chars().next().unwrap().is_alphabetic()
                            {
                                break;
                            }
                            if
                                let (Ok(x), Ok(y)) = (
                                    tokens[i].parse::<f64>(),
                                    tokens[i + 1].parse::<f64>(),
                                )
                            {
                                if command == 'M' {
                                    current_x = x;
                                    current_y = y;
                                } else {
                                    current_x += x;
                                    current_y += y;
                                }
                                coordinates.push([current_x, current_y]);
                            }
                            i += 2;
                        }
                    }
                }
                'L' | 'l' => {
                    while i + 1 < tokens.len() {
                        if
                            tokens[i].len() == 1 &&
                            tokens[i].chars().next().unwrap().is_alphabetic()
                        {
                            break;
                        }
                        if
                            let (Ok(x), Ok(y)) = (
                                tokens[i].parse::<f64>(),
                                tokens[i + 1].parse::<f64>(),
                            )
                        {
                            if command == 'L' {
                                current_x = x;
                                current_y = y;
                            } else {
                                current_x += x;
                                current_y += y;
                            }
                            coordinates.push([current_x, current_y]);
                        }
                        i += 2;
                    }
                }
                'z' | 'Z' => {
                    if current_x != start_x || current_y != start_y {
                        coordinates.push([start_x, start_y]);
                    }
                }
                _ => {}
            }
        } else {
            i += 1;
        }
    }
    if coordinates.is_empty() {
        return Err(anyhow::anyhow!("No coordinates extracted from path"));
    }
    Ok(coordinates)
}
fn extract_stats_from_svg(svg_content: &str) -> SparrowStats {
    let text_regex = Regex::new(r"<text[^>]*>(.*?)</text>").unwrap();
    let mut texts = Vec::new();
    for cap in text_regex.captures_iter(svg_content) {
        let text = cap.get(1).unwrap().as_str().to_string();
        texts.push(text);
    }
    let mut iteration = "0".to_string();
    let mut strip_width = "0".to_string();
    let mut phase = "starting".to_string();
    let mut height = "0".to_string();
    let mut width = "0".to_string();
    let mut density = "0%".to_string();
    let mut full_stats = "".to_string();
    for text in &texts {
        if text.contains("h:") && text.contains("w:") && text.contains("d:") {
            full_stats = text.clone();
            break;
        }
    }
    if full_stats.is_empty() {
        if let Some(stats_start) = svg_content.find("h:") {
            let stats_section = &svg_content[stats_start..];
            if let Some(end_pos) = stats_section.find('\n').or(stats_section.find("</text>")) {
                full_stats = stats_section[..end_pos].trim().to_string();
            }
        }
    }
    if !full_stats.is_empty() {
        let text = &full_stats;
        if let Some(h_cap) = Regex::new(r"h:\s*([0-9.]+)").unwrap().captures(text) {
            height = h_cap.get(1).unwrap().as_str().to_string();
        }
        if let Some(w_cap) = Regex::new(r"w:\s*([0-9.]+)").unwrap().captures(text) {
            width = w_cap.get(1).unwrap().as_str().to_string();
        }
        if let Some(d_cap) = Regex::new(r"d:\s*([0-9.]+%?)").unwrap().captures(text) {
            density = d_cap.get(1).unwrap().as_str().to_string();
        }
        if
            let Some(filename_cap) = Regex::new(r"([0-9]+)_([0-9.]+)_([a-zA-Z_]+)")
                .unwrap()
                .captures(text)
        {
            iteration = filename_cap.get(1).unwrap().as_str().to_string();
            strip_width = filename_cap.get(2).unwrap().as_str().to_string();
            let phase_part = filename_cap.get(3).unwrap().as_str();
            phase = match phase_part {
                p if p.starts_with("expl") => "Exploration".to_string(),
                p if p.starts_with("cmpr") => "Compression".to_string(),
                "final" => "Complete".to_string(),
                _ => phase_part.to_string(),
            };
        }
    }
    let utilization = if let Some(percent_pos) = density.find('%') {
        density[..percent_pos].parse::<f64>().unwrap_or(0.0) / 100.0
    } else {
        0.0
    };
    SparrowStats {
        iteration,
        strip_width,
        phase,
        utilization,
        height,
        width,
        density,
        full_stats,
    }
}

async fn get_svg_content(svg_path: &str) -> Result<String> {
    let ipfs_url = if svg_path.starts_with("ipfs://") {
        format!("https://thedial.infura-ipfs.io/ipfs/{}", svg_path.replace("ipfs://", ""))
    } else if svg_path.starts_with("Qm") {
        format!("https://thedial.infura-ipfs.io/ipfs/{}", svg_path)
    } else {
        return Err(anyhow::anyhow!("Invalid SVG path format. Expected IPFS URI but got: {}", svg_path));
    };
    
    let response = reqwest::get(&ipfs_url).await?;
    if response.status().is_success() {
        let svg_content = response.text().await?;
        Ok(svg_content)
    } else {
        Err(anyhow::anyhow!("Failed to fetch IPFS content from: {}", ipfs_url))
    }
}
