import { ChangeEvent, useEffect, useState, useCallback } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useDesignContext } from "../../../context/DesignContext";
import { UseGeneratorProps } from "../types/synth.types";

const useGenerator = ({
  mode = "synth",
  onImageGenerated,
  getCanvasImage,
}: UseGeneratorProps = {}) => {
  const { setItem, getItem } = useDesignStorage();
  const { currentDesign, refreshDesigns } = useDesignContext();
  const [aiProvider, setAiProvider] = useState<string>("openai");
  const [showProviderDropdown, setShowProviderDropdown] =
    useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<{
    openai: string;
    replicate: string;
    comfy: string;
  }>({
    openai: "",
    replicate: "",
    comfy: "",
  });
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);
  const [selectedLora, setSelectedLora] = useState<string>("");
  const [showLoraDropdown, setShowLoraDropdown] = useState<boolean>(false);
  const [useCanvasAsInput, setUseCanvasAsInput] = useState<boolean>(true);
  const [overwriteCanvas, setOverwriteCanvas] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationController, setGenerationController] =
    useState<AbortController | null>(null);
  const [generationHistory, setGenerationHistory] = useState<
    Array<{
      id: string;
      imageData: string;
      prompt: string;
      model: string;
      provider: string;
      timestamp: Date;
      settings: any;
    }>
  >([]);
  const [prompt, setPrompt] = useState<string>("");
  const [openAiSettings, setOpenAiSettings] = useState<{
    style: string;
    quality: string;
    size: string;
    background: string;
    inputFidelity: string;
  }>({
    style: "vivid",
    quality: "standard",
    size: "1024x1024",
    background: "auto",
    inputFidelity: "low",
  });
  const [showStyleDropdown, setShowStyleDropdown] = useState<boolean>(false);
  const [showQualityDropdown, setShowQualityDropdown] =
    useState<boolean>(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState<boolean>(false);
  const [showBackgroundDropdown, setShowBackgroundDropdown] =
    useState<boolean>(false);
  const [showInputFidelityDropdown, setShowInputFidelityDropdown] =
    useState<boolean>(false);
  const [replicateSettings, setReplicateSettings] = useState<{
    numInferenceSteps: number;
    aspectRatio: string;
  }>({
    numInferenceSteps: 4,
    aspectRatio: "1:1",
  });
  const [showInferenceStepsDropdown, setShowInferenceStepsDropdown] =
    useState<boolean>(false);
  const [showAspectRatioDropdown, setShowAspectRatioDropdown] =
    useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showNodeEditor, setShowNodeEditor] = useState<boolean>(false);
  const [comfySettings, setComfySettings] = useState<{
    workflowJson: any;
    workflowFileName: string;
    promptNodes: {
      nodeId: string;
      inputKey: string;
      currentText: string;
    }[];
    hasImageInput: boolean;
    url: string;
  }>({
    url: "http://localhost:8188",
    workflowJson: null,
    workflowFileName: "",
    promptNodes: [],
    hasImageInput: false,
  });
  const loadSettings = useCallback(async () => {
    try {
      const savedProvider = await getItem("aiProvider", mode, "openai");
      setAiProvider(savedProvider || "openai");
      const savedApiKeys = await getItem("apiKeys", mode, {
        openai: "",
        replicate: "",
        comfy: "",
      });
      setApiKeys(
        savedApiKeys || {
          openai: "",
          replicate: "",
          comfy: "",
        }
      );
      const historyKey =
        mode === "composite" ? "aiCompositeHistory" : "aiGenerationHistory";
      const savedHistory = await getItem(historyKey, mode, []);
      const parsedHistory = (savedHistory || []).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
      setGenerationHistory(parsedHistory);
      const savedModel = await getItem(
        `${savedProvider || "openai"}_selectedModel`,
        mode,
        (savedProvider || "openai") === "openai" ? "dall-e-2" : ""
      );
      const savedLora = await getItem(
        `${savedProvider || "openai"}_selectedLora`,
        mode,
        ""
      );
      setSelectedModel(
        savedModel ||
          ((savedProvider || "openai") === "openai" ? "dall-e-2" : "")
      );
      setSelectedLora(savedLora || "");
      const savedOpenAiSettings = await getItem("openai_settings", mode, {
        style: "vivid",
        quality: "standard",
        size: "1024x1024",
        background: "auto",
        inputFidelity: "low",
      });
      setOpenAiSettings(
        savedOpenAiSettings || {
          style: "vivid",
          quality: "standard",
          size: "1024x1024",
          background: "auto",
          inputFidelity: "low",
        }
      );
      const savedReplicateSettings = await getItem("replicate_settings", mode, {
        numInferenceSteps: 4,
        aspectRatio: "1:1",
      });
      setReplicateSettings(
        savedReplicateSettings || {
          numInferenceSteps: 4,
          aspectRatio: "1:1",
        }
      );
      const savedComfySettings = await getItem("comfyui-settings", mode, {
        url: "http://localhost:8188",
        workflowJson: null,
        workflowFileName: "",
        promptNodes: [],
        hasImageInput: false,
      });
      setComfySettings(
        savedComfySettings || {
          url: "http://localhost:8188",
          workflowJson: null,
          workflowFileName: "",
          promptNodes: [],
          hasImageInput: false,
        }
      );
      const promptKey =
        (savedProvider || "openai") === "comfy"
          ? "comfy_prompt"
          : `${mode}_prompt`;
      const savedPrompt = await getItem(promptKey, mode, "");
      setPrompt(savedPrompt || "");
    } catch (error) {
    }
  }, [mode, getItem]);
  const resetToDefaults = useCallback(() => {
    setAiProvider("openai");
    setSelectedModel("dall-e-2");
    setSelectedLora("");
    setPrompt("");
    setUseCanvasAsInput(true);
    setOverwriteCanvas(false);
    setApiKeys({
      openai: "",
      replicate: "",
      comfy: "",
    });
    setOpenAiSettings({
      style: "vivid",
      quality: "standard",
      size: "1024x1024",
      background: "auto",
      inputFidelity: "low",
    });
    setReplicateSettings({
      numInferenceSteps: 4,
      aspectRatio: "1:1",
    });
    setComfySettings({
      url: "http://localhost:8188",
      workflowJson: null,
      workflowFileName: "",
      promptNodes: [],
      hasImageInput: false,
    });
    setGenerationHistory([]);
  }, []);
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  useEffect(() => {
    const handleDesignChange = () => {
      loadSettings();
    };
    const handleNewDesign = () => {
      resetToDefaults();
    };
    window.addEventListener("designChanged", handleDesignChange);
    window.addEventListener("newDesignCreated", handleNewDesign);
    return () => {
      window.removeEventListener("designChanged", handleDesignChange);
      window.removeEventListener("newDesignCreated", handleNewDesign);
    };
  }, [loadSettings, resetToDefaults]);
  useEffect(() => {
    if (aiProvider) {
      const timeoutId = setTimeout(() => {
        setItem("aiProvider", aiProvider, mode).catch(() => {});
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [aiProvider, mode, setItem]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setItem("skyhunters-api-keys", apiKeys, mode).catch(() => {});
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [apiKeys, mode, setItem]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const promptKey =
        aiProvider === "comfy" ? "comfy_prompt" : `${mode}_prompt`;
      setItem(promptKey, prompt, mode).catch(() => {});
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [prompt, aiProvider, mode, setItem]);
  useEffect(() => {
    if (selectedModel) {
      const timeoutId = setTimeout(() => {
        setItem(`${aiProvider}_selectedModel`, selectedModel, mode).catch(
        );
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedModel, aiProvider, mode, setItem]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setItem(`${aiProvider}_selectedLora`, selectedLora, mode).catch(
      );
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedLora, aiProvider, mode, setItem]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setItem("openai_settings", openAiSettings, mode).catch(() => {});
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [openAiSettings, mode, setItem]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setItem("replicate_settings", replicateSettings, mode).catch(
      );
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [replicateSettings, mode, setItem]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setItem("comfyui-settings", comfySettings, mode).catch(() => {});
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [comfySettings, mode, setItem]);
  const providerOptions = [
    { value: "openai", label: "OPENAI API" },
    { value: "replicate", label: "REPLICATE API" },
    { value: "comfy", label: "LOCALHOST COMFY" },
  ];
  const getModelsForProvider = (provider: string) => {
    switch (provider) {
      case "openai":
        if (useCanvasAsInput) {
          return ["dall-e-2"];
        }
        return ["dall-e-3", "dall-e-2"];
      case "replicate":
        const allReplicateModels = [
          "flux-schnell",
          "ideogram-v3-turbo",
          "seedream-3",
          "flux-1.1-pro",
          "flux-dev",
          "flux-kontext-pro",
        ];
        if (useCanvasAsInput) {
          return ["flux-dev", "flux-kontext-pro"];
        }
        return allReplicateModels;
      case "comfy":
        return ["custom-workflow"];
      default:
        return [];
    }
  };
  const getLorasForProvider = (provider: string) => {
    switch (provider) {
      case "comfy":
        return ["none", "anime-style", "photorealistic", "artistic"];
      default:
        return [];
    }
  };
  const handleApiKeyChange = async (value: string) => {
    const newApiKeys = {
      ...apiKeys,
      [aiProvider]: value,
    };
    setApiKeys(newApiKeys);
    try {
      await setItem("skyhunters-api-keys", newApiKeys);
    } catch (error) {
    }
  };
  const handleComfyUrlChange = async (value: string) => {
    const newSettings = { ...comfySettings, url: value };
    setComfySettings(newSettings);
    try {
      await setItem("comfyui-settings", newSettings, mode);
    } catch (error) {
    }
  };
  const scanWorkflowForNodes = (workflowJson: any) => {
    const promptNodes: Array<{
      nodeId: string;
      inputKey: string;
      currentText: string;
    }> = [];
    let hasImageInput = false;
    if (workflowJson && typeof workflowJson === "object") {
      Object.keys(workflowJson).forEach((nodeId) => {
        const node = workflowJson[nodeId];
        if (node && node.class_type) {
          if (
            node.class_type === "LoadImage" ||
            node.class_type === "LoadImageMask" ||
            node.class_type.includes("LoadImage") ||
            node.class_type.includes("ImageLoader") ||
            node.class_type.includes("ImageInput")
          ) {
            hasImageInput = true;
          }
          if (
            node.class_type === "CLIPTextEncode" ||
            node.class_type === "CLIPTextEncodeSDXL" ||
            node.class_type.includes("TextEncode") ||
            node.class_type.includes("Prompt")
          ) {
            if (node.inputs) {
              Object.keys(node.inputs).forEach((inputKey) => {
                const inputValue = node.inputs[inputKey];
                if (typeof inputValue === "string" && inputValue.length > 0) {
                  promptNodes.push({
                    nodeId: nodeId,
                    inputKey: inputKey,
                    currentText: inputValue,
                  });
                }
              });
            }
          }
        }
      });
    }
    return { promptNodes, hasImageInput };
  };
  const handleWorkflowUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/json") {
      alert("Please upload a JSON file");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonContent = JSON.parse(e.target?.result as string);
        const { promptNodes, hasImageInput } =
          scanWorkflowForNodes(jsonContent);
        const newSettings = {
          ...comfySettings,
          workflowJson: jsonContent,
          workflowFileName: file.name,
          promptNodes: promptNodes,
          hasImageInput: hasImageInput,
        };
        setComfySettings(newSettings);
        await setItem("comfyui-settings", newSettings, mode);
        if (promptNodes.length > 0) {
          setPrompt(promptNodes[0].currentText);
        }
      } catch (error) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };
  useEffect(() => {
    loadApiKeys();
  }, []);
  useEffect(() => {
    if (useCanvasAsInput && aiProvider === "replicate") {
      const allowedModels = ["flux-dev", "flux-kontext-pro"];
      if (!allowedModels.includes(selectedModel)) {
        setSelectedModel("flux-dev");
      }
    }
  }, [useCanvasAsInput, mode, aiProvider, selectedModel]);
  const loadApiKeys = async () => {
    try {
      const savedKeys = await getItem("skyhunters-api-keys", mode, {
        openai: "",
        replicate: "",
        comfy: "",
      });
      setApiKeys(
        savedKeys || {
          openai: "",
          replicate: "",
          comfy: "",
        }
      );
    } catch (error) {
    }
  };
  const reloadSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);
  const handleProviderChange = async (provider: string) => {
    try {
      const savedModel = await getItem(
        `${provider}_selectedModel`,
        mode,
        provider === "openai" ? "dall-e-2" : ""
      );
      const savedLora = await getItem(`${provider}_selectedLora`, mode, "");
      setAiProvider(provider);
      setSelectedModel(savedModel || (provider === "openai" ? "dall-e-2" : ""));
      setSelectedLora(savedLora || "");
      setShowProviderDropdown(false);
      const promptKey =
        provider === "comfy" ? "comfy_prompt" : `${mode}_prompt`;
      const savedPrompt = await getItem(promptKey, mode, "");
      if (savedPrompt) {
        setPrompt(savedPrompt);
      }
      if (provider === "replicate") {
        setUseCanvasAsInput(false);
      }
    } catch (error) {
      setAiProvider(provider);
      setSelectedModel(provider === "openai" ? "dall-e-2" : "");
      setSelectedLora("");
      setShowProviderDropdown(false);
      if (provider === "replicate") {
        setUseCanvasAsInput(false);
      }
    }
  };
  const handleCanvasInputToggle = () => {
    setUseCanvasAsInput(!useCanvasAsInput);
    if (aiProvider === "openai") {
      if (!useCanvasAsInput && selectedModel === "dall-e-3") {
        setSelectedModel("dall-e-2");
      }
    }
  };
  const getApiEndpoint = () => {
    if (aiProvider === "openai") {
      return useCanvasAsInput ? "images/edits" : "images/generations";
    }
    return "generations";
  };
  const getCanvasDataURL = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      return canvas.toDataURL("image/png");
    }
    return null;
  };
  const addImageToCanvas = (imageDataUrl: string, shouldOverwrite = false) => {
    const setElementsFn = (window as any).canvasSetElements;
    if (!setElementsFn) {
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        return;
      }
      const patternCenterX = canvas.width / 2;
      const patternCenterY = canvas.height / 2;
      const patternBaseSize = Math.min(canvas.width, canvas.height) / 6;
      const targetSizeInCanvas = patternBaseSize * 0.8;
      const imgAspect = img.width / img.height;
      let finalWidth, finalHeight;
      if (imgAspect > 1) {
        finalWidth = targetSizeInCanvas;
        finalHeight = targetSizeInCanvas / imgAspect;
      } else {
        finalHeight = targetSizeInCanvas;
        finalWidth = targetSizeInCanvas * imgAspect;
      }
      const centerX = patternCenterX - finalWidth / 2;
      const centerY = patternCenterY - finalHeight / 2;
      const imageElement = {
        id: Date.now(),
        type: "image",
        x1: shouldOverwrite ? centerX : centerX + (Math.random() * 100 - 50),
        y1: shouldOverwrite ? centerY : centerY + (Math.random() * 100 - 50),
        width: finalWidth,
        height: finalHeight,
        rotation: 0,
        image: img,
      };
      try {
        if (shouldOverwrite) {
          setElementsFn([imageElement]);
        } else {
          setElementsFn((prev: any[]) => {
            return [...(prev || []), imageElement];
          });
        }
      } catch (error) {
      }
    };
    img.onerror = () => {
    };
    img.src = imageDataUrl;
  };
  const cancelGeneration = () => {
    if (generationController) {
      generationController.abort();
      setGenerationController(null);
      setIsGenerating(false);
    }
  };
  const generateImage = async () => {
    if (
      aiProvider !== "comfy" &&
      !apiKeys?.[aiProvider as keyof typeof apiKeys]
    ) {
      alert(`Please enter your ${aiProvider.toUpperCase()} API key first`);
      return;
    }
    if (aiProvider !== "comfy" && !selectedModel) {
      alert("Please select a model first");
      return;
    }
    if (aiProvider !== "comfy" && !prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }
    if (aiProvider === "comfy") {
      if (!comfySettings.url) {
        alert("Please enter ComfyUI URL");
        return;
      }
      if (!comfySettings.workflowJson) {
        alert("Please upload a workflow JSON file");
        return;
      }
      if (comfySettings.promptNodes.length > 0 && !prompt.trim()) {
        alert("Please enter a prompt for the workflow");
        return;
      }
      if (
        useCanvasAsInput &&
        comfySettings.hasImageInput &&
        !getCanvasDataURL()
      ) {
        alert(
          "Canvas is empty. Please draw something on the canvas or disable canvas input."
        );
        return;
      }
    }
    const controller = new AbortController();
    setGenerationController(controller);
    setIsGenerating(true);
    try {
      if (aiProvider === "openai") {
        const isEditMode = useCanvasAsInput;
        const endpoint = `https://api.openai.com/v1/${getApiEndpoint()}`;
        const basePayload: any = {
          model: selectedModel,
          prompt: prompt.trim(),
          n: 1,
          size: openAiSettings.size,
        };
        if (selectedModel === "dall-e-2" || selectedModel === "dall-e-3") {
          basePayload.response_format = "b64_json";
        }
        if (selectedModel === "dall-e-3" && !isEditMode) {
          basePayload.style = openAiSettings.style;
          basePayload.quality = openAiSettings.quality;
        }
        if (selectedModel === "gpt-image-1") {
          basePayload.background = openAiSettings.background;
          basePayload.quality = openAiSettings.quality;
          if (isEditMode) {
            basePayload.input_fidelity = openAiSettings.inputFidelity;
          }
        }
        let formData;
        let headers: any = {
          Authorization: `Bearer ${apiKeys?.openai || ""}`,
        };
        if (isEditMode) {
          let canvasDataURL;
          if (mode === "composite" && getCanvasImage) {
            canvasDataURL = getCanvasImage();
          } else {
            canvasDataURL = getCanvasDataURL();
          }
          if (!canvasDataURL) {
            throw new Error(
              mode === "composite"
                ? "Could not capture composite canvas. Make sure canvas has content."
                : "Could not get canvas data. Make sure canvas has content."
            );
          }
          formData = new FormData();
          const blob = await fetch(canvasDataURL).then((r) => r.blob());
          formData.append("image", blob, "canvas.png");
          formData.append("prompt", basePayload.prompt);
          formData.append("model", basePayload.model);
          formData.append("n", basePayload.n.toString());
          formData.append("size", basePayload.size);
          if (basePayload.response_format) {
            formData.append("response_format", basePayload.response_format);
          }
          if (basePayload.background) {
            formData.append("background", basePayload.background);
          }
          if (basePayload.quality) {
            formData.append("quality", basePayload.quality);
          }
          if (basePayload.input_fidelity) {
            formData.append("input_fidelity", basePayload.input_fidelity);
          }
        } else {
          headers["Content-Type"] = "application/json";
        }
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: isEditMode ? formData : JSON.stringify(basePayload),
          signal: controller.signal,
        });
        if (!response.ok) {
          let errorMessage = "Generation failed";
          try {
            const error = await response.json();
            errorMessage =
              error.error?.message ||
              error.message ||
              `HTTP ${response.status}: ${response.statusText}`;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        const result = await response.json();
        let imageDataUrl;
        if (result.data[0].b64_json) {
          imageDataUrl = `data:image/png;base64,${result.data[0].b64_json}`;
        } else if (result.data[0].url) {
          const imageResponse = await fetch(result.data[0].url);
          const blob = await imageResponse.blob();
          imageDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } else {
          throw new Error("Unexpected response format from OpenAI");
        }
        const historyItem = {
          id: `gen-${Date.now()}`,
          imageData: imageDataUrl,
          prompt: prompt.trim(),
          model: selectedModel,
          provider: aiProvider,
          timestamp: new Date(),
          settings: { ...openAiSettings, useCanvasAsInput, overwriteCanvas },
        };
        const newHistory = [historyItem, ...generationHistory].slice(0, 50);
        setGenerationHistory(newHistory);
        const storageKey =
          mode === "composite" ? "aiCompositeHistory" : "aiGenerationHistory";
        await setItem(storageKey, newHistory);
        if (currentDesign) {
          await refreshDesigns();
        }
        if (mode === "composite") {
          window.dispatchEvent(new Event("compositeImageGenerated"));
          if (onImageGenerated) {
            onImageGenerated(imageDataUrl);
          }
        } else {
          addImageToCanvas(imageDataUrl, overwriteCanvas);
        }
      } else if (aiProvider === "replicate") {
        const modelMappings: { [key: string]: string } = {
          "flux-schnell": "black-forest-labs/flux-schnell",
          "ideogram-v3-turbo": "ideogram-ai/ideogram-v2-turbo",
          "seedream-3": "bytedance/seedream-3",
          "flux-1.1-pro": "black-forest-labs/flux-1.1-pro",
          "flux-dev": "black-forest-labs/flux-dev",
          "flux-kontext-pro": "kontext/kontext-flux-pro",
        };
        const replicateModel = modelMappings[selectedModel];
        const input: any = {
          prompt: prompt.trim(),
          num_inference_steps: replicateSettings.numInferenceSteps,
          aspect_ratio: replicateSettings.aspectRatio,
        };
        if (selectedLora) {
          input.lora_scale = 0.6;
        }
        if (useCanvasAsInput) {
          let canvasDataURL;
          if (mode === "composite" && getCanvasImage) {
            canvasDataURL = getCanvasImage();
          } else {
            canvasDataURL = getCanvasDataURL();
          }
          if (canvasDataURL) {
            input.image = canvasDataURL;
          }
        }
        const createPredictionResponse = await invoke(
          "replicate_create_prediction",
          {
            modelName: replicateModel,
            apiKey: apiKeys?.replicate || "",
            input,
          }
        );
        const predictionId = (createPredictionResponse as any).id;
        let prediction: any;
        let attempts = 0;
        const maxAttempts = 60;
        while (attempts < maxAttempts) {
          if (controller.signal.aborted) {
            throw new Error("Generation cancelled");
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
          prediction = await invoke("replicate_get_prediction", {
            predictionId,
            apiKey: apiKeys?.replicate || "",
          });
          if ((prediction as any).status === "succeeded") {
            break;
          } else if ((prediction as any).status === "failed") {
            throw new Error(
              (prediction as any).error || "Replicate generation failed"
            );
          }
          attempts++;
        }
        if (attempts >= maxAttempts) {
          throw new Error("Generation timed out");
        }
        const imageUrl =
          (prediction as any).output?.[0] || (prediction as any).output;
        if (!imageUrl) {
          throw new Error("No output image from Replicate");
        }
        const imageDataUrl = await invoke("download_image_as_base64", {
          imageUrl,
        });
        const historyItem = {
          id: `gen-${Date.now()}`,
          imageData: imageDataUrl as string,
          prompt: prompt.trim(),
          model: selectedModel,
          provider: aiProvider,
          timestamp: new Date(),
          settings: { ...replicateSettings, useCanvasAsInput, overwriteCanvas },
        };
        const newHistory = [historyItem, ...generationHistory].slice(0, 50);
        setGenerationHistory(newHistory);
        const storageKey =
          mode === "composite" ? "aiCompositeHistory" : "aiGenerationHistory";
        await setItem(storageKey, newHistory);
        if (currentDesign) {
          await refreshDesigns();
        }
        if (mode === "composite") {
          window.dispatchEvent(new Event("compositeImageGenerated"));
          if (onImageGenerated) {
            onImageGenerated(imageDataUrl as string);
          }
        } else {
          addImageToCanvas(imageDataUrl as string, overwriteCanvas);
        }
      } else if (aiProvider === "comfy") {
        alert(
          "ComfyUI is not yet supported for composite generation. Please use OpenAI or Replicate."
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }
      let userMessage = "Image generation failed. Please try again.";
      const errorMessage =
        error?.message || error?.toString() || "Unknown error";
      if (errorMessage.includes("Unknown parameter")) {
        userMessage = `API Error: ${errorMessage}\n\nThis might be due to model-specific parameter restrictions.`;
      } else if (errorMessage.includes("rate limit")) {
        userMessage =
          "Rate limit exceeded. Please wait a moment and try again.";
      } else if (errorMessage.includes("quota")) {
        userMessage = "API quota exceeded. Please check your API account.";
      } else if (
        errorMessage.includes("authentication") ||
        errorMessage.includes("unauthorized")
      ) {
        userMessage = "Invalid API key. Please check your API key.";
      } else if (errorMessage.includes("content_policy")) {
        userMessage = "Content policy violation. Please modify your prompt.";
      } else if (errorMessage.includes("canvas")) {
        userMessage =
          "Could not access canvas data. Make sure you have content on the canvas.";
      } else if (errorMessage.includes("url not allowed")) {
        userMessage =
          "Network request blocked. Please check Tauri configuration.";
      } else if (errorMessage) {
        userMessage = `Error: ${errorMessage}`;
      }
      alert(userMessage);
    } finally {
      setIsGenerating(false);
      setGenerationController(null);
    }
  };
  const getOpenAiStyleOptions = () => {
    if (selectedModel === "dall-e-3") {
      return ["vivid", "natural"];
    }
    return [];
  };
  const getOpenAiQualityOptions = () => {
    switch (selectedModel) {
      case "dall-e-3":
        return ["hd", "standard"];
      case "dall-e-2":
        return ["standard"];
      default:
        return [];
    }
  };
  const getOpenAiSizeOptions = () => {
    switch (selectedModel) {
      case "dall-e-2":
        return ["256x256", "512x512", "1024x1024"];
      case "dall-e-3":
        return ["1024x1024", "1792x1024", "1024x1792"];
      default:
        return [];
    }
  };
  const getOpenAiBackgroundOptions = (): string[] => {
    return [];
  };
  const getOpenAiInputFidelityOptions = (): string[] => {
    return [];
  };
  const getPromptMaxLength = () => {
    switch (selectedModel) {
      case "dall-e-2":
        return 1000;
      case "dall-e-3":
        return 4000;
      default:
        return 1000;
    }
  };
  return {
    aiProvider,
    comfySettings,
    prompt,
    setPrompt,
    getPromptMaxLength,
    setShowProviderDropdown,
    showProviderDropdown,
    providerOptions,
    handleProviderChange,
    showApiKey,
    apiKeys,
    handleApiKeyChange,
    setShowApiKey,
    handleComfyUrlChange,
    handleWorkflowUpload,
    setShowModelDropdown,
    showModelDropdown,
    selectedModel,
    getModelsForProvider,
    setSelectedModel,
    getLorasForProvider,
    setShowLoraDropdown,
    showLoraDropdown,
    selectedLora,
    setSelectedLora,
    handleCanvasInputToggle,
    useCanvasAsInput,
    setOverwriteCanvas,
    overwriteCanvas,
    isGenerating,
    generateImage,
    cancelGeneration,
    showSizeDropdown,
    getOpenAiSizeOptions,
    setOpenAiSettings,
    setShowSizeDropdown,
    setShowStyleDropdown,
    showStyleDropdown,
    showBackgroundDropdown,
    getOpenAiBackgroundOptions,
    setShowBackgroundDropdown,
    getOpenAiInputFidelityOptions,
    setShowInputFidelityDropdown,
    openAiSettings,
    showInferenceStepsDropdown,
    setShowInferenceStepsDropdown,
    setReplicateSettings,
    setShowAspectRatioDropdown,
    setShowQualityDropdown,
    showQualityDropdown,
    getOpenAiQualityOptions,
    getOpenAiStyleOptions,
    showInputFidelityDropdown,
    replicateSettings,
    showAspectRatioDropdown,
    showNodeEditor,
    setShowNodeEditor,
    toggleNodeEditor: () => setShowNodeEditor(!showNodeEditor),
    setComfySettings,
    reloadSettings,
  };
};
export default useGenerator;
