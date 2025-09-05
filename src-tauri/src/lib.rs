use base64::{ engine::general_purpose, Engine as _ };
use serde::{ Deserialize, Serialize };
use std::collections::HashMap;
use std::fs;
use ::image::{ ImageFormat, load_from_memory, imageops };
use printpdf::*;
use std::fs::File;
use std::io::BufWriter;
use tauri::Manager;
mod pattern_nesting;
mod professional_patterns;
mod subgraph;
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComfyUINode {
    pub id: String,
    pub class_type: String,
    pub title: String,
    pub inputs: HashMap<String, ComfyUIValue>,
    pub outputs: Vec<String>,
    pub position: Option<(f32, f32)>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ComfyUIValue {
    Text(String),
    Number(f64),
    Boolean(bool),
    Connection(Vec<serde_json::Value>),
    Null,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComfyUIWorkflow {
    pub nodes: Vec<ComfyUINode>,
    pub connections: Vec<ComfyUIConnection>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComfyUIConnection {
    pub from_node: String,
    pub from_output: usize,
    pub to_node: String,
    pub to_input: String,
}
#[tauri::command]
async fn save_image_with_dialog(image_data: String) -> Result<String, String> {
    let base64_data = if image_data.starts_with("data:image") {
        image_data.split(',').nth(1).ok_or("Invalid base64 image data")?
    } else {
        &image_data
    };
    general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    Ok("Ready for save dialog".to_string())
}
#[tauri::command]
async fn replicate_create_prediction(
    model_name: String,
    api_key: String,
    input: serde_json::Value
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("https://api.replicate.com/v1/models/{}/predictions", model_name);
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "input": input
        }))
        .send().await
        .map_err(|e| format!("Request failed: {}", e))?;
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("HTTP {}: {}", status, error_text));
    }
    let result: serde_json::Value = response
        .json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    Ok(result)
}
#[tauri::command]
async fn replicate_get_prediction(
    prediction_id: String,
    api_key: String
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("https://api.replicate.com/v1/predictions/{}", prediction_id);
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send().await
        .map_err(|e| format!("Request failed: {}", e))?;
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("HTTP {}: {}", status, error_text));
    }
    let result: serde_json::Value = response
        .json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    Ok(result)
}
#[tauri::command]
async fn download_image_as_base64(image_url: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(&image_url)
        .send().await
        .map_err(|e| format!("Failed to download image: {}", e))?;
    if !response.status().is_success() {
        return Err(format!("Failed to download image: HTTP {}", response.status()));
    }
    let bytes = response.bytes().await.map_err(|e| format!("Failed to read image bytes: {}", e))?;
    let base64_string = general_purpose::STANDARD.encode(&bytes);
    let data_url = format!("data:image/png;base64,{}", base64_string);
    Ok(data_url)
}
#[tauri::command]
async fn comfyui_execute_workflow(
    comfy_url: String,
    workflow_json: serde_json::Value,
    client_id: String
) -> Result<String, String> {
    let client = reqwest::Client
        ::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let prompt_url = format!("{}/prompt", comfy_url.trim_end_matches('/'));
    let request_body =
        serde_json::json!({
        "prompt": workflow_json,
        "client_id": client_id
    });
    let response = client
        .post(&prompt_url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send().await
        .map_err(|e| format!("Failed to submit workflow: {}", e))?;
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("HTTP {}: {}", status, error_text));
    }
    let result: serde_json::Value = response
        .json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    let prompt_id = result["prompt_id"].as_str().ok_or("No prompt_id in response")?.to_string();
    Ok(prompt_id)
}
#[tauri::command]
async fn comfyui_get_history(
    comfy_url: String,
    prompt_id: String
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client
        ::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let history_url = format!("{}/history/{}", comfy_url.trim_end_matches('/'), prompt_id);
    let response = client
        .get(&history_url)
        .send().await
        .map_err(|e| format!("Failed to get history: {}", e))?;
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("HTTP {}: {}", status, error_text));
    }
    let result: serde_json::Value = response
        .json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    Ok(result)
}
#[tauri::command]
async fn comfyui_upload_image(comfy_url: String, image_data: String) -> Result<String, String> {
    let client = reqwest::Client
        ::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let base64_data = if image_data.starts_with("data:image") {
        image_data.split(',').nth(1).ok_or("Invalid base64 image data")?
    } else {
        &image_data
    };
    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    let upload_url = format!("{}/upload/image", comfy_url.trim_end_matches('/'));
    let form = reqwest::multipart::Form::new().part(
        "image",
        reqwest::multipart::Part
            ::bytes(image_bytes)
            .file_name("canvas_input.png")
            .mime_str("image/png")
            .map_err(|e| format!("Failed to set mime type: {}", e))?
    );
    let response = client
        .post(&upload_url)
        .multipart(form)
        .send().await
        .map_err(|e| format!("Failed to upload image: {}", e))?;
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("HTTP {}: {}", status, error_text));
    }
    let result: serde_json::Value = response
        .json().await
        .map_err(|e| format!("Failed to parse upload response: {}", e))?;
    let filename = result["name"].as_str().ok_or("No filename in upload response")?.to_string();
    Ok(filename)
}
#[tauri::command]
async fn comfyui_download_image(
    comfy_url: String,
    filename: String,
    subfolder: Option<String>,
    image_type: Option<String>
) -> Result<String, String> {
    let client = reqwest::Client
        ::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let mut image_url = format!("{}/view?filename={}", comfy_url.trim_end_matches('/'), filename);
    if let Some(subfolder) = subfolder {
        if !subfolder.is_empty() {
            image_url.push_str(&format!("&subfolder={}", subfolder));
        }
    }
    if let Some(image_type) = image_type {
        if !image_type.is_empty() {
            image_url.push_str(&format!("&type={}", image_type));
        }
    }
    let response = client
        .get(&image_url)
        .send().await
        .map_err(|e| format!("Failed to download image: {}", e))?;
    if !response.status().is_success() {
        return Err(format!("Failed to download image: HTTP {}", response.status()));
    }
    let bytes = response.bytes().await.map_err(|e| format!("Failed to read image bytes: {}", e))?;
    let base64_string = general_purpose::STANDARD.encode(&bytes);
    let data_url = format!("data:image/png;base64,{}", base64_string);
    Ok(data_url)
}
#[tauri::command]
async fn write_image_file(image_data: String, file_path: String) -> Result<String, String> {
    let base64_data = if image_data.starts_with("data:image") {
        image_data.split(',').nth(1).ok_or("Invalid base64 image data")?
    } else {
        &image_data
    };
    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    fs::write(&file_path, image_bytes).map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(format!("Image saved successfully: {}", file_path))
}
#[tauri::command]
async fn export_pattern_to_tiff(
    image_data: String,
    file_path: String,
    width_inches: f32,
    height_inches: f32,
    dpi: u32
) -> Result<String, String> {
    let base64_data = if image_data.starts_with("data:image") {
        image_data.split(',').nth(1).ok_or("Invalid base64 image data")?
    } else {
        &image_data
    };
    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    let img = load_from_memory(&image_bytes).map_err(|e| format!("Failed to load image: {}", e))?;
    let width_pixels = (width_inches * (dpi as f32)) as u32;
    let height_pixels = (height_inches * (dpi as f32)) as u32;
    let resized = imageops::resize(
        &img,
        width_pixels,
        height_pixels,
        imageops::FilterType::Lanczos3
    );
    let output = File::create(&file_path).map_err(|e| format!("Failed to create file: {}", e))?;
    let mut writer = BufWriter::new(output);
    resized
        .write_to(&mut writer, ImageFormat::Tiff)
        .map_err(|e| format!("Failed to write TIFF: {}", e))?;
    Ok(format!("TIFF exported successfully: {}", file_path))
}
#[tauri::command]

async fn export_pattern_to_pdf(
    image_data: String,
    file_path: String,
    width_inches: f32,
    height_inches: f32,
    dpi: u32
) -> Result<String, String> {
    let base64_data = if image_data.starts_with("data:image") {
        image_data.split(',').nth(1).ok_or("Invalid base64 image data")?
    } else {
        &image_data
    };
    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    let img = load_from_memory(&image_bytes).map_err(|e| format!("Failed to load image: {}", e))?;
    let width_pixels = (width_inches * (dpi as f32)) as u32;
    let height_pixels = (height_inches * (dpi as f32)) as u32;
    let resized = imageops::resize(
        &img,
        width_pixels,
        height_pixels,
        imageops::FilterType::Lanczos3
    );
    let dyn_image = ::image::DynamicImage::ImageRgba8(resized);
    let rgb_image = dyn_image.to_rgb8();
    let (img_width, img_height) = rgb_image.dimensions();
    let image_aspect_ratio = (img_width as f32) / (img_height as f32);
    let page_aspect_ratio = width_inches / height_inches;
    let (page_width_mm, page_height_mm) = if image_aspect_ratio > page_aspect_ratio {
        let width_mm = width_inches * 25.4;
        let height_mm = width_mm / image_aspect_ratio;
        (width_mm, height_mm)
    } else {
        let height_mm = height_inches * 25.4;
        let width_mm = height_mm * image_aspect_ratio;
        (width_mm, height_mm)
    };
    let (doc, page1, layer1) = PdfDocument::new(
        "Pattern Export",
        Mm(page_width_mm),
        Mm(page_height_mm),
        "Layer 1"
    );
    let current_layer = doc.get_page(page1).get_layer(layer1);
    let raw_pixels: Vec<u8> = rgb_image.into_raw();
    let image = Image::from(ImageXObject {
        width: Px(img_width as usize),
        height: Px(img_height as usize),
        color_space: ColorSpace::Rgb,
        bits_per_component: ColorBits::Bit8,
        interpolate: true,
        image_data: raw_pixels,
        image_filter: None,
        clipping_bbox: None,
        smask: None,
    });
    image.add_to_layer(current_layer.clone(), ImageTransform {
        translate_x: Some(Mm(0.0)),
        translate_y: Some(Mm(0.0)),
        scale_x: Some(page_width_mm / (((img_width as f32) * 25.4) / (dpi as f32))),
        scale_y: Some(page_height_mm / (((img_height as f32) * 25.4) / (dpi as f32))),
        ..Default::default()
    });
    doc
        .save(
            &mut BufWriter::new(
                File::create(&file_path).map_err(|e| format!("Failed to create PDF: {}", e))?
            )
        )
        .map_err(|e| format!("Failed to save PDF: {}", e))?;
    Ok(format!("PDF exported successfully: {}", file_path))
}
#[tauri::command]
async fn parse_comfyui_workflow(workflow_json: String) -> Result<ComfyUIWorkflow, String> {
    let raw_workflow: HashMap<String, serde_json::Value> = serde_json
        ::from_str(&workflow_json)
        .map_err(|e| format!("Failed to parse workflow JSON: {}", e))?;
    let mut nodes = Vec::new();
    let mut connections = Vec::new();
    for (node_id, node_data) in raw_workflow {
        let node_obj = node_data
            .as_object()
            .ok_or(format!("Invalid node data for node {}", node_id))?;
        let class_type = node_obj
            .get("class_type")
            .and_then(|v| v.as_str())
            .ok_or(format!("Missing class_type for node {}", node_id))?
            .to_string();
        let title = node_obj
            .get("_meta")
            .and_then(|meta| meta.get("title"))
            .and_then(|title| title.as_str())
            .unwrap_or(&class_type)
            .to_string();
        let empty_map = serde_json::Map::new();
        let inputs_obj = node_obj
            .get("inputs")
            .and_then(|v| v.as_object())
            .unwrap_or(&empty_map);
        let mut inputs = HashMap::new();
        for (input_name, input_value) in inputs_obj {
            match input_value {
                serde_json::Value::String(s) => {
                    inputs.insert(input_name.clone(), ComfyUIValue::Text(s.clone()));
                }
                serde_json::Value::Number(n) => {
                    inputs.insert(
                        input_name.clone(),
                        ComfyUIValue::Number(n.as_f64().unwrap_or(0.0))
                    );
                }
                serde_json::Value::Bool(b) => {
                    inputs.insert(input_name.clone(), ComfyUIValue::Boolean(*b));
                }
                serde_json::Value::Array(arr) if arr.len() == 2 => {
                    let src_node = if let Some(s) = arr[0].as_str() {
                        s.to_string()
                    } else if let Some(n) = arr[0].as_u64() {
                        n.to_string()
                    } else {
                        "unknown".to_string()
                    };
                    if let Some(output_idx) = arr[1].as_u64() {
                        connections.push(ComfyUIConnection {
                            from_node: src_node.clone(),
                            from_output: output_idx as usize,
                            to_node: node_id.clone(),
                            to_input: input_name.clone(),
                        });
                    }
                    inputs.insert(input_name.clone(), ComfyUIValue::Connection(arr.clone()));
                }
                serde_json::Value::Null => {
                    inputs.insert(input_name.clone(), ComfyUIValue::Null);
                }
                _ => {
                    inputs.insert(input_name.clone(), ComfyUIValue::Text(input_value.to_string()));
                }
            }
        }
        nodes.push(ComfyUINode {
            id: node_id,
            class_type,
            title,
            inputs,
            outputs: Vec::new(),
            position: None,
        });
    }
    for node in &mut nodes {
        let mut used_outputs = std::collections::HashSet::new();
        for connection in &connections {
            if connection.from_node == node.id {
                used_outputs.insert(connection.from_output);
            }
        }
        let mut output_list: Vec<usize> = used_outputs.into_iter().collect();
        output_list.sort();
        node.outputs = output_list
            .into_iter()
            .map(|i| format!("output_{}", i))
            .collect();
    }
    Ok(ComfyUIWorkflow { nodes, connections })
}
#[tauri::command]
async fn comfyui_get_models(comfy_url: String, model_type: String) -> Result<Vec<String>, String> {
    let client = reqwest::Client
        ::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let models_url = match model_type.as_str() {
        "VAELoader" => format!("{}/models/vae", comfy_url.trim_end_matches('/')),
        "CheckpointLoaderSimple" =>
            format!("{}/models/checkpoints", comfy_url.trim_end_matches('/')),
        "LoraLoader" => format!("{}/models/loras", comfy_url.trim_end_matches('/')),
        "UnetLoaderGGUF" => format!("{}/models/unet_gguf", comfy_url.trim_end_matches('/')),
        "CLIPLoaderGGUF" => format!("{}/models/clip_gguf", comfy_url.trim_end_matches('/')),
        _ => {
            return Err(format!("Unsupported model type: {}", model_type));
        }
    };
    let response = client
        .get(&models_url)
        .timeout(std::time::Duration::from_secs(10))
        .send().await
        .map_err(|e| format!("Failed to get models: {}", e))?;
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("HTTP {}: {}", status, error_text));
    }
    let models: Vec<String> = response
        .json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    Ok(models)
}
#[tauri::command]
async fn get_node_info(class_type: String) -> Result<serde_json::Value, String> {
    let node_info = match class_type.as_str() {
        "CLIPTextEncode" =>
            serde_json::json!({
            "category": "conditioning",
            "description": "Encode text prompts using CLIP",
            "input_types": {
                "text": "TEXT",
                "clip": "CLIP"
            },
            "output_types": ["CONDITIONING"],
            "color": "#4A90E2"
        }),
        "KSampler" =>
            serde_json::json!({
            "category": "sampling",
            "description": "Main sampling node for image generation",
            "input_types": {
                "model": "MODEL",
                "positive": "CONDITIONING",
                "negative": "CONDITIONING",
                "latent_image": "LATENT",
                "seed": "INT",
                "steps": "INT",
                "cfg": "FLOAT",
                "sampler_name": "TEXT",
                "scheduler": "TEXT",
                "denoise": "FLOAT"
            },
            "output_types": ["LATENT"],
            "color": "#E74C3C"
        }),
        "VAEDecode" =>
            serde_json::json!({
            "category": "latent",
            "description": "Decode latent to image",
            "input_types": {
                "samples": "LATENT",
                "vae": "VAE"
            },
            "output_types": ["IMAGE"],
            "color": "#9B59B6"
        }),
        "VAELoader" =>
            serde_json::json!({
            "category": "loaders",
            "description": "Load VAE model",
            "input_types": {
                "vae_name": "VAE_NAME"
            },
            "output_types": ["VAE"],
            "color": "#16A085"
        }),
        "LoraLoader" =>
            serde_json::json!({
            "category": "loaders",
            "description": "Load LoRA model",
            "input_types": {
                "model": "MODEL",
                "clip": "CLIP", 
                "lora_name": "LORA_NAME",
                "strength_model": "FLOAT",
                "strength_clip": "FLOAT"
            },
            "output_types": ["MODEL", "CLIP"],
            "color": "#8E44AD"
        }),
        "UnetLoaderGGUF" =>
            serde_json::json!({
            "category": "loaders",
            "description": "Load UNET GGUF model",
            "input_types": {
                "unet_name": "UNET_NAME"
            },
            "output_types": ["MODEL"],
            "color": "#2E7D32"
        }),
        "CLIPLoaderGGUF" =>
            serde_json::json!({
            "category": "loaders",
            "description": "Load CLIP GGUF model", 
            "input_types": {
                "clip_name": "CLIP_NAME"
            },
            "output_types": ["CLIP"],
            "color": "#1976D2"
        }),
        _ =>
            serde_json::json!({
            "category": "unknown",
            "description": "Unknown node type",
            "input_types": {},
            "output_types": ["UNKNOWN"],
            "color": "#95A5A6"
        }),
    };
    Ok(node_info)
}
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
pub struct PatternExportRequest {
    pub pieces: Vec<PatternPieceExport>,
    pub garment_type: String,
    pub size: String,
    pub canvas_width_mm: f64,
    pub canvas_height_mm: f64,
    pub is_manual_mode: bool,
    pub project_name: String,
    pub chest_mm: f64,
    pub length_mm: f64,
}

#[tauri::command]
async fn fetch_template_children() -> Result<Vec<subgraph::GroupedTemplate>, String> {
    subgraph::fetch_grouped_templates().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    tauri::Builder
        ::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_deep_link::init())
        .invoke_handler(
            tauri::generate_handler![
                save_image_with_dialog,
                write_image_file,
                replicate_create_prediction,
                replicate_get_prediction,
                download_image_as_base64,
                comfyui_execute_workflow,
                comfyui_get_history,
                comfyui_upload_image,
                comfyui_download_image,
                parse_comfyui_workflow,
                get_node_info,
                comfyui_get_models,
                export_pattern_to_tiff,
                pattern_nesting::nest_pattern_pieces,
                pattern_nesting::get_live_sparrow_svg,
                pattern_nesting::get_sparrow_stats,
                pattern_nesting::cancel_sparrow_process,
                professional_patterns::export_professional_pattern,
                fetch_template_children
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
