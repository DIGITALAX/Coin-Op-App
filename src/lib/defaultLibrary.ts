import { ComfyUIWorkflow, SynthPrompt, CompositePrompt } from "../components/Activity/types/activity.types";
import { v4 as uuidv4 } from "uuid";
export const defaultWorkflows: Omit<ComfyUIWorkflow, 'id' | 'createdAt' | 'lastModified'>[] = [
  {
    name: "Basic Text to Image",
    description: "Simple text-to-image generation with basic settings",
    workflowJson: {
      "1": {
        "inputs": {
          "ckpt_name": "v1-5-pruned-emaonly.ckpt"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
          "title": "Load Checkpoint"
        }
      },
      "2": {
        "inputs": {
          "text": "beautiful landscape, highly detailed, 8k",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "3": {
        "inputs": {
          "text": "blurry, low quality, watermark",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Negative Prompt)"
        }
      },
      "4": {
        "inputs": {
          "seed": 42,
          "steps": 20,
          "cfg": 7.0,
          "sampler_name": "euler",
          "scheduler": "normal",
          "denoise": 1.0,
          "model": ["1", 0],
          "positive": ["2", 0],
          "negative": ["3", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "KSampler"
        }
      },
      "5": {
        "inputs": {
          "width": 512,
          "height": 512,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage",
        "_meta": {
          "title": "Empty Latent Image"
        }
      },
      "6": {
        "inputs": {
          "samples": ["4", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE Decode"
        }
      },
      "7": {
        "inputs": {
          "images": ["6", 0],
          "filename_prefix": "ComfyUI"
        },
        "class_type": "SaveImage",
        "_meta": {
          "title": "Save Image"
        }
      }
    },
    isDefault: true,
  },
  {
    name: "LoRA Enhanced Generation",
    description: "Text-to-image with LoRA enhancement for style control",
    workflowJson: {
      "1": {
        "inputs": {
          "ckpt_name": "v1-5-pruned-emaonly.ckpt"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
          "title": "Load Checkpoint"
        }
      },
      "2": {
        "inputs": {
          "lora_name": "add_detail.safetensors",
          "strength_model": 1.0,
          "strength_clip": 1.0,
          "model": ["1", 0],
          "clip": ["1", 1]
        },
        "class_type": "LoraLoader",
        "_meta": {
          "title": "LoRA Loader"
        }
      },
      "3": {
        "inputs": {
          "text": "masterpiece, best quality, highly detailed portrait",
          "clip": ["2", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "4": {
        "inputs": {
          "text": "worst quality, low quality, normal quality, lowres, bad anatomy, bad hands, multiple eyebrow, cropped, extra limb, missing limbs, deformed hands, long neck, long body, bad hands, signature, username, artist name, conjoined fingers, deformed fingers, ugly eyes, imperfect eyes, skewed eyes, unnatural face, stiff face, stiff body, ugly, extra fingers, malformed limbs, more than 2 nipples, extra nipples, extra arms, missing arms, missing fingers, amputee, amputated, watermark",
          "clip": ["2", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Negative Prompt)"
        }
      },
      "5": {
        "inputs": {
          "seed": 123456,
          "steps": 30,
          "cfg": 8.0,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 1.0,
          "model": ["2", 0],
          "positive": ["3", 0],
          "negative": ["4", 0],
          "latent_image": ["6", 0]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "KSampler"
        }
      },
      "6": {
        "inputs": {
          "width": 768,
          "height": 768,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage",
        "_meta": {
          "title": "Empty Latent Image"
        }
      },
      "7": {
        "inputs": {
          "samples": ["5", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE Decode"
        }
      },
      "8": {
        "inputs": {
          "images": ["7", 0],
          "filename_prefix": "LoRA_Enhanced"
        },
        "class_type": "SaveImage",
        "_meta": {
          "title": "Save Image"
        }
      }
    },
    isDefault: true,
  }
];
export const defaultSynthPrompts: Omit<SynthPrompt, 'id' | 'createdAt' | 'lastModified'>[] = [
  {
    name: "Abstract Geometric Pattern",
    prompt: "abstract geometric pattern, vibrant colors, clean lines, symmetrical design, modern minimalist style, vector art aesthetic",
    negativePrompt: "blurry, pixelated, messy, chaotic, realistic, photographic",
    settings: {
      steps: 25,
      cfgScale: 7.5,
      sampler: "euler_a",
      scheduler: "normal",
      seed: -1
    },
    description: "Perfect for creating clean geometric patterns for textile designs",
    isDefault: true,
  },
  {
    name: "Organic Nature Motifs",
    prompt: "flowing organic shapes, nature-inspired motifs, leaves, vines, botanical elements, seamless pattern, earthy colors, hand-drawn style",
    negativePrompt: "geometric, artificial, synthetic, mechanical, urban, industrial",
    settings: {
      steps: 30,
      cfgScale: 8.0,
      sampler: "dpmpp_2m",
      scheduler: "karras",
      seed: -1
    },
    description: "Ideal for natural, organic-looking fabric patterns",
    isDefault: true,
  },
  {
    name: "Retro Pop Art",
    prompt: "retro pop art style, bold colors, halftone dots, comic book aesthetic, vintage advertising, 1960s design, high contrast",
    negativePrompt: "modern, minimalist, muted colors, realistic, photographic",
    settings: {
      steps: 20,
      cfgScale: 9.0,
      sampler: "euler",
      scheduler: "normal",
      seed: -1
    },
    description: "Great for creating eye-catching retro-style designs",
    isDefault: true,
  },
  {
    name: "Cyberpunk Neon",
    prompt: "cyberpunk aesthetic, neon colors, glitch effects, digital noise, futuristic patterns, synthwave style, electric blue and pink",
    negativePrompt: "natural, organic, pastel, soft, traditional, vintage",
    settings: {
      steps: 35,
      cfgScale: 7.0,
      sampler: "dpmpp_sde",
      scheduler: "karras",
      seed: -1
    },
    description: "Perfect for modern, tech-inspired designs",
    isDefault: true,
  }
];
export const defaultCompositePrompts: Omit<CompositePrompt, 'id' | 'createdAt' | 'lastModified'>[] = [
  {
    name: "Layered Abstract Composition",
    prompt: "layered abstract composition, multiple transparent overlays, depth, color gradients, artistic blend modes, contemporary design",
    negativePrompt: "flat, single layer, simple, basic, amateur",
    settings: {
      steps: 28,
      cfgScale: 8.5,
      sampler: "dpmpp_2m",
      scheduler: "karras",
      seed: -1
    },
    description: "Creates complex, multi-layered compositions for sophisticated designs",
    isDefault: true,
  },
  {
    name: "Mixed Media Collage",
    prompt: "mixed media collage, textured surfaces, paper cutouts, paint splatters, artistic chaos, creative composition, analog feel",
    negativePrompt: "digital, clean, uniform, sterile, perfect",
    settings: {
      steps: 32,
      cfgScale: 7.5,
      sampler: "euler_a",
      scheduler: "normal",
      seed: -1
    },
    description: "Ideal for creating artistic, handmade-looking composite designs",
    isDefault: true,
  },
  {
    name: "Holographic Overlay",
    prompt: "holographic overlay effect, iridescent colors, rainbow reflections, futuristic transparency, prismatic light, digital shimmer",
    negativePrompt: "matte, opaque, dull, flat, monochrome",
    settings: {
      steps: 40,
      cfgScale: 6.5,
      sampler: "dpmpp_sde",
      scheduler: "exponential",
      seed: -1
    },
    description: "Perfect for adding futuristic, holographic elements to designs",
    isDefault: true,
  },
  {
    name: "Vintage Photo Montage",
    prompt: "vintage photo montage, sepia tones, aged paper texture, nostalgic composition, old photographs, antique aesthetic, weathered edges",
    negativePrompt: "modern, digital, pristine, new, colorful, vibrant",
    settings: {
      steps: 25,
      cfgScale: 8.0,
      sampler: "euler",
      scheduler: "normal",
      seed: -1
    },
    description: "Great for creating nostalgic, vintage-style composite designs",
    isDefault: true,
  }
];
export const initializeDefaultLibrary = async (
  createWorkflow: (data: { name: string; description?: string; data: any }) => Promise<ComfyUIWorkflow>,
  createSynthPrompt: (data: { name: string; description?: string; data: SynthPrompt }) => Promise<SynthPrompt>,
  createCompositePrompt: (data: { name: string; description?: string; data: CompositePrompt }) => Promise<CompositePrompt>
) => {
  try {
    for (const workflow of defaultWorkflows) {
      await createWorkflow({
        name: workflow.name,
        description: workflow.description,
        data: workflow.workflowJson
      });
    }
    for (const prompt of defaultSynthPrompts) {
      await createSynthPrompt({
        name: prompt.name,
        description: prompt.description,
        data: {
          ...prompt,
          id: uuidv4(),
          createdAt: new Date(),
          lastModified: new Date()
        }
      });
    }
    for (const prompt of defaultCompositePrompts) {
      await createCompositePrompt({
        name: prompt.name,
        description: prompt.description,
        data: {
          ...prompt,
          id: uuidv4(),
          createdAt: new Date(),
          lastModified: new Date()
        }
      });
    }
  } catch (error) {
  }
};