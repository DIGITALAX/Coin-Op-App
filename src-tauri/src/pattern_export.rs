use svg2pdf::{ usvg, ConversionOptions };
use chrono;
use regex::Regex;
use lopdf::{Document, Object};

fn svg_to_pdf_bytes(svg: &str, dpi: f32) -> Result<Vec<u8>, String> {
    let mut uopts = usvg::Options::default();
    uopts.fontdb_mut().load_system_fonts();
    let tree = usvg::Tree::from_str(svg, &uopts)
        .map_err(|e| format!("SVG parse failed: {:?}", e))?;
    let page_options = svg2pdf::PageOptions { dpi };
    svg2pdf::to_pdf(&tree, ConversionOptions::default(), page_options)
        .map_err(|e| format!("SVG to PDF failed: {:?}", e))
}

fn merge_pdfs(pdfs: &[Vec<u8>]) -> Result<Vec<u8>, String> {
    if pdfs.is_empty() {
        return Err("no hay PDFs para unir".into());
    }

    let documents: Result<Vec<Document>, _> = pdfs
        .iter()
        .map(|bytes| Document::load_mem(bytes))
        .collect();
    
    let documents = documents.map_err(|e| format!("lopdf load: {e:?}"))?;

    use std::collections::BTreeMap;
    use lopdf::ObjectId;

    let mut max_id = 1;
    let mut documents_pages = BTreeMap::new();
    let mut documents_objects = BTreeMap::new();
    let mut document = Document::with_version("1.5");

    for mut doc in documents {
        doc.renumber_objects_with(max_id);
        max_id = doc.max_id + 1;

        documents_pages.extend(
            doc.get_pages()
                .into_values()
                .map(|object_id| {
                    (object_id, doc.get_object(object_id).unwrap().to_owned())
                })
                .collect::<BTreeMap<ObjectId, Object>>(),
        );
        documents_objects.extend(doc.objects);
    }

    let mut catalog_object: Option<(ObjectId, Object)> = None;
    let mut pages_object: Option<(ObjectId, Object)> = None;

    for (object_id, object) in documents_objects.iter() {
        match object.type_name().unwrap_or("") {
            "Catalog" => {
                catalog_object = Some((
                    if let Some((id, _)) = catalog_object {
                        id
                    } else {
                        *object_id
                    },
                    object.clone(),
                ));
            }
            "Pages" => {
                if let Ok(dictionary) = object.as_dict() {
                    let mut dictionary = dictionary.clone();
                    if let Some((_, ref object)) = pages_object {
                        if let Ok(old_dictionary) = object.as_dict() {
                            dictionary.extend(old_dictionary);
                        }
                    }

                    pages_object = Some((
                        if let Some((id, _)) = pages_object {
                            id
                        } else {
                            *object_id
                        },
                        Object::Dictionary(dictionary),
                    ));
                }
            }
            "Page" => {}
            "Outlines" => {}
            "Outline" => {}
            _ => {
                document.objects.insert(*object_id, object.clone());
            }
        }
    }

    if pages_object.is_none() {
        return Err("Pages root not found".into());
    }

    for (object_id, object) in documents_pages.iter() {
        if let Ok(dictionary) = object.as_dict() {
            let mut dictionary = dictionary.clone();
            dictionary.set("Parent", pages_object.as_ref().unwrap().0);

            document
                .objects
                .insert(*object_id, Object::Dictionary(dictionary));
        }
    }

    if catalog_object.is_none() {
        return Err("Catalog root not found".into());
    }

    let catalog_object = catalog_object.unwrap();
    let pages_object = pages_object.unwrap();

    if let Ok(dictionary) = pages_object.1.as_dict() {
        let mut dictionary = dictionary.clone();
        dictionary.set("Count", documents_pages.len() as u32);
        dictionary.set(
            "Kids",
            documents_pages
                .into_keys()
                .map(Object::Reference)
                .collect::<Vec<_>>(),
        );

        document
            .objects
            .insert(pages_object.0, Object::Dictionary(dictionary));
    }

    if let Ok(dictionary) = catalog_object.1.as_dict() {
        let mut dictionary = dictionary.clone();
        dictionary.set("Pages", pages_object.0);
        dictionary.remove(b"Outlines");

        document
            .objects
            .insert(catalog_object.0, Object::Dictionary(dictionary));
    }

    document.trailer.set("Root", catalog_object.0);
    document.max_id = document.objects.len() as u32;
    document.renumber_objects();
    document.adjust_zero_pages();
    document.compress();

    let mut out = Vec::new();
    document.save_to(&mut out).map_err(|e| format!("lopdf save: {e:?}"))?;
    Ok(out)
}

#[tauri::command]
pub async fn export_pattern_to_pdf(
    svg_string: String,
    out_path: Option<String>
) -> Result<String, String> {
    
    let output_path = out_path.unwrap_or_else(|| {
        format!("pattern_export_{}.pdf", chrono::Utc::now().format("%Y%m%d_%H%M%S"))
    });

    if let Some(page_svgs) = extract_data_pages(&svg_string) {
        let dpi = 96.0;
        let mut page_pdfs = Vec::with_capacity(page_svgs.len());
        for (i, s) in page_svgs.iter().enumerate() {
            let bytes = svg_to_pdf_bytes(s, dpi)
                .map_err(|e| format!("page {}: {}", i + 1, e))?;
            page_pdfs.push(bytes);
        }
        let merged = merge_pdfs(&page_pdfs)?;
        std::fs::write(&output_path, merged)
            .map_err(|e| format!("write merged pdf: {e}"))?;
        return Ok(output_path);
    }

    let bytes = svg_to_pdf_bytes(&svg_string, 96.0)?;
    std::fs::write(&output_path, bytes)
        .map_err(|e| format!("write pdf: {e}"))?;
    Ok(output_path)
}

fn extract_data_pages(svg_string: &str) -> Option<Vec<String>> {
    let re = Regex::new(r#"data-pages="([^"]+)""#).ok()?;
    let captures = re.captures(svg_string)?;
    let json_str = captures.get(1)?.as_str();
    
    let json_str = json_str
        .replace("&quot;", "\"")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&");
    
    serde_json::from_str::<Vec<String>>(&json_str).ok()
}


