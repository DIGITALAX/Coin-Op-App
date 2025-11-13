use serde::{ Deserialize, Serialize };
use serde_json::{ Value, json, from_str };

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
        }
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
    pub amount: Option<i32>,
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
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChildData {
    pub price: String,
    #[serde(rename = "childType")]
    pub child_type: String,
    #[serde(rename = "childContract")]
    pub child_contract: String,
    #[serde(rename = "childId")]
    pub child_id: String,
    pub currency: String,
    pub metadata: Option<ChildMetadata>,
    pub uri: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Metadata {
    pub title: Option<String>,
    pub image: Option<String>,
    pub instructions: Option<String>,
    pub tags: Option<Vec<String>>,
    pub location: Option<String>,
    pub scale: Option<f64>,
    pub ratio: Option<f64>,
    #[serde(rename = "seamAllowance")]
    pub seam_allowance: Option<String>,
    pub flip: Option<f64>,
    pub rotation: Option<f64>,
    pub x: Option<f64>,
    pub y: Option<f64>,
}

async fn fetch_ipfs_metadata(uri: &str, client: &reqwest::Client) -> Option<Metadata> {
    if uri.is_empty() {
        return None;
    }

    let ipfs_hash = if uri.starts_with("ipfs://") { &uri[7..] } else { uri };

    let url = format!("{}/{}", INFURA_GATEWAY, ipfs_hash);

    let response = client.get(&url).send().await.ok()?;
    let text = response.text().await.ok()?;
    let json: Value = from_str(&text).ok()?;

    let title = json
        .get("title")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let image = json
        .get("image")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let tags = json
        .get("tags")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|tag| tag.as_str())
                .map(|s| s.to_string())
                .collect::<Vec<String>>()
        });

    let instructions = json.get("instructions").map(|s| s.to_string());

    let custom_fields = json.get("customFields");

    let location = custom_fields
        .and_then(|cf| cf.get("location"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .or_else(||
            json
                .get("location")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
        );

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

    let seam_allowance = custom_fields
        .and_then(|cf| cf.get("seamAllowance"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .or_else(||
            json
                .get("seamAllowance")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
        );

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
        instructions,
        tags,
        location,
        seam_allowance,
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
    // opcão dois -> subgraph não está ativo 
    // let api_key = "";

    // let client = reqwest::Client::new();

    // let query =
    //     r#"
    // {
    //   templates(where: {templateContract:  "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23"}) {
    //     templateContract
    //     templateId
    //     physicalPrice
    //     childReferences {
    //       placementURI
    //       childId
    //       amount
    //       childContract
    //       child { 
    //         physicalPrice
    //         metadata {
    //           title
    //           image
    //           tags
    
    //         }
    //       }
    //     }
    //     childType
    //     infraCurrency
    //     metadata {
    //       title
    //       image
    //       tags
    //     }
    //     uri
    //   }
    // }
    // "#;

    // let query_body = json!({
    //     "query": query
    // });

    // let url = format!(
    //     "https://gateway.thegraph.com/api/subgraphs/id/4jujS6j8wMahNTSzN2T8wN7iTiEfNRQfoYYQL7Q1Bn9X"
    // );

    // let response = client
    //     .post(&url)
    //     .header("Authorization", format!("Bearer {}", api_key))
    //     .header("Content-Type", "application/json")
    //     .json(&query_body)
    //     .send().await
    //     .map_err(|e| format!("Request failed: {}", e))?;

    // if !response.status().is_success() {
    //     return Err(format!("HTTP error: {}", response.status()));
    // }

    // let response_text = response
    //     .text().await
    //     .map_err(|e| format!("Failed to read response: {}", e))?;

    // let parsed: Value = serde_json
    //     ::from_str(&response_text)
    //     .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    // if let Some(errors) = parsed.get("errors") {
    //     return Err(format!("GraphQL errors: {}", errors));
    // }

    // let templates = parsed
    //     .get("data")
    //     .and_then(|data| data.get("templates"))
    //     .and_then(|templates| templates.as_array())
    //     .ok_or("Invalid response structure")?;

    let templates_json = r#"[
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmeMhbXuskzRgLJ4SGF2itYzGiHx2PBQFfhi54GPQFuci5"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmczXAVhMjkyvWAdLQjZ4HYPEY1jxLvs9sZ5R5sNG3gt6z"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmSaJ1C3AAvC8J6WB5DChPSuoi4oCqDQQq7DrKwQPHm3b1"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZTXdZRwFRpGFCidySe2FxHdnStYMHh4LvLYQCF6dgcJ7",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "2",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWwRYcuyNeXzNFbFHn6NomxerQJH7gpdv337uNkygvS3u",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "6",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmZCiFkntv59eDymtZKpLbFuy1HHVBgWk7YxJbousgUhmE",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Hood Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "7",
        "placementURI": "ipfs://QmbAJcLY8STrntufkvHTDkaMViqDFLz3dz2VTDPQS1MiTR"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmeRcLaAJt2tMEtc6fQs4awzZJHPLUGkGsk7sM4FijBa2S",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Pocket Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "8",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmTEAfKjAnJ8Rm7BwgzGCtb1wE5H9J3BkSoEFgeBCeHU2a",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Cuff Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "9",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmR2aM7nPH6PmswKc4115GhdxbCEhwDhFAUqXBGrDZuCws",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "10",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZQFmPophwckf4UKDCD5YMLPeism2oYNkrgFhN33N52Q6",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Waist Band Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "11",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmRdfFpoE2hVAdSqvMFEqsiB1SNE27AajiR4uaFSGyonHm",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "front"
      ],
      "title": "Industrial Patch Array"
    },
    "physicalPrice": "350000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "1",
    "uri": "ipfs://QmTKGx18joucg4eGCfT8NwiaPfE4SUroPUb7uKwdqZVaJ6"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWsT4GjHcYF8PWQmCnnxsA7gUwrVsqQGt6MvQfUxi5kr1",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base Back"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "4",
        "placementURI": "ipfs://QmTURGLiT4mMDFzBCxjtfRBMtHWUNhDM3Cqy1Zpybr8DHu"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmYpqS8Bvooy8VZuyYB4QCa4AEzyiKYaevLZxTMdSKQ8LW",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Back Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "5",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmaqxpKQPJMqMZrzAF1sUkuRDuy15286hXfkFPCdoHx4iZ",
            "tags": [
              "zone",
              "warped",
              "distorted"
            ],
            "title": "Warped Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "11",
        "placementURI": "ipfs://QmNbsQPADuXtTKSZTNG35Wet3R7GKcAemQv1WXF5QWABPT"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://Qma68XZeJwqpxLX9zJQS4r4K3J757AGqAa6csmcCoZVu8z",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "back"
      ],
      "title": "Thermal Transfer Hood"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "10",
    "uri": "ipfs://QmPAJhtSfWdRneQUvpJ5YTLWRb6rVb5wD4RTsxTbKcqTPh"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWsT4GjHcYF8PWQmCnnxsA7gUwrVsqQGt6MvQfUxi5kr1",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base Back"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "4",
        "placementURI": "ipfs://QmTURGLiT4mMDFzBCxjtfRBMtHWUNhDM3Cqy1Zpybr8DHu"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmYpqS8Bvooy8VZuyYB4QCa4AEzyiKYaevLZxTMdSKQ8LW",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Back Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "5",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQKPxrGXVdmNhawv9L2jx5wTkeJGqDQCKzDRLNCkH5EBA",
            "tags": [
              "zone",
              "jagged",
              "irregular"
            ],
            "title": "Jagged Zone"
          },
          "physicalPrice": "280000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "6",
        "placementURI": "ipfs://QmTpKrt2c1uLTkdo8ucoX6FC9E5VT4iAVkppHYkMXtxiVE"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmaMfvJXgoWVo6akhsUit8KyMYFqcZf9fZvj29YKcdYcuh",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "back"
      ],
      "title": "Sublimation Hood Standard"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "11",
    "uri": "ipfs://QmUzqWEs2rx45LAgrLtLxs53rAXJJfmXTczSF3YKUzTWeE"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmaCRvFxetVUGkCZECNN3SRY6ttd6TDg8jYLsbar2u6cp4",
            "tags": [
              "zone",
              "tall",
              "diagonal"
            ],
            "title": "Diagonal-Top Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "16",
        "placementURI": "ipfs://QmQR2PAAwWNMnnYzofyx6sP2Hd39BAaAetLGw438eKhA3V"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWsT4GjHcYF8PWQmCnnxsA7gUwrVsqQGt6MvQfUxi5kr1",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base Back"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "4",
        "placementURI": "ipfs://QmTURGLiT4mMDFzBCxjtfRBMtHWUNhDM3Cqy1Zpybr8DHu"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmYpqS8Bvooy8VZuyYB4QCa4AEzyiKYaevLZxTMdSKQ8LW",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Back Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "5",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmT8iX8LhX8tfY3s6hSHt4iFMWSHGzU24s1L7cVHL8sPHS",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "back"
      ],
      "title": "Heat Press Hood Elite"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "12",
    "uri": "ipfs://QmbgztfcqZCZhjSa3tDrTRD8NZnUGcf4UXGziQA3bAx976"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdB9fbAZFxPALgpgsSq4bvYNe6KFHVZg4EaLeqpryKgXK",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-Shirt Base"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "1",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmejXm14acsacuC1iwwD3Ddr964s9VSPSVvyDfJsKcTxFY"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmckQtYP71pVo4tuZcKb3WpyFZ8JMoTYkhnYoSrXtDcFDY",
            "tags": [
              "zone",
              "rectangular",
              "rotated"
            ],
            "title": "Rotated Zone"
          },
          "physicalPrice": "150000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "2",
        "placementURI": "ipfs://QmVMKCSnHEFbJPHkUrpUm4e3cyvwPBngYzz83RorvZG27P"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdrXEuXshhPUDUTsfHKzNVMrmQn68H4oPA92vBbLxBBa4",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "2",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmaEvrZjmA6odJ757pwpNpSirTtvL3rjH2vcJ9fuHt7Gn4",
            "tags": [
              "zone",
              "diagonal",
              "square"
            ],
            "title": "Diagonal Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "3",
        "placementURI": "ipfs://QmQXe4twFeSC1wwJp4jUBkzMLAsF1bt6tzvxES742Yd7vB"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmVkhYT7SfWt4TR2gx6t9fsT76rrmqbaeZmYHLzdaSs84m",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Neck Binding Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "3",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8nXv1mn2D5V3nUYxpGdPmGfksAZkRru3YtRT3Nvf58j",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "4",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmSvLTT4XfCSKmzdnRWNgHWj3gzgN38gN7tJ99tW2JXHii",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "front"
      ],
      "title": "Ziegler Foundation Series"
    },
    "physicalPrice": "300000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "13",
    "uri": "ipfs://QmPoXpuU836GgskR4JkmJViDBhkSq2NJuqLXk47y5iFEmZ"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdB9fbAZFxPALgpgsSq4bvYNe6KFHVZg4EaLeqpryKgXK",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-Shirt Base"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "1",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmejXm14acsacuC1iwwD3Ddr964s9VSPSVvyDfJsKcTxFY"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdrXEuXshhPUDUTsfHKzNVMrmQn68H4oPA92vBbLxBBa4",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "2",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmVkhYT7SfWt4TR2gx6t9fsT76rrmqbaeZmYHLzdaSs84m",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Neck Binding Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "3",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://Qmc8SNihNeUhec4GoAaJ9S6873moXFFuF3edEqj4iEfvJY",
            "tags": [
              "zone",
              "rotated",
              "elongated"
            ],
            "title": "Elongated Zone"
          },
          "physicalPrice": "350000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "4",
        "placementURI": "ipfs://QmXjzwsxyeteH26XrY2hcxpPd56wixcmSg8uKTc9MN6mvh"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8nXv1mn2D5V3nUYxpGdPmGfksAZkRru3YtRT3Nvf58j",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "4",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP7LAcB6ng98z9EFu7KyUCV2oaAsNMuiYsz49kSiht8dr",
            "tags": [
              "zone",
              "rotated",
              "flat"
            ],
            "title": "Flat Zone"
          },
          "physicalPrice": "120000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "5",
        "placementURI": "ipfs://QmWi9ysSwFu1bT4gETNCtvyAaGLtuErjMGvZVUVvbrtmvm"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmWXANGwmLD1kfMUhxKRxCAxJqHE9aVhuPJtE71iFbsLcc",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "front"
      ],
      "title": "Ziegler Assembly MarxII"
    },
    "physicalPrice": "300000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "14",
    "uri": "ipfs://QmS9okho4vUbpdqn8pqYngKcvUZg2FcJvu6hqz6QkBZh8p"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdB9fbAZFxPALgpgsSq4bvYNe6KFHVZg4EaLeqpryKgXK",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-Shirt Base"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "1",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmejXm14acsacuC1iwwD3Ddr964s9VSPSVvyDfJsKcTxFY"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdrXEuXshhPUDUTsfHKzNVMrmQn68H4oPA92vBbLxBBa4",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "2",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmVkhYT7SfWt4TR2gx6t9fsT76rrmqbaeZmYHLzdaSs84m",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Neck Binding Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "3",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8nXv1mn2D5V3nUYxpGdPmGfksAZkRru3YtRT3Nvf58j",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "4",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQKPxrGXVdmNhawv9L2jx5wTkeJGqDQCKzDRLNCkH5EBA",
            "tags": [
              "zone",
              "jagged",
              "irregular"
            ],
            "title": "Jagged Zone"
          },
          "physicalPrice": "280000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "6",
        "placementURI": "ipfs://QmPFb5yV6Jjz5cubKtoj3sCiKSPSPBwKbT73LbgQSxVpF7"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://Qmb9Vv2aGw5sMwiJgp6Kxso1RJ2HPXq4XpkET1pEd2c17n"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmWWGmvGUyPvqSefKUbDtCGHoLbkS7gmuVXqpGVu5nU4QY",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "front"
      ],
      "title": "Fabricator's Choice"
    },
    "physicalPrice": "300000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "15",
    "uri": "ipfs://QmcVDmuxy7yCENLSHiVH5tKaNoWCnBDteiPJ8wbYPt3m1q"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdB9fbAZFxPALgpgsSq4bvYNe6KFHVZg4EaLeqpryKgXK",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-Shirt Base"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "1",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmejXm14acsacuC1iwwD3Ddr964s9VSPSVvyDfJsKcTxFY"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmfXgQ9tMKvv3ceqQQZCbcLunTR41Jb9EF5dQu2p2ktiPy"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmVWvowLwE2fqoaoonvNJ8ce3G3TELM9VWvSKMotTeLnN9"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmYGZVe9oNVtSGWnUx8sAtxjs7dvpcUgD3ANHbb986SrpD"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdrXEuXshhPUDUTsfHKzNVMrmQn68H4oPA92vBbLxBBa4",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "2",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmVkhYT7SfWt4TR2gx6t9fsT76rrmqbaeZmYHLzdaSs84m",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Neck Binding Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "3",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8nXv1mn2D5V3nUYxpGdPmGfksAZkRru3YtRT3Nvf58j",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "4",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmfGKPMF7KcwZFYDdkXg1oDkMz87gtus7JR3E3SgpxabDJ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmPGcXuS7YBkkQajJ9FZQ6Pcu8eUv4zznDBMCgaMEKyU2X"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmbtExEuPwp4kKkvJEZRD7i8ok7Lkpv6cejzc8omrJNdCV"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmWktC7ovFJzUgKQaKxvrqu5mcajunpkqZge2ngGbd9KYe",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "front"
      ],
      "title": "Industrial Array"
    },
    "physicalPrice": "300000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "16",
    "uri": "ipfs://Qmd2fQeWujWaDHU4WcALxTUkxMfg57aDBHpZ2a89PKE1B6"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdB9fbAZFxPALgpgsSq4bvYNe6KFHVZg4EaLeqpryKgXK",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-Shirt Base"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "1",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmejXm14acsacuC1iwwD3Ddr964s9VSPSVvyDfJsKcTxFY"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdrXEuXshhPUDUTsfHKzNVMrmQn68H4oPA92vBbLxBBa4",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "2",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmVkhYT7SfWt4TR2gx6t9fsT76rrmqbaeZmYHLzdaSs84m",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Neck Binding Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "3",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8nXv1mn2D5V3nUYxpGdPmGfksAZkRru3YtRT3Nvf58j",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "4",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZGM3d5zZjJi93CM1PnLaa3MCxtwW1Cshc9ZCgc6278my",
            "tags": [
              "zone",
              "wide",
              "rectangular"
            ],
            "title": "Wide Rectangle Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "8",
        "placementURI": "ipfs://QmfFEGX6cPL8JctkpAy5Yot28KjY4tBAAC3wXsqmNpqGf6"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmUuDn4X35XWs974puUKyF6GCGhaffCB7DLCFQsWV9o4uc",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "front"
      ],
      "title": "MarxZiegler's Minimal"
    },
    "physicalPrice": "300000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "17",
    "uri": "ipfs://QmT6g67mE2WAT5vr4izsS3z4Da5hFpYGGjY8ee2aVQM97B"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdB9fbAZFxPALgpgsSq4bvYNe6KFHVZg4EaLeqpryKgXK",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-Shirt Base"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "1",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmejXm14acsacuC1iwwD3Ddr964s9VSPSVvyDfJsKcTxFY"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdrXEuXshhPUDUTsfHKzNVMrmQn68H4oPA92vBbLxBBa4",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "2",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmVkhYT7SfWt4TR2gx6t9fsT76rrmqbaeZmYHLzdaSs84m",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Neck Binding Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "3",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8nXv1mn2D5V3nUYxpGdPmGfksAZkRru3YtRT3Nvf58j",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "4",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmTNRMSxhto3mdk9vCjPevENfuX6RFzJw5nbWYpHpUjWAi",
            "tags": [
              "zone",
              "tapered",
              "funnel"
            ],
            "title": "Tapered Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "9",
        "placementURI": "ipfs://QmUuHi9LfvscnuNMth6btzm8G4RcLRjkLgCyVucTtBx4Hx"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmPk1y1NWnNAEf2bcvYFihfUznwFj7uDcxiXxNCAGVsRpt",
            "tags": [
              "zone",
              "tall",
              "rectangular"
            ],
            "title": "Tall Rectangle Zone"
          },
          "physicalPrice": "120000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "10",
        "placementURI": "ipfs://QmfBH1ga5vKhp3HENqXmPMkEckTUNTvSsYjc3V86JzuxKZ"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmcCGQZUwj6hLtSQiLWetiRRdJKZdEpzCix9yjgFZ3Votj",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "front"
      ],
      "title": "Dual Assembly Unit"
    },
    "physicalPrice": "300000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "18",
    "uri": "ipfs://QmV9qzA8aroNqreje8L7j3AQKNWYEyzGGmU3i3ooSJNes2"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdB9fbAZFxPALgpgsSq4bvYNe6KFHVZg4EaLeqpryKgXK",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-Shirt Base"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "1",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmejXm14acsacuC1iwwD3Ddr964s9VSPSVvyDfJsKcTxFY"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://Qmezy8MB8deuCNUUzS8i4qJucCiLirVs9WT6RuSAnLa5vt"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmcLTAKo3DrkBGMENQF2FZa9Aa5ru3iAsRqNPVKV6G5ztS"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmQcqe2gcD7ud8H1ka58jAxTkLhFwxxP1SJn5EjmgiWcYa"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmYTnVAUjtXYMk5QPSceQzWwgv5ho8ZinrUkQ3dWJcoM24"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmckQtYP71pVo4tuZcKb3WpyFZ8JMoTYkhnYoSrXtDcFDY",
            "tags": [
              "zone",
              "rectangular",
              "rotated"
            ],
            "title": "Rotated Zone"
          },
          "physicalPrice": "150000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "2",
        "placementURI": "ipfs://QmfXiV6773cuZfzKLDXp37HujbRRmoGDZ7yDXY1kX9vSmT"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdrXEuXshhPUDUTsfHKzNVMrmQn68H4oPA92vBbLxBBa4",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "2",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmVkhYT7SfWt4TR2gx6t9fsT76rrmqbaeZmYHLzdaSs84m",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Neck Binding Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "3",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8nXv1mn2D5V3nUYxpGdPmGfksAZkRru3YtRT3Nvf58j",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "4",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmaqxpKQPJMqMZrzAF1sUkuRDuy15286hXfkFPCdoHx4iZ",
            "tags": [
              "zone",
              "warped",
              "distorted"
            ],
            "title": "Warped Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "11",
        "placementURI": "ipfs://QmPmoX8SHuwRoG4skogwg5h6NBD7vRnKCZjGAuJZ1kEEHY"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmXevwzPRqsG41g8ySN54oHWD2bSq3aRHrvyNWC5WzodeB",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "front"
      ],
      "title": "Fabrication Matrix"
    },
    "physicalPrice": "300000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "19",
    "uri": "ipfs://QmXWXTCPMbc2wh1QdwWQHWzRff93DQq86Kmb7iCg9iMFNA"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZTXdZRwFRpGFCidySe2FxHdnStYMHh4LvLYQCF6dgcJ7",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "2",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWwRYcuyNeXzNFbFHn6NomxerQJH7gpdv337uNkygvS3u",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "6",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmVHre7cDCAs66t7TX3tWYE8ndRHcmWYMdb5a6Wu9XELmx"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmYJUxHU8AXV1Q8F6Ji6eTZzRSzYvxhpe34Hj2hqwzPECP"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmZCiFkntv59eDymtZKpLbFuy1HHVBgWk7YxJbousgUhmE",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Hood Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "7",
        "placementURI": "ipfs://QmbAJcLY8STrntufkvHTDkaMViqDFLz3dz2VTDPQS1MiTR"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmeRcLaAJt2tMEtc6fQs4awzZJHPLUGkGsk7sM4FijBa2S",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Pocket Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "8",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmTEAfKjAnJ8Rm7BwgzGCtb1wE5H9J3BkSoEFgeBCeHU2a",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Cuff Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "9",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmR2aM7nPH6PmswKc4115GhdxbCEhwDhFAUqXBGrDZuCws",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "10",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZQFmPophwckf4UKDCD5YMLPeism2oYNkrgFhN33N52Q6",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Waist Band Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "11",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmSMMVx6t296pKF9HmT6jsVW1Lh2MBQ7ZrqTHidtdXHCZg",
            "tags": [
              "zone",
              "l-shaped",
              "cutout"
            ],
            "title": "L-Cut Zone"
          },
          "physicalPrice": "160000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "13",
        "placementURI": "ipfs://QmSbAFWVN8NDypQTGbAfni8Dfca1U12BJm5SVcwgQzS9r4"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmcV1g4tVDuAyXZAmTZWsCczxzGfjhGU5zTKnGuGSwk1Eb",
            "tags": [
              "zone",
              "square",
              "top-cut"
            ],
            "title": "Top-Cut Square Zone"
          },
          "physicalPrice": "180000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "14",
        "placementURI": "ipfs://QmcDCUvEkxKTLL5B1P9NwnbC8kPC2azHFd5F4LbJMoZAdE"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmVTqj85gzDXAeXpGxE4n26E1s9beS3rMmQZHWYivP9spv",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "front"
      ],
      "title": "Production Line Essential"
    },
    "physicalPrice": "350000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "2",
    "uri": "ipfs://Qmdn1ret3mHSncrckLRhUogiqxYamkUmnhKyq4z6asCGXx"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdB9fbAZFxPALgpgsSq4bvYNe6KFHVZg4EaLeqpryKgXK",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-Shirt Base"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "1",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmejXm14acsacuC1iwwD3Ddr964s9VSPSVvyDfJsKcTxFY"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdrXEuXshhPUDUTsfHKzNVMrmQn68H4oPA92vBbLxBBa4",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "2",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmVkhYT7SfWt4TR2gx6t9fsT76rrmqbaeZmYHLzdaSs84m",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Neck Binding Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "3",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8nXv1mn2D5V3nUYxpGdPmGfksAZkRru3YtRT3Nvf58j",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "4",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmfCfoVh4pjSTinuG3bLJQq4w7wsdEg2Khs8d4J4CT5CcE",
            "tags": [
              "zone",
              "cutout",
              "irregular"
            ],
            "title": "Cut-out Zone"
          },
          "physicalPrice": "2320000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "12",
        "placementURI": "ipfs://QmeG1mTwnkLZPqCuxVcamsdGLg6aPwojLrKiN9oYjer1a9"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmUNszynoZhs13U5VEwBTyQnVCwERtAwKxDFkH5g3r1KLK",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "front"
      ],
      "title": "Ziegler's Final Cut"
    },
    "physicalPrice": "300000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "20",
    "uri": "ipfs://QmfBEhp7eorkQu26DE1c8hM7MGRd3zZECgZfxTuBzZjSpt"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZR3yzYnKfbMMw48E7gRG71H7VGATgF6jkm3Q8LXAYehy",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Back Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "1",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmNTQtHdMubgMMLALYUR4LoVwA8M4isugKYovqzj3o2xrB",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-shirt Base Back"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "3",
        "placementURI": "ipfs://QmTURGLiT4mMDFzBCxjtfRBMtHWUNhDM3Cqy1Zpybr8DHu"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmNkebZvKCm62k3xsUvRMDFS6y18rfVExtYmYhijGNWCWg",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "back"
      ],
      "title": "Plain Back Foundation"
    },
    "physicalPrice": "300000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "21",
    "uri": "ipfs://QmZJUY4JkEHnacwdxMBYAqaH3QJ6rsLoJ3a7wJyokWigLg"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZR3yzYnKfbMMw48E7gRG71H7VGATgF6jkm3Q8LXAYehy",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Back Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "1",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmNTQtHdMubgMMLALYUR4LoVwA8M4isugKYovqzj3o2xrB",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-shirt Base Back"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "3",
        "placementURI": "ipfs://QmTURGLiT4mMDFzBCxjtfRBMtHWUNhDM3Cqy1Zpybr8DHu"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQKPxrGXVdmNhawv9L2jx5wTkeJGqDQCKzDRLNCkH5EBA",
            "tags": [
              "zone",
              "jagged",
              "irregular"
            ],
            "title": "Jagged Zone"
          },
          "physicalPrice": "280000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "6",
        "placementURI": "ipfs://QmcDXNzHxpB2s2CDUQjwobPNzmmW4NwpqM5Fc7ALFbvm1t"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmNVMZWjPCRAbPjnk69Xw2TnGrmdxjUGwhvHREbC5cmMNh",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "back"
      ],
      "title": "Direct-to-Garment Back"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "22",
    "uri": "ipfs://Qmbt3MgH3PvisriorFBXuGU4sfcETtrXzzdCCSqdoAkiA2"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZR3yzYnKfbMMw48E7gRG71H7VGATgF6jkm3Q8LXAYehy",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Back Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "1",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmNTQtHdMubgMMLALYUR4LoVwA8M4isugKYovqzj3o2xrB",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-shirt Base Back"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "3",
        "placementURI": "ipfs://QmTURGLiT4mMDFzBCxjtfRBMtHWUNhDM3Cqy1Zpybr8DHu"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmaqxpKQPJMqMZrzAF1sUkuRDuy15286hXfkFPCdoHx4iZ",
            "tags": [
              "zone",
              "warped",
              "distorted"
            ],
            "title": "Warped Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "11",
        "placementURI": "ipfs://QmXGP2j7astYKYMt9jMf4KmxxwDSpxXpsyniGsKd5qBycw"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmTuRfWWk6kdpNaDqqfkoPrsJVLtKCuQr1NxWYX7NakqdJ",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "back"
      ],
      "title": "Screen Print Back Standard"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "23",
    "uri": "ipfs://QmTvvwu5XcTxVaJmomuKbzeUqZw3SgVcdP75242KpntTHW"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZR3yzYnKfbMMw48E7gRG71H7VGATgF6jkm3Q8LXAYehy",
            "tags": [
              "pattern",
              "element",
              "t-shirt"
            ],
            "title": "T-Shirt Back Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "1",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmaCRvFxetVUGkCZECNN3SRY6ttd6TDg8jYLsbar2u6cp4",
            "tags": [
              "zone",
              "tall",
              "diagonal"
            ],
            "title": "Diagonal-Top Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "16",
        "placementURI": "ipfs://QmdGLyZs4aPNXMopFASmGxTnetCthtHtAqEAfMQk8eycJQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmNTQtHdMubgMMLALYUR4LoVwA8M4isugKYovqzj3o2xrB",
            "tags": [
              "t-shirt",
              "base",
              "garment"
            ],
            "title": "T-shirt Base Back"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "3",
        "placementURI": "ipfs://QmTURGLiT4mMDFzBCxjtfRBMtHWUNhDM3Cqy1Zpybr8DHu"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmNNecUuF9gf7ctJcEG8DKCd2jx8gmgV4CBjYCqvrcN2kB",
      "tags": [
        "t-shirt",
        "template",
        "customizable",
        "back"
      ],
      "title": "Vinyl Cut Back Premium"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "24",
    "uri": "ipfs://Qmc5KoNE3f4rouze47HrUsCvW8g7RmNALnZvd3HcdYuVBr"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmcavvxPriZhtKw4qmausXuQS4HgvQCBLSfWutSMLruqnC",
            "tags": [
              "zone"
            ],
            "title": "Standard Square Zone"
          },
          "physicalPrice": "60000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "27",
        "placementURI": "ipfs://QmXeNtBivQ1kg8daCGWqK4pN9wpXKFdbb4hzaeLC1FbyYN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmV2hhmEWestBsWh8HvRHey5gHAKQY762h69x6Vc18PDeJ",
            "tags": [
              "sticker",
              "base",
              "garment"
            ],
            "title": "Sticker Base"
          },
          "physicalPrice": "60000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "6",
        "placementURI": "ipfs://QmVkjvCjSHVAiDRJk5Hu47at6GbmFhD1gcCmxjYVMoftzZ"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmYQpNRNvqC1gQD6vVfyoTtJSAUZFYaa2xztCddDznwzvm",
      "tags": [
        "sticker",
        "template",
        "customizable",
        "front"
      ],
      "title": "Industrial Sticker Foundation"
    },
    "physicalPrice": "100000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "25",
    "uri": "ipfs://QmQ9xKqPiVz2C5MdpvkJEgb3HCJ5751K9cy6Pf4D67eCHL"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmV2hhmEWestBsWh8HvRHey5gHAKQY762h69x6Vc18PDeJ",
            "tags": [
              "sticker",
              "base",
              "garment"
            ],
            "title": "Sticker Base"
          },
          "physicalPrice": "60000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "6",
        "placementURI": "ipfs://QmVkjvCjSHVAiDRJk5Hu47at6GbmFhD1gcCmxjYVMoftzZ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmYrYU2ryJYbapVcWNWWkavGHo6MwKG2AssYhz6wd5ifDy"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmNQkWoetVdryzJgCKw2A28znbrT3mZJLSLVHH1oY9nWtG",
      "tags": [
        "sticker",
        "template",
        "customizable",
        "front"
      ],
      "title": "Circular Sticker Assembly"
    },
    "physicalPrice": "100000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "26",
    "uri": "ipfs://QmVka1rVc3wKf1xZSpwfpHvi9JFxBh3wqbJ9aw3EhqMCyk"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmVVsDMrrRjziWrtWcxq5FWxwfiyARr2Ni1P1xHFxe8nHN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmYiqnedfUvS4pxph4iyhUpz7bX96A9emCdXS9iP1R4Nsb"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmV2hhmEWestBsWh8HvRHey5gHAKQY762h69x6Vc18PDeJ",
            "tags": [
              "sticker",
              "base",
              "garment"
            ],
            "title": "Sticker Base"
          },
          "physicalPrice": "60000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "6",
        "placementURI": "ipfs://QmVkjvCjSHVAiDRJk5Hu47at6GbmFhD1gcCmxjYVMoftzZ"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmbuV8xqbrKGL9GCPPhtYSCoDr6aFw7e89KAQib6roGaSB",
      "tags": [
        "sticker",
        "template",
        "customizable",
        "front"
      ],
      "title": "Multi-Zone Sticker Complex"
    },
    "physicalPrice": "100000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "27",
    "uri": "ipfs://QmXhFSyfVozryx6fxhgqwZav92D4Msptvfjm66mAYQHUhN"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmYGwtza1538nWhKqD6WMG71ttXmjaA1N4diNyutcHXhBP",
            "tags": [
              "zone"
            ],
            "title": "Jagged Multi-Edge Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "28",
        "placementURI": "ipfs://QmTZgtWvnjVAwLGUkQuWBJYnRiEESeRpb974qMneTsY7i5"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmRt7uM2VdfeZ2bEyJhQj3KZwTMB86oSKJnqaWBGhj1TsX",
            "tags": [
              "zone"
            ],
            "title": "Diagonal Warped Square Zone"
          },
          "physicalPrice": "140000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "29",
        "placementURI": "ipfs://QmQqq5GK7TEm3VzWZm9sr67D92oWmKUaw6q1kx7zMp19rb"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmV2hhmEWestBsWh8HvRHey5gHAKQY762h69x6Vc18PDeJ",
            "tags": [
              "sticker",
              "base",
              "garment"
            ],
            "title": "Sticker Base"
          },
          "physicalPrice": "60000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "6",
        "placementURI": "ipfs://QmVkjvCjSHVAiDRJk5Hu47at6GbmFhD1gcCmxjYVMoftzZ"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmVoLRdqgNdU9vJotVTznjm7Mjj8jQiUmnQibjQsTtTVh8",
      "tags": [
        "sticker",
        "template",
        "customizable",
        "front"
      ],
      "title": "Warped Zone Sticker Assembly"
    },
    "physicalPrice": "100000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "28",
    "uri": "ipfs://QmVtjLVFP6VdEWJGUKdgrpZC89Qi2Z3r6GsK6Xg5eoqTkm"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmRt7uM2VdfeZ2bEyJhQj3KZwTMB86oSKJnqaWBGhj1TsX",
            "tags": [
              "zone"
            ],
            "title": "Diagonal Warped Square Zone"
          },
          "physicalPrice": "140000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "29",
        "placementURI": "ipfs://QmQqq5GK7TEm3VzWZm9sr67D92oWmKUaw6q1kx7zMp19rb"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmV2hhmEWestBsWh8HvRHey5gHAKQY762h69x6Vc18PDeJ",
            "tags": [
              "sticker",
              "base",
              "garment"
            ],
            "title": "Sticker Base"
          },
          "physicalPrice": "60000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "6",
        "placementURI": "ipfs://QmVkjvCjSHVAiDRJk5Hu47at6GbmFhD1gcCmxjYVMoftzZ"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmXPGMJiWu8axDcGSKsie7d6xeitV8GWeNwxS4r72KqKYc",
      "tags": [
        "sticker",
        "template",
        "customizable",
        "front"
      ],
      "title": "Precision Sticker Matrix"
    },
    "physicalPrice": "100000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "29",
    "uri": "ipfs://QmfXTEE8YPUjWrazik9k58AFjfi2bXGcgZ5fBAGp2MfrUG"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmZc8pkuLrh9DAMhC1GBSwcdHBgcY39rsVLXdm8AZNkkte"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://Qmb5cc7Q9NNLF9FXV5tA5JvNK2BkTkzj2EVSU7GtPHpu2G"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmdYFvQrVYSKBt1P2LucjNqq5FpyVAPf9w6FkTgMtW3Jfe"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmSn9fpeq7X4MPGjPiJHKaSp8YabgUrmvCHeCnwEnfrvm9"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmQFqAxTNhkCcy2AYv2JF9qZ1s7UeYktaMSXounYtmP8w3"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmSciMs7MfUC4B1eqEkuxfWHM3x51wHBv2W3MMeSVCNvjg"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmR9ZUWvDuQ4kRe9vYwbnGB5HLzegK2MVFeawn3gZYo3SL"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmRZL9dXAxVXgKVLDGsAjbGw4RxT6Gvwd4ggErgc16kF2D"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmWTfM1iLcne82cqWbJD7ADTxkoyJV811sNyG5nHsocYcw"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://Qmb8UwcziBziQSsYmMmewL3WwQ1ZD9v8EZohjgG3LHs85s"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmUim81GqXXTx1JabnG8ywtrXiiLhQRyUGf2HjCa2abH5N"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZTXdZRwFRpGFCidySe2FxHdnStYMHh4LvLYQCF6dgcJ7",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "2",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWwRYcuyNeXzNFbFHn6NomxerQJH7gpdv337uNkygvS3u",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "6",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmZCiFkntv59eDymtZKpLbFuy1HHVBgWk7YxJbousgUhmE",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Hood Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "7",
        "placementURI": "ipfs://QmbAJcLY8STrntufkvHTDkaMViqDFLz3dz2VTDPQS1MiTR"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmeRcLaAJt2tMEtc6fQs4awzZJHPLUGkGsk7sM4FijBa2S",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Pocket Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "8",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmTEAfKjAnJ8Rm7BwgzGCtb1wE5H9J3BkSoEFgeBCeHU2a",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Cuff Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "9",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmR2aM7nPH6PmswKc4115GhdxbCEhwDhFAUqXBGrDZuCws",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "10",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZQFmPophwckf4UKDCD5YMLPeism2oYNkrgFhN33N52Q6",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Waist Band Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "11",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmPMWhDogqZHRGoN9wmUh9MZyVDgMD2MPu76ToJiF3b9co",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "front"
      ],
      "title": "Factory Floor Premium"
    },
    "physicalPrice": "350000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "3",
    "uri": "ipfs://QmdEijKETYPvgcSo6yv398fC9yV9qxDXgYQYQkTKKrRs6F"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmV2hhmEWestBsWh8HvRHey5gHAKQY762h69x6Vc18PDeJ",
            "tags": [
              "sticker",
              "base",
              "garment"
            ],
            "title": "Sticker Base"
          },
          "physicalPrice": "60000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "6",
        "placementURI": "ipfs://QmVkjvCjSHVAiDRJk5Hu47at6GbmFhD1gcCmxjYVMoftzZ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQKPxrGXVdmNhawv9L2jx5wTkeJGqDQCKzDRLNCkH5EBA",
            "tags": [
              "zone",
              "jagged",
              "irregular"
            ],
            "title": "Jagged Zone"
          },
          "physicalPrice": "280000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "6",
        "placementURI": "ipfs://QmTPyf56gCe1HxY3uWKtT5ADgQNwiJtjGo5AktxAHgvnYC"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmSAwB7CoZvU7MK1wDCjVF7Wg2AttJpF4Gbrm93Y5Rafxw",
      "tags": [
        "sticker",
        "template",
        "customizable",
        "front"
      ],
      "title": "Diagonal Cut Sticker Unit"
    },
    "physicalPrice": "100000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "30",
    "uri": "ipfs://QmYwwpT34AhmcfiZPQKub1woJP2a4Qzb4a5C8ET4FA9W4N"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://Qmc1hgGG3sCKmx88N3yvFmd1aMf3ph6hTnpLLd7qvMuFZE",
            "tags": [
              "zone"
            ],
            "title": "Tall Rectangle Zone"
          },
          "physicalPrice": "90000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "19",
        "placementURI": "ipfs://QmcwTjgruxQHaJUtX4aB6a4vVWmJ25tLH9PtUYARU3QbAa"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmV2hhmEWestBsWh8HvRHey5gHAKQY762h69x6Vc18PDeJ",
            "tags": [
              "sticker",
              "base",
              "garment"
            ],
            "title": "Sticker Base"
          },
          "physicalPrice": "60000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "6",
        "placementURI": "ipfs://QmVkjvCjSHVAiDRJk5Hu47at6GbmFhD1gcCmxjYVMoftzZ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmXqEhbbchrPmqyhC41JxXcJ5nySAz521uB4qhtNzojKk2"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://Qmbx9fbXazhR3m2dE33rMqamKpbVf9met3ZXa9W39WtHTz"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://Qmeej82R9m32d71KHUesVMxpds5WbUfEj2T3R1PnGQHeuF",
      "tags": [
        "sticker",
        "template",
        "customizable",
        "front"
      ],
      "title": "Angular Sticker Configuration"
    },
    "physicalPrice": "100000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "31",
    "uri": "ipfs://QmcBofAVc7on56MA8stEKeYxZsPBBwbMzMk9tGrWmvqTdt"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8Ue8yNGfBpPHitS7L5nbkJrWYrsrToFEydWzscEEmo1",
            "tags": [
              "zone"
            ],
            "title": "Triangle Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "21",
        "placementURI": "ipfs://QmeeTgLkzteTumqporUMatuzzQ8myuaKLHBL14BsQ71moE"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8Ue8yNGfBpPHitS7L5nbkJrWYrsrToFEydWzscEEmo1",
            "tags": [
              "zone"
            ],
            "title": "Triangle Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "21",
        "placementURI": "ipfs://Qmd6tRs4MWC2Rp17uKqaSz5wwHvhRkr2dkmRFrwFRNnwXX"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmU94rbLdbZomteRRAR6Bkde3MhRBoAdgzhYK4SWygWDGd",
            "tags": [
              "zone"
            ],
            "title": "Thin Wide Rectangle Zone"
          },
          "physicalPrice": "10000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "23",
        "placementURI": "ipfs://QmeJ2d5xhUyxozpE3M3L9kLvTujnpR9t1kPiMjo8NjeFcH"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP6zcR5hwSuWE7kRpnB5cxj1BdmNAp4b2csWnKxKwFDVg",
            "tags": [
              "zone"
            ],
            "title": "Left Cut Rectangle Zone"
          },
          "physicalPrice": "140000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "30",
        "placementURI": "ipfs://QmTvYr1Di24wHt5Mbgk4JNBxM3j2hQnufKhE1LAAkNJQ1t"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP6zcR5hwSuWE7kRpnB5cxj1BdmNAp4b2csWnKxKwFDVg",
            "tags": [
              "zone"
            ],
            "title": "Left Cut Rectangle Zone"
          },
          "physicalPrice": "140000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "30",
        "placementURI": "ipfs://Qmb3CuJKhrspCfbZfTszqxZhxXau78FCdjvBvHqdzdU3NC"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmV2hhmEWestBsWh8HvRHey5gHAKQY762h69x6Vc18PDeJ",
            "tags": [
              "sticker",
              "base",
              "garment"
            ],
            "title": "Sticker Base"
          },
          "physicalPrice": "60000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "6",
        "placementURI": "ipfs://QmVkjvCjSHVAiDRJk5Hu47at6GbmFhD1gcCmxjYVMoftzZ"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmXBkGQFy7xP9Z8uPEhGYQMcvPnZ5p1sWPMztBH6t1d1Ca",
      "tags": [
        "sticker",
        "template",
        "customizable",
        "front"
      ],
      "title": "Complex Sticker Assembly Array"
    },
    "physicalPrice": "100000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "32",
    "uri": "ipfs://QmembgUGadYXypE9BodKp9ycExV5B3t5RLAU7s8vuKpfX6"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmaCRvFxetVUGkCZECNN3SRY6ttd6TDg8jYLsbar2u6cp4",
            "tags": [
              "zone",
              "tall",
              "diagonal"
            ],
            "title": "Diagonal-Top Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "16",
        "placementURI": "ipfs://QmWiyfvJWLhTht8revyf4cVAbZv4fW7gHtMVubSN2qUSzh"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmUWqatDBdZMyytjsuEGiQEvT3qQDkUNV5smyPWKVQJzht",
            "tags": [
              "poster",
              "base",
              "garment"
            ],
            "title": "Poster Base"
          },
          "physicalPrice": "80000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "5",
        "placementURI": "ipfs://QmXsXwQR3pDT1m7bs45QMQbYt14zcFiie4uaPF9FMh64rX"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmVQkt9SWaG9m5PzUmiGxGKzYhBpvmhZn3JNeA5fMsp93p",
      "tags": [
        "poster",
        "template",
        "customizable",
        "front"
      ],
      "title": "Poster Foundation Assembly"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "33",
    "uri": "ipfs://QmV8aX4zp3evfJdANyRBE9LmfHnT5hFArDwLXsiV9aj7Vj"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://Qmc1hgGG3sCKmx88N3yvFmd1aMf3ph6hTnpLLd7qvMuFZE",
            "tags": [
              "zone"
            ],
            "title": "Tall Rectangle Zone"
          },
          "physicalPrice": "90000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "19",
        "placementURI": "ipfs://QmYXzLVm4TuVBBczgC4Bfp5JL5ktu1LcrKKxvdCQJNJ33e"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmUWqatDBdZMyytjsuEGiQEvT3qQDkUNV5smyPWKVQJzht",
            "tags": [
              "poster",
              "base",
              "garment"
            ],
            "title": "Poster Base"
          },
          "physicalPrice": "80000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "5",
        "placementURI": "ipfs://QmXsXwQR3pDT1m7bs45QMQbYt14zcFiie4uaPF9FMh64rX"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://Qmakj6mXBTSGtu1Ygvf7JBv7jeec4ikKhhPNXRaVGcJq65",
      "tags": [
        "poster",
        "template",
        "customizable",
        "front"
      ],
      "title": "Industrial Poster Matrix"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "34",
    "uri": "ipfs://QmeC2fcmdLfTvm1VU5eN6pqP8bS19K9A4ez5LJFxd5964B"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmRBVYhuGT3v1bBCstwN4F1ucBaJY4hyeepgVPsERYFX6X"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://Qmc1hgGG3sCKmx88N3yvFmd1aMf3ph6hTnpLLd7qvMuFZE",
            "tags": [
              "zone"
            ],
            "title": "Tall Rectangle Zone"
          },
          "physicalPrice": "90000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "19",
        "placementURI": "ipfs://QmYXzLVm4TuVBBczgC4Bfp5JL5ktu1LcrKKxvdCQJNJ33e"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmUWqatDBdZMyytjsuEGiQEvT3qQDkUNV5smyPWKVQJzht",
            "tags": [
              "poster",
              "base",
              "garment"
            ],
            "title": "Poster Base"
          },
          "physicalPrice": "80000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "5",
        "placementURI": "ipfs://QmXsXwQR3pDT1m7bs45QMQbYt14zcFiie4uaPF9FMh64rX"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZGM3d5zZjJi93CM1PnLaa3MCxtwW1Cshc9ZCgc6278my",
            "tags": [
              "zone",
              "wide",
              "rectangular"
            ],
            "title": "Wide Rectangle Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "8",
        "placementURI": "ipfs://Qmf5exYkDJqWLaCh5JvZeezwMFxaSWAfngVLpZRgB2ZiUG"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZGM3d5zZjJi93CM1PnLaa3MCxtwW1Cshc9ZCgc6278my",
            "tags": [
              "zone",
              "wide",
              "rectangular"
            ],
            "title": "Wide Rectangle Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "8",
        "placementURI": "ipfs://QmV5KzPXEc4Y3wNbNR5UVSUXagb6ReKYJU3Vqboc4cDYo7"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmRKLuRKu1bVRPZwjYyS7vKuiFwL89H8peeBvxbpj9woHR",
      "tags": [
        "poster",
        "template",
        "customizable",
        "front"
      ],
      "title": "Complex Poster Array"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "35",
    "uri": "ipfs://QmPAaYGXLDr5oVvE13yQzR7YfwCpiy5AVXHWi3Z8y2HzUD"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQCj5uXeEu15DyivVAYL9wfHU9ydHgbRoxDgaAc7Ud5au",
            "tags": [
              "zone",
              "patch",
              "small"
            ],
            "title": "Patch Zone"
          },
          "physicalPrice": "200000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "1",
        "placementURI": "ipfs://QmRBVYhuGT3v1bBCstwN4F1ucBaJY4hyeepgVPsERYFX6X"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmfK6HGeYeV9a6LaVhcTYCj7oE9RzS5JssMRTFnSrMV9mt",
            "tags": [
              "zone"
            ],
            "title": "Irregular Box Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "20",
        "placementURI": "ipfs://QmcgeJWhiuXKeLkGnLXgV3PY2ZQPN1bQP5KchbQxQrNNr1"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8Ue8yNGfBpPHitS7L5nbkJrWYrsrToFEydWzscEEmo1",
            "tags": [
              "zone"
            ],
            "title": "Triangle Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "21",
        "placementURI": "ipfs://Qmc8JEqzoBCZuMhqutKgLJ145oTydhs5Lu1aZMoEQUw9Xg"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmUWqatDBdZMyytjsuEGiQEvT3qQDkUNV5smyPWKVQJzht",
            "tags": [
              "poster",
              "base",
              "garment"
            ],
            "title": "Poster Base"
          },
          "physicalPrice": "80000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "5",
        "placementURI": "ipfs://QmXsXwQR3pDT1m7bs45QMQbYt14zcFiie4uaPF9FMh64rX"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://Qmb6JDh2T6CNWFkJeYWqCG5ggXaDfD3X3mh3d3i8yzZZzX",
      "tags": [
        "poster",
        "template",
        "customizable",
        "front"
      ],
      "title": "Geometric Poster Configuration"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "36",
    "uri": "ipfs://QmRuWCvwokx9667fbEVKxwTLgSbXZG4KzKDtBMHQHr97y9"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZ3yCFYfGsJnH1B7oMAs4JiALWnfogMrJmt1wFDVbszSe",
            "tags": [
              "zone"
            ],
            "title": "Warped Square Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "22",
        "placementURI": "ipfs://QmYqWyLp9sSZfmJNjFWR5czbfLe3C8pP1RPiF5niS457gH"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZ3yCFYfGsJnH1B7oMAs4JiALWnfogMrJmt1wFDVbszSe",
            "tags": [
              "zone"
            ],
            "title": "Warped Square Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "22",
        "placementURI": "ipfs://QmTmVT8wGg3nJgkbzyMYqdywjeFKbhEeTZoV7eLWPGGKkg"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmUWqatDBdZMyytjsuEGiQEvT3qQDkUNV5smyPWKVQJzht",
            "tags": [
              "poster",
              "base",
              "garment"
            ],
            "title": "Poster Base"
          },
          "physicalPrice": "80000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "5",
        "placementURI": "ipfs://QmXsXwQR3pDT1m7bs45QMQbYt14zcFiie4uaPF9FMh64rX"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZGM3d5zZjJi93CM1PnLaa3MCxtwW1Cshc9ZCgc6278my",
            "tags": [
              "zone",
              "wide",
              "rectangular"
            ],
            "title": "Wide Rectangle Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "8",
        "placementURI": "ipfs://Qmeb3GTP6pbsCf4bmJh3FnpjWuodA9yG9c8tu5TrqmFcP3"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmR1HUREkm4PL8jRA6nk5xCgFqqoB9Jxj6uUfTKq2zKndz",
      "tags": [
        "poster",
        "template",
        "customizable",
        "front"
      ],
      "title": "Premium Poster Assembly"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "37",
    "uri": "ipfs://QmS2RPEWHcCtM6DGmYACCq8hD5RTitzbiv18VJB5rtMjS1"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmU94rbLdbZomteRRAR6Bkde3MhRBoAdgzhYK4SWygWDGd",
            "tags": [
              "zone"
            ],
            "title": "Thin Wide Rectangle Zone"
          },
          "physicalPrice": "10000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "23",
        "placementURI": "ipfs://QmXVgX1RCKJ2TWS3LZZowp5BttZmFR9Qd3n2squA3iXbZp"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmUWqatDBdZMyytjsuEGiQEvT3qQDkUNV5smyPWKVQJzht",
            "tags": [
              "poster",
              "base",
              "garment"
            ],
            "title": "Poster Base"
          },
          "physicalPrice": "80000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "5",
        "placementURI": "ipfs://QmXsXwQR3pDT1m7bs45QMQbYt14zcFiie4uaPF9FMh64rX"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZGM3d5zZjJi93CM1PnLaa3MCxtwW1Cshc9ZCgc6278my",
            "tags": [
              "zone",
              "wide",
              "rectangular"
            ],
            "title": "Wide Rectangle Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "8",
        "placementURI": "ipfs://QmNtzgP1GGwfgMss3kd1Ab4CSyS1JAvVeNVFWg4ME3TMBP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZGM3d5zZjJi93CM1PnLaa3MCxtwW1Cshc9ZCgc6278my",
            "tags": [
              "zone",
              "wide",
              "rectangular"
            ],
            "title": "Wide Rectangle Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "8",
        "placementURI": "ipfs://QmXQfwZDBFEgJ1kXcBmAXwPKd797G3DecZ2M2bxibUioRo"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZGM3d5zZjJi93CM1PnLaa3MCxtwW1Cshc9ZCgc6278my",
            "tags": [
              "zone",
              "wide",
              "rectangular"
            ],
            "title": "Wide Rectangle Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "8",
        "placementURI": "ipfs://QmTRhnEjupNWskmpTysnAYyLPg62jfTBXamR7iwXnSfaEj"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZGM3d5zZjJi93CM1PnLaa3MCxtwW1Cshc9ZCgc6278my",
            "tags": [
              "zone",
              "wide",
              "rectangular"
            ],
            "title": "Wide Rectangle Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "8",
        "placementURI": "ipfs://QmdpMKUX8PAKsQ5RP3tyycQ2xJr6EywXsS5jhpii3Fr4xV"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZGM3d5zZjJi93CM1PnLaa3MCxtwW1Cshc9ZCgc6278my",
            "tags": [
              "zone",
              "wide",
              "rectangular"
            ],
            "title": "Wide Rectangle Zone"
          },
          "physicalPrice": "100000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "8",
        "placementURI": "ipfs://QmSNJ4sDnWYmz1A1eJYXvRNtoYCcbTtQqP3VNKMgR9YLPd"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmP276ZhbaRvJCCbkVKsP3SByTExpq3KpPSwjuf8ZVtnfg",
      "tags": [
        "poster",
        "template",
        "customizable",
        "front"
      ],
      "title": "Multi-Edge Poster Unit"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "38",
    "uri": "ipfs://QmczuFpegKqwGhPZxYUhpcjUBJcFmC5u6PKeyY1TW5Eejw"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQuh5VZYqwx5bFPmPC8iS42kGGw1zScwGmZ7Tgdt6DnxB",
            "tags": [
              "zone"
            ],
            "title": "Tall Thin Rectangle Zone"
          },
          "physicalPrice": "8000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "24",
        "placementURI": "ipfs://QmQhPnRYrVR2omRfq7FgmvCLsfFimnwUS9LopLwtzzRDox"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmUWqatDBdZMyytjsuEGiQEvT3qQDkUNV5smyPWKVQJzht",
            "tags": [
              "poster",
              "base",
              "garment"
            ],
            "title": "Poster Base"
          },
          "physicalPrice": "80000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "5",
        "placementURI": "ipfs://QmXsXwQR3pDT1m7bs45QMQbYt14zcFiie4uaPF9FMh64rX"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://Qmcx2r31dQ1JNqmEJDHoJWxTDwCvHWr1h6s6L84hH4EuEg"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmYejtvUzdy2CP8TV4MR78Qpj3Esfm2rUJ278hvd23oCoo"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmQW5QRjVdmM486gp8grTyd9gJiYXFVHJ8bDgYuVZ4EBdK"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmWRkjmojDXdmEbWX8bdavoXRGfhzUwRD4G7Yz4K2sx6cn",
      "tags": [
        "poster",
        "template",
        "customizable",
        "front"
      ],
      "title": "Diagonal Poster Matrix"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "39",
    "uri": "ipfs://QmVTpEoySbZN6iZRAjYyoPP1F97eqrLGgREhDyYHBEj7HN"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZTXdZRwFRpGFCidySe2FxHdnStYMHh4LvLYQCF6dgcJ7",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "2",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWwRYcuyNeXzNFbFHn6NomxerQJH7gpdv337uNkygvS3u",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "6",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmZCiFkntv59eDymtZKpLbFuy1HHVBgWk7YxJbousgUhmE",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Hood Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "7",
        "placementURI": "ipfs://QmbAJcLY8STrntufkvHTDkaMViqDFLz3dz2VTDPQS1MiTR"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmeRcLaAJt2tMEtc6fQs4awzZJHPLUGkGsk7sM4FijBa2S",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Pocket Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "8",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmTEAfKjAnJ8Rm7BwgzGCtb1wE5H9J3BkSoEFgeBCeHU2a",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Cuff Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "9",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmR2aM7nPH6PmswKc4115GhdxbCEhwDhFAUqXBGrDZuCws",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "10",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZQFmPophwckf4UKDCD5YMLPeism2oYNkrgFhN33N52Q6",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Waist Band Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "11",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmdgzuNmEiRSwsmSw4ghohdx31rdDzwYgQBbXfH3DG9eD5",
            "tags": [
              "zone",
              "warped",
              "rectangular"
            ],
            "title": "Right-Warped Zone"
          },
          "physicalPrice": "180000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "15",
        "placementURI": "ipfs://QmZEPYe3RtUq5T3qXV2k7aS2nrtiRkw4yL3Yrehg7F9sVv"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmeGGCymoTVdfg6MTShE7PKEsyJ3Mhrw5FY3dFPF88bJAn",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "front"
      ],
      "title": "Textile Mill Standard"
    },
    "physicalPrice": "350000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "4",
    "uri": "ipfs://QmaNidpzPmXCKdnFqG7pwVWnFrND665tCqN4dWbwinvAev"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://Qmd8Ue8yNGfBpPHitS7L5nbkJrWYrsrToFEydWzscEEmo1",
            "tags": [
              "zone"
            ],
            "title": "Triangle Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "21",
        "placementURI": "ipfs://Qmc8Bz5DjpMvXonfE1NUiPt8RReewJMrNKbMKzrp9BJCrJ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQuh5VZYqwx5bFPmPC8iS42kGGw1zScwGmZ7Tgdt6DnxB",
            "tags": [
              "zone"
            ],
            "title": "Tall Thin Rectangle Zone"
          },
          "physicalPrice": "8000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "24",
        "placementURI": "ipfs://QmQjErecqijRP6RW7WgpGZhjjxYBwkoL8uc9U8KAt2Fuf8"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmVCz3uknLG8deY1urjdGSbyj1VGcvXtc5wwkKNhCejBqU",
            "tags": [
              "zone"
            ],
            "title": "Diagonal Cut Zone"
          },
          "physicalPrice": "28000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "25",
        "placementURI": "ipfs://QmYBDJn45BveAy4HPiHohFpo2U3rXxdroY8usBfmxSmPzb"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZvh5SdjPwu3SRDr93k3wihssFovM1zcW5NzMX9HxeYRJ",
            "tags": [
              "zone"
            ],
            "title": "Semi Triangle Zone"
          },
          "physicalPrice": "30000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "26",
        "placementURI": "ipfs://QmSt3Dcfn5AWzPFsDYX1oorMAQ1YYZeVJkYMp9qTWcurc4"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmUWqatDBdZMyytjsuEGiQEvT3qQDkUNV5smyPWKVQJzht",
            "tags": [
              "poster",
              "base",
              "garment"
            ],
            "title": "Poster Base"
          },
          "physicalPrice": "80000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "5",
        "placementURI": "ipfs://QmXsXwQR3pDT1m7bs45QMQbYt14zcFiie4uaPF9FMh64rX"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmQWXCCnzN9HH2GmGvTKCbyv28dBX5qCJVB5sFFkupWvxy",
      "tags": [
        "poster",
        "template",
        "customizable",
        "front"
      ],
      "title": "Cutout Poster Assembly"
    },
    "physicalPrice": "200000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "40",
    "uri": "ipfs://QmQfGhwkAuGGmfVVZ4D6nYqepCky6GikKkyByGBz65DPg2"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmaCRvFxetVUGkCZECNN3SRY6ttd6TDg8jYLsbar2u6cp4",
            "tags": [
              "zone",
              "tall",
              "diagonal"
            ],
            "title": "Diagonal-Top Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "16",
        "placementURI": "ipfs://QmWV7ynUChPJRC27MCrfdtTc9aLVp7USGWv1CSvyxHTZCM"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmPdyAWLb6d2fV9Vaz6mNHQVyYSErsCM3f8GMAwJiEz2Pm",
            "tags": [
              "zone",
              "square",
              "simple"
            ],
            "title": "Simple Square Zone"
          },
          "physicalPrice": "10000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "17",
        "placementURI": "ipfs://QmXBmJWtTncULSdRmjrwmoNJbzpDEnTrkJCgov87om8ZUH"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZTXdZRwFRpGFCidySe2FxHdnStYMHh4LvLYQCF6dgcJ7",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "2",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWwRYcuyNeXzNFbFHn6NomxerQJH7gpdv337uNkygvS3u",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "6",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmZCiFkntv59eDymtZKpLbFuy1HHVBgWk7YxJbousgUhmE",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Hood Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "7",
        "placementURI": "ipfs://QmbAJcLY8STrntufkvHTDkaMViqDFLz3dz2VTDPQS1MiTR"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmeRcLaAJt2tMEtc6fQs4awzZJHPLUGkGsk7sM4FijBa2S",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Pocket Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "8",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmTEAfKjAnJ8Rm7BwgzGCtb1wE5H9J3BkSoEFgeBCeHU2a",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Cuff Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "9",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmPk1y1NWnNAEf2bcvYFihfUznwFj7uDcxiXxNCAGVsRpt",
            "tags": [
              "zone",
              "tall",
              "rectangular"
            ],
            "title": "Tall Rectangle Zone"
          },
          "physicalPrice": "120000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "10",
        "placementURI": "ipfs://Qmd8ZD2aMQYPVztJEUb1ER9YeNJwmawciKdGo2c591qbyE"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmR2aM7nPH6PmswKc4115GhdxbCEhwDhFAUqXBGrDZuCws",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "10",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZQFmPophwckf4UKDCD5YMLPeism2oYNkrgFhN33N52Q6",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Waist Band Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "11",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmWKRcYN1n6LTAK17rTDbphnxV4R9HHk8bt5Ug4WJcu8dn",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "front"
      ],
      "title": "Garment Press Elite"
    },
    "physicalPrice": "350000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "5",
    "uri": "ipfs://QmfFf1ptUCcGkrLtZ19c4uzpE5w3HVkjAWaA6UU82dqDPS"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmSZY9UHMq3LqePuofNLy64VW8gjqz1WwHfwJxQvCvesXm",
            "tags": [
              "zone",
              "sleeve",
              "irregular"
            ],
            "title": "Sleeve-Path Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "18",
        "placementURI": "ipfs://QmWRA9vNVKkmAUZB5oeGZd98gPPyxpyfda3ottaFU1C6Fd"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmSZY9UHMq3LqePuofNLy64VW8gjqz1WwHfwJxQvCvesXm",
            "tags": [
              "zone",
              "sleeve",
              "irregular"
            ],
            "title": "Sleeve-Path Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "18",
        "placementURI": "ipfs://QmfRJziA2hNrXb352kDiyArohZa3cif4hpqbUguG6o559i"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZTXdZRwFRpGFCidySe2FxHdnStYMHh4LvLYQCF6dgcJ7",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "2",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWwRYcuyNeXzNFbFHn6NomxerQJH7gpdv337uNkygvS3u",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "6",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmQXwScW3ixk259unX422y95fQudeReFagDqbVJ33SRw87"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmZCiFkntv59eDymtZKpLbFuy1HHVBgWk7YxJbousgUhmE",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Hood Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "7",
        "placementURI": "ipfs://QmbAJcLY8STrntufkvHTDkaMViqDFLz3dz2VTDPQS1MiTR"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmeRcLaAJt2tMEtc6fQs4awzZJHPLUGkGsk7sM4FijBa2S",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Pocket Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "8",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmTEAfKjAnJ8Rm7BwgzGCtb1wE5H9J3BkSoEFgeBCeHU2a",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Cuff Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "9",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmR2aM7nPH6PmswKc4115GhdxbCEhwDhFAUqXBGrDZuCws",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "10",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZQFmPophwckf4UKDCD5YMLPeism2oYNkrgFhN33N52Q6",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Waist Band Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "11",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://Qmaapos1vriR3jZAa3f3DRbNj6WFGDExx7PBWsmLN49kGW",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "front"
      ],
      "title": "Rotary Screen Assembly"
    },
    "physicalPrice": "350000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "6",
    "uri": "ipfs://QmXp7eqQD97ctWMcx5H7svjak1rFP2FCtvLKdprHYPogiE"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZTXdZRwFRpGFCidySe2FxHdnStYMHh4LvLYQCF6dgcJ7",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "2",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWwRYcuyNeXzNFbFHn6NomxerQJH7gpdv337uNkygvS3u",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "6",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmTHSnQ1SKGKE9hwHMVA5kHBw4bbCrT3vWPP4qim7qVnyT"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmeT4h2q5kBNkryoP5iC11vpq7iSmW43GXkn5mpkH4jLsY"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmP2UVYk5Cf6JT9eJ2kHS7gMb67X7vaYWaqxc8cM7n3dq1",
            "tags": [
              "zone",
              "circle",
              "rounded"
            ],
            "title": "Circle Zone"
          },
          "physicalPrice": "220000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "7",
        "placementURI": "ipfs://QmXZ19sUuAe9p5U7fg21vfhiP8ykzGNFpk1JfQKHhXmw5z"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmZCiFkntv59eDymtZKpLbFuy1HHVBgWk7YxJbousgUhmE",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Hood Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "7",
        "placementURI": "ipfs://QmbAJcLY8STrntufkvHTDkaMViqDFLz3dz2VTDPQS1MiTR"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmeRcLaAJt2tMEtc6fQs4awzZJHPLUGkGsk7sM4FijBa2S",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Pocket Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "8",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmTEAfKjAnJ8Rm7BwgzGCtb1wE5H9J3BkSoEFgeBCeHU2a",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Cuff Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "9",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmR2aM7nPH6PmswKc4115GhdxbCEhwDhFAUqXBGrDZuCws",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "10",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZQFmPophwckf4UKDCD5YMLPeism2oYNkrgFhN33N52Q6",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Waist Band Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "11",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmSQkPKVtBg3SFNn7j4DCby2tepMJ9fDphyom1zHrY6KD6",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "front"
      ],
      "title": "Jacquard Loom Series"
    },
    "physicalPrice": "350000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "7",
    "uri": "ipfs://Qmb8tVxMtqEdFwARB9onR1krLzpCB6gD4gfyCD224GdHGk"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmSZY9UHMq3LqePuofNLy64VW8gjqz1WwHfwJxQvCvesXm",
            "tags": [
              "zone",
              "sleeve",
              "irregular"
            ],
            "title": "Sleeve-Path Zone"
          },
          "physicalPrice": "20000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "18",
        "placementURI": "ipfs://QmfRJziA2hNrXb352kDiyArohZa3cif4hpqbUguG6o559i"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZTXdZRwFRpGFCidySe2FxHdnStYMHh4LvLYQCF6dgcJ7",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "2",
        "placementURI": "ipfs://QmeqD99mpKUmYA54ts7netoZpfFmMYVoZZ5jyyTkLHANkQ"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmQKPxrGXVdmNhawv9L2jx5wTkeJGqDQCKzDRLNCkH5EBA",
            "tags": [
              "zone",
              "jagged",
              "irregular"
            ],
            "title": "Jagged Zone"
          },
          "physicalPrice": "280000000000000000"
        },
        "childContract": "0x3c367e37cabc88b1641e1590f63baabf35409ca1",
        "childId": "6",
        "placementURI": "ipfs://QmQSUnCLrNASyFM9Y6DpXspdNgfffFQGR4DrYoXnCDwMLn"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWwRYcuyNeXzNFbFHn6NomxerQJH7gpdv337uNkygvS3u",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Front Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "6",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmZCiFkntv59eDymtZKpLbFuy1HHVBgWk7YxJbousgUhmE",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Hood Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "7",
        "placementURI": "ipfs://QmbAJcLY8STrntufkvHTDkaMViqDFLz3dz2VTDPQS1MiTR"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmeRcLaAJt2tMEtc6fQs4awzZJHPLUGkGsk7sM4FijBa2S",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Pocket Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "8",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmTEAfKjAnJ8Rm7BwgzGCtb1wE5H9J3BkSoEFgeBCeHU2a",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Cuff Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "9",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "2",
        "child": {
          "metadata": {
            "image": "ipfs://QmR2aM7nPH6PmswKc4115GhdxbCEhwDhFAUqXBGrDZuCws",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Sleeve Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "10",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmZQFmPophwckf4UKDCD5YMLPeism2oYNkrgFhN33N52Q6",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Waist Band Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "11",
        "placementURI": "ipfs://QmRNwJF4bHNfYn4wZjucpNP8SRu537SJccWkHwpYoSwTRN"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://QmQAsGfzTUGamateSj7UF6knkFiPz7J1Xz4gaScX4fbvjy",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "front"
      ],
      "title": "Flatbed Press Configuration"
    },
    "physicalPrice": "350000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "8",
    "uri": "ipfs://Qmd1RDRm55wnm4ZohtpkFCC6YmbxNvmZXZBxA9gAWV1chc"
  },
  {
    "childReferences": [
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmWsT4GjHcYF8PWQmCnnxsA7gUwrVsqQGt6MvQfUxi5kr1",
            "tags": [
              "hoodie",
              "base",
              "garment"
            ],
            "title": "Hoodie Base Back"
          },
          "physicalPrice": "110000000000000000"
        },
        "childContract": "0x3b08f16ccbdd3f843848d97560a1347c4c89b7cf",
        "childId": "4",
        "placementURI": "ipfs://QmTURGLiT4mMDFzBCxjtfRBMtHWUNhDM3Cqy1Zpybr8DHu"
      },
      {
        "amount": "1",
        "child": {
          "metadata": {
            "image": "ipfs://QmYpqS8Bvooy8VZuyYB4QCa4AEzyiKYaevLZxTMdSKQ8LW",
            "tags": [
              "pattern",
              "element",
              "hoodie"
            ],
            "title": "Hoodie Back Panel Pattern"
          },
          "physicalPrice": "0"
        },
        "childContract": "0x769ac5296433a2a089706f8fe4f477e1d335b022",
        "childId": "5",
        "placementURI": "ipfs://QmVfoi7aJwXhkEkkt1xx1uEWtdBiBMEH7G31L9BstP21kP"
      }
    ],
    "childType": "1",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "image": "ipfs://Qma4zLdVMKRkU32c8FGuq4J4W9nZ9ae9SusQ4HUEGyGgRA",
      "tags": [
        "hoodie",
        "template",
        "customizable",
        "back"
      ],
      "title": "Basic Hood Back"
    },
    "physicalPrice": "100000000000000000",
    "templateContract": "0xb3a7fa244e230da90e93a68fd04c1f07e1f62f23",
    "templateId": "9",
    "uri": "ipfs://QmTejQoGFk6xc3e2r4qNEHwPvANcQN1EP32HbrwMXbEyoB"
  }
]"#;

    let client = reqwest::Client::new();

    let templates: Vec<Value> = serde_json::from_str(templates_json)
        .map_err(|e| format!("Failed to parse templates JSON: {}", e))?;

    let mut template_data = Vec::new();

    for template in &templates {
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

        let physical_price = template
            .get("physicalPrice")
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
                    .get("placementURI")
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

                let amount = child_ref.get("amount").and_then(|v| {
                    if let Some(s) = v.as_str() {
                        s.parse::<i32>().ok()
                    } else {
                        v.as_i64().map(|i| i as i32)
                    }
                });

                let (child, physical_price) = if let Some(child_data) = child_ref.get("child") {
                    let physical_price = child_data
                        .get("physicalPrice")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();

                    let metadata = if let Some(meta) = child_data.get("metadata") {
                        let title = meta
                            .get("title")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        let image = meta
                            .get("image")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        let description = meta
                            .get("description")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        let tags = meta
                            .get("tags")
                            .and_then(|v| v.as_array())
                            .map(|arr| {
                                arr.iter()
                                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                                    .collect()
                            });
                        Some(ChildMetadata {
                            title,
                            description,
                            image,
                            tags,
                        })
                    } else {
                        None
                    };

                    (Some(Child { metadata }), physical_price)
                } else {
                    (None, String::new())
                };

                let parsed_metadata = fetch_ipfs_metadata(&uri, &client).await;

                child_references.push(ChildReference {
                    uri,
                    child_id,
                    child_contract,
                    amount,
                    price: physical_price,
                    child,
                    metadata: parsed_metadata,
                });
            }
        }

        let metadata = if let Some(meta) = template.get("metadata") {
            let title = meta
                .get("title")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let image = meta
                .get("image")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let tags = meta
                .get("tags")
                .and_then(|v| v.as_array())
                .map(|arr| {
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
                ratio,
            })
        } else {
            None
        };

        template_data.push(TemplateData {
            price: physical_price,
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

pub async fn fetch_children_materials_colors() -> Result<Value, String> {
    // opcão dois -> subgraph não está ativo 
    // let api_key = "";

    // let client = reqwest::Client::new();

    // let query =
    //     r#"
    // {
    //   childs(where: { or: [{childContract: "0xf71d3b3a5efa4f8e34d4cd922831833350fa3dfb"}, {childContract: "0x029bc2ba787c131fd58938a192787c066955cd2f"}] }) {
    //     childContract
    //     childId
    //     physicalPrice
    //     childType
    //     infraCurrency
    //     metadata {
    //       title
    //       image
    //       tags
    //       description
    //     }
    //     uri
    //   }
    // }
    // "#;

    // let query_body = json!({
    //     "query": query
    // });

    // let url = format!(
    //     "https://gateway.thegraph.com/api/subgraphs/id/4jujS6j8wMahNTSzN2T8wN7iTiEfNRQfoYYQL7Q1Bn9X"
    // );

    // let response = client
    //     .post(&url)
    //     .header("Authorization", format!("Bearer {}", api_key))
    //     .header("Content-Type", "application/json")
    //     .json(&query_body)
    //     .send().await
    //     .map_err(|e| format!("Request failed: {}", e))?;

    // if !response.status().is_success() {
    //     return Err(format!("HTTP error: {}", response.status()));
    // }

    // let response_text = response
    //     .text().await
    //     .map_err(|e| format!("Failed to read response: {}", e))?;

    // let parsed: Value = serde_json
    //     ::from_str(&response_text)
    //     .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    // if let Some(errors) = parsed.get("errors") {
    //     return Err(format!("GraphQL errors: {}", errors));
    // }

    // let childs = parsed
    //     .get("data")
    //     .and_then(|data| data.get("childs"))
    //     .and_then(|childs| childs.as_array())
    //     .ok_or("Invalid response structure")?;


        let childs_json = r##"[
  {
    "childContract": "0x029bc2ba787c131fd58938a192787c066955cd2f",
    "childId": "1",
    "childType": "4",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "description": "100% Cotton. Basic quality.",
      "image": "ipfs://QmTSTf4grQBAZkhapFr34SR4cp5hfdNUtNLJnbQBV1fAcP",
      "tags": [
        "substrate",
        "material",
        "apparel",
        "fabric"
      ],
      "title": "Standard Cotton"
    },
    "physicalPrice": "500000000000000000",
    "uri": "ipfs://QmQFQ1AtiWs6Spg1gyXXbkrVkGnaRK1BwybpsRsnyfAxQL"
  },
  {
    "childContract": "0x029bc2ba787c131fd58938a192787c066955cd2f",
    "childId": "2",
    "childType": "4",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "description": "100% Organic Cotton. Premium quality.",
      "image": "ipfs://QmTf7HmtyqqNn7CiG62V2aktCap7Pweu5iHuFWXBViDqRN",
      "tags": [
        "substrate",
        "material",
        "apparel",
        "fabric"
      ],
      "title": "Premium Cotton"
    },
    "physicalPrice": "600000000000000000",
    "uri": "ipfs://QmPxMMG3GatMtBqdEv2rnVGV4LHDssMkQpHqEd4epSHp8k"
  },
  {
    "childContract": "0x029bc2ba787c131fd58938a192787c066955cd2f",
    "childId": "3",
    "childType": "4",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "description": "Basic vinyl print material.",
      "image": "ipfs://QmT5kR6LGtwNukwMCn8m7zMTnusxnuymwJQK5YENCuDWrY",
      "tags": [
        "substrate",
        "material",
        "print",
        "vinyl"
      ],
      "title": "Standard Vinyl"
    },
    "physicalPrice": "200000000000000000",
    "uri": "ipfs://QmZfywnTJrzeGbpFxjffrycfppjxhKQ8bUmvA3XHy9N7db"
  },
  {
    "childContract": "0x029bc2ba787c131fd58938a192787c066955cd2f",
    "childId": "4",
    "childType": "4",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "description": "Weather-resistant vinyl.",
      "image": "ipfs://QmQcfM4vkmT71QZrMKyUodEzBeqpCX6mRmjFkima6X6uh4",
      "tags": [
        "substrate",
        "material",
        "print",
        "vinyl"
      ],
      "title": "Premium Vinyl"
    },
    "physicalPrice": "400000000000000000",
    "uri": "ipfs://QmVGRDPny9Kab5NHGWAMSWw8xb51ycQFQUq3SUnY6CgSgm"
  },
  {
    "childContract": "0xf71d3b3a5efa4f8e34d4cd922831833350fa3dfb",
    "childId": "1",
    "childType": "3",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "description": "Print dye color: white.",
      "image": "ipfs://QmYcVAavU9LczC6JyaYnTQ5v6vacB6f7CE41Q5vx7Rhqpg",
      "tags": [
        "dye",
        "apparel",
        "color",
        "print"
      ],
      "title": "#FFF"
    },
    "physicalPrice": "0",
    "uri": "ipfs://QmV9ft4gU6S81rdVzCWaC3cpcbJ9dbLjVMCRoGxUbmUrTy"
  },
  {
    "childContract": "0xf71d3b3a5efa4f8e34d4cd922831833350fa3dfb",
    "childId": "2",
    "childType": "3",
    "infraCurrency": "0x28547b5b6b405a1444a17694ac84aa2d6a03b3bd",
    "metadata": {
      "description": "Print dye color: black.",
      "image": "ipfs://QmadCWNpJy6SHS9zghZZemmCXJ4XBr3gWUPWqKW7bHoLwb",
      "tags": [
        "dye",
        "apparel",
        "color"
      ],
      "title": "#000"
    },
    "physicalPrice": "0",
    "uri": "ipfs://QmeNEMNm4PUr7dE7umDnfeMReZFqC52zHSTc7R6NaGiQLR"
  }
]"##;

    let childs: Vec<Value> = serde_json::from_str(childs_json)
        .map_err(|e| format!("Failed to parse childs JSON: {}", e))?;

    let mut materials_data = Vec::new();
    let mut colors_data = Vec::new();

    for child in &childs {
        let child_contract = child
            .get("childContract")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let child_id = child
            .get("childId")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let physical_price = child
            .get("physicalPrice")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let infra_currency = child
            .get("infraCurrency")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let uri = child
            .get("uri")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let child_type = child
            .get("childType")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let metadata = if let Some(meta) = child.get("metadata") {
            let title = meta
                .get("title")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let image = meta
                .get("image")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let description = meta
                .get("description")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let tags = meta
                .get("tags")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect()
                });
            Some(ChildMetadata {
                title,
                image,
                description,
                tags,
            })
        } else {
            None
        };

        if child_contract == "0x029bc2ba787c131fd58938a192787c066955cd2f" {
            materials_data.push(ChildData {
                price: physical_price,
                child_type,
                child_contract,
                child_id,
                currency: infra_currency,
                metadata,
                uri,
            });
        } else {
            colors_data.push(ChildData {
                price: physical_price,
                child_type,
                child_contract,
                child_id,
                currency: infra_currency,
                metadata,
                uri,
            });
        }
    }

    Ok(json!({
        "materials": materials_data,
        "colors": colors_data
    }))
}
