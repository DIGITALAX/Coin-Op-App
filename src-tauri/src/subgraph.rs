use serde::{Deserialize, Serialize};

const INFURA_GATEWAY: &str = "https://thedial.infura-ipfs.io/ipfs";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TemplateChoice {
    pub name: String,
    pub template_type: String,
    pub image: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GroupedTemplate {
    pub name: String,
    pub template_type: String,
    pub image: String,
    pub templates: Vec<TemplateData>,
}

fn get_template_choices() -> Vec<TemplateChoice> {
    vec![
        TemplateChoice {
            name: "Hoodie".to_string(),
            template_type: "hoodie".to_string(),
            image: "QmVhSyXB67nUj1yH7GmojxvkoAdsrAumJkXs5rECnN7Cfj".to_string(),
        },
        TemplateChoice {
            name: "Shirt".to_string(), 
            template_type: "shirt".to_string(),
            image: "QmRXrv2icSyRi5P7VEx9yWh66VQB9UiiYPSt2NDkuGAcB9".to_string(),
        },
        TemplateChoice {
            name: "Poster".to_string(),
            template_type: "poster".to_string(), 
            image: "QmXSKZvk6iHtqRN9e3GEZPKRiDTUD72RY7w84ya2t3mRdZ".to_string(),
        },
        TemplateChoice {
            name: "Sticker".to_string(),
            template_type: "sticker".to_string(),
            image: "QmV3Au8Vz2HZ4cfP5Jp5WsD47umg67rN11Y47a5mdL7dnm".to_string(),
        },
    ]
}

fn get_template_type_from_tags(tags: &[String]) -> Option<String> {
    for tag in tags {
        let tag_lower = tag.to_lowercase();
        if tag_lower == "t-shirt" || tag_lower == "shirt" {
            return Some("shirt".to_string());
        } else if tag_lower == "hoodie" {
            return Some("hoodie".to_string());
        } else if tag_lower == "poster" {
            return Some("poster".to_string());
        } else if tag_lower == "sticker" {
            return Some("sticker".to_string());
        }
    }
    None
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TemplateData {
    pub price: String,
    #[serde(rename = "childType")]
    pub child_type: String,
    #[serde(rename = "templateContract")]
    pub template_contract: String,
    #[serde(rename = "templateId")]
    pub template_id: String,
    pub currency: String,
    #[serde(rename = "childReferences")]
    pub child_references: Vec<ChildReference>,
    pub metadata: Option<TemplateMetadata>,
    pub uri: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TemplateMetadata {
    pub title: Option<String>,
    pub image: Option<String>,
    pub tags: Option<Vec<String>>,
    pub ratio: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChildReference {
    pub uri: String,
    #[serde(rename = "childId")]
    pub child_id: String,
    #[serde(rename = "childContract")]
    pub child_contract: String,
    pub price: String,
    pub child: Option<Child>,
    pub metadata: Option<Metadata>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Child {
    pub metadata: Option<ChildMetadata>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChildMetadata {
    pub title: Option<String>,
    pub image: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Metadata {
    pub title: Option<String>,
    pub image: Option<String>,
    pub tags: Option<Vec<String>>,
    pub location: Option<String>,
    pub scale: Option<f64>,
    pub ratio: Option<f64>,
    pub flip: Option<f64>,
    pub rotation: Option<f64>,
    pub x: Option<f64>,
    pub y: Option<f64>,
}

async fn fetch_ipfs_metadata(uri: &str, client: &reqwest::Client) -> Option<Metadata> {
    if uri.is_empty() {
        return None;
    }

    let ipfs_hash = if uri.starts_with("ipfs://") {
        &uri[7..]
    } else {
        uri
    };

    let url = format!("{}/{}", INFURA_GATEWAY, ipfs_hash);
    
    let response = client.get(&url).send().await.ok()?;
    let text = response.text().await.ok()?;
    let json: serde_json::Value = serde_json::from_str(&text).ok()?;

    let title = json.get("title").and_then(|v| v.as_str()).map(|s| s.to_string());
    let image = json.get("image").and_then(|v| v.as_str()).map(|s| s.to_string());
    let tags = json.get("tags").and_then(|v| v.as_array()).map(|arr| {
        arr.iter()
            .filter_map(|tag| tag.as_str())
            .map(|s| s.to_string())
            .collect::<Vec<String>>()
    });
    
    let custom_fields = json.get("customFields");

    
    let location = custom_fields
        .and_then(|cf| cf.get("location"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .or_else(|| json.get("location").and_then(|v| v.as_str()).map(|s| s.to_string()));
    
    let scale = custom_fields
        .and_then(|cf| cf.get("scale"))
        .and_then(|v| v.as_str().and_then(|s| s.parse::<f64>().ok()))
        .or_else(|| json.get("scale").and_then(|v| v.as_f64()));
    
    let rotation = custom_fields
        .and_then(|cf| cf.get("rotation"))
        .and_then(|v| v.as_str().and_then(|s| s.parse::<f64>().ok()))
        .or_else(|| json.get("rotation").and_then(|v| v.as_f64()));
    
    let ratio = custom_fields
        .and_then(|cf| cf.get("ratio"))
        .and_then(|v| v.as_str().and_then(|s| s.parse::<f64>().ok()))
        .or_else(|| json.get("ratio").and_then(|v| v.as_f64()));
    
    let flip = custom_fields
        .and_then(|cf| cf.get("flip"))
        .and_then(|v| v.as_str().and_then(|s| s.parse::<f64>().ok()))
        .or_else(|| json.get("flip").and_then(|v| v.as_f64()));
    
    let x = custom_fields
        .and_then(|cf| cf.get("x"))
        .and_then(|v| v.as_str().and_then(|s| s.parse::<f64>().ok()))
        .or_else(|| json.get("x").and_then(|v| v.as_f64()));
    
    let y = custom_fields
        .and_then(|cf| cf.get("y"))
        .and_then(|v| v.as_str().and_then(|s| s.parse::<f64>().ok()))
        .or_else(|| json.get("y").and_then(|v| v.as_f64()));

    Some(Metadata {
        title,
        image,
        tags,
        location,
        scale,
        ratio,
        flip,
        rotation,
        x,
        y,
    })
}

pub async fn fetch_grouped_templates() -> Result<Vec<GroupedTemplate>, String> {
    let template_data = fetch_templates().await?;
    let template_choices = get_template_choices();
    let mut grouped_templates = Vec::new();

    for choice in template_choices {
        let matching_templates: Vec<TemplateData> = template_data
            .iter()
            .filter(|template| {
                if let Some(ref metadata) = template.metadata {
                    if let Some(ref tags) = metadata.tags {
                        if let Some(template_type) = get_template_type_from_tags(tags) {
                            return template_type == choice.template_type;
                        }
                    }
                }
                false
            })
            .cloned()
            .collect();

        grouped_templates.push(GroupedTemplate {
            name: choice.name,
            template_type: choice.template_type,
            image: choice.image,
            templates: matching_templates,
        });
    }

    Ok(grouped_templates)
}

pub async fn fetch_templates() -> Result<Vec<TemplateData>, String> {
    // let api_key = "";
    
    let client = reqwest::Client::new();
    
    let query = r#"
    {
      templates(where: {templateContract: "0xcc67186fe1921210394bb21f6032764663f66878"}) {
        templateContract
        templateId
        digitalPrice
        childReferences {
          uri
          childId
          childContract
          child { 
            digitalPrice
            metadata {
              title
              image
            }
          }
        }
        childType
        infraCurrency
        metadata {
          title
          image
          tags
        }
        uri
      }
    }
    "#;

    let query_body = serde_json::json!({
        "query": query
    });

    let url = format!(
        "https://api.studio.thegraph.com/query/109132/fractional-garment-ownership/version/latest"
    );

    let response = client
        .post(&url)
        // .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&query_body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let parsed: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    if let Some(errors) = parsed.get("errors") {
        return Err(format!("GraphQL errors: {}", errors));
    }

    let templates = parsed
        .get("data")
        .and_then(|data| data.get("templates"))
        .and_then(|templates| templates.as_array())
        .ok_or("Invalid response structure")?;

    let mut template_data = Vec::new();
    
    for template in templates {
        let template_contract = template
            .get("templateContract")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
            
        let template_id = template
            .get("templateId")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
            
        let digital_price = template
            .get("digitalPrice")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
            
        let infra_currency = template
            .get("infraCurrency")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
            
        let uri = template
            .get("uri")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
            
        let child_type = template
            .get("childType")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let mut child_references = Vec::new();
        if let Some(refs) = template.get("childReferences").and_then(|v| v.as_array()) {
            for child_ref in refs {
                let uri = child_ref
                    .get("uri")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                    
                let child_id = child_ref
                    .get("childId")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                    
                let child_contract = child_ref
                    .get("childContract")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                    
                let (child, digital_price) = if let Some(child_data) = child_ref.get("child") {
                    let digital_price = child_data
                        .get("digitalPrice")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    
                    let metadata = if let Some(meta) = child_data.get("metadata") {
                        let title = meta.get("title").and_then(|v| v.as_str()).map(|s| s.to_string());
                        let image = meta.get("image").and_then(|v| v.as_str()).map(|s| s.to_string());
                        Some(ChildMetadata { 
                            title, 
                            image
                      })
                    } else {
                        None
                    };
                    
                    (Some(Child { metadata }), digital_price)
                } else {
                    (None, String::new())
                };

                let parsed_metadata = fetch_ipfs_metadata(&uri, &client).await;
                
                child_references.push(ChildReference {
                    uri,
                    child_id,
                    child_contract,
                    price: digital_price,
                    child,
                    metadata: parsed_metadata,
                });
            }
        }

        let metadata = if let Some(meta) = template.get("metadata") {
            let title = meta.get("title").and_then(|v| v.as_str()).map(|s| s.to_string());
            let image = meta.get("image").and_then(|v| v.as_str()).map(|s| s.to_string());
            let tags = meta.get("tags").and_then(|v| v.as_array()).map(|arr| {
                arr.iter()
                    .filter_map(|tag| tag.as_str())
                    .map(|s| s.to_string())
                    .collect::<Vec<String>>()
            });
            
            let ipfs_metadata = fetch_ipfs_metadata(&uri, &client).await;
            let ratio = ipfs_metadata.as_ref().and_then(|m| m.ratio);
            
            Some(TemplateMetadata { 
                title, 
                image,
                tags,
                ratio
            })
        } else {
            None
        };

        template_data.push(TemplateData {
            price: digital_price,
            child_type,
            template_contract,
            template_id,
            currency: infra_currency,
            child_references,
            metadata,
            uri,
        });
    }

    Ok(template_data)
}