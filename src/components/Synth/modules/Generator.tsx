import { useEffect, useCallback, useRef } from "react";
import useGenerator from "../hooks/useGenerator";
import LibrarySelector from "./LibrarySelector";
import { useLibrary } from "../../../context/LibraryContext";
import { ComfyUIWorkflow } from "../../Activity/types/activity.types";
import { GeneratorProps } from "../types/synth.types";

export default function Generator({
  showNodeEditor: externalShowNodeEditor,
  setShowNodeEditor: externalSetShowNodeEditor,
  onStateChange,
  onComfySettingsUpdate,
  mode = "synth",
  onImageGenerated,
  getCanvasImage,
}: GeneratorProps = {}) {
  const {
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
    showNodeEditor: internalShowNodeEditor,
    toggleNodeEditor: internalToggleNodeEditor,
    setComfySettings,
  } = useGenerator({ mode, onImageGenerated, getCanvasImage: getCanvasImage as (() => string | null) | undefined });
  const { createWorkflow, createSynthPrompt, createCompositePrompt } =
    useLibrary();
  const showNodeEditor =
    externalShowNodeEditor !== undefined
      ? externalShowNodeEditor
      : internalShowNodeEditor;
  const toggleNodeEditor = externalSetShowNodeEditor
    ? () => externalSetShowNodeEditor(!showNodeEditor)
    : internalToggleNodeEditor;
  const aiProviderRef = useRef(aiProvider);
  const showNodeEditorRef = useRef(showNodeEditor);
  aiProviderRef.current = aiProvider;
  showNodeEditorRef.current = showNodeEditor;
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ aiProvider, comfySettings });
    }
  }, [aiProvider, comfySettings, onStateChange]);
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ aiProvider, comfySettings });
    }
  }, [onStateChange]);
  useEffect(() => {
    if (onComfySettingsUpdate) {
      onComfySettingsUpdate(setComfySettings);
    }
  }, [onComfySettingsUpdate, setComfySettings]);
  const handleLoadWorkflow = useCallback(
    async (workflow: ComfyUIWorkflow) => {
      setComfySettings((prev) => ({
        ...prev,
        workflowJson: workflow.workflowJson,
        workflowFileName: workflow.name,
      }));
      if (workflow.workflowJson && toggleNodeEditor) {
        setTimeout(() => {
          if (!showNodeEditor) {
            toggleNodeEditor();
          }
        }, 200);
      }
    },
    [setComfySettings, toggleNodeEditor, showNodeEditor]
  );
  const handleLoadPrompt = useCallback(
    (promptItem: any) => {
      if (promptItem && promptItem.prompt) {
        setPrompt(promptItem.prompt);
        setTimeout(() => {
          const textarea = document.querySelector(
            'textarea[placeholder*="Describe the image"]'
          ) as HTMLTextAreaElement;
          if (textarea && textarea.value !== promptItem.prompt) {
            textarea.value = promptItem.prompt;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, 100);
      } else {
      }
    },
    [setPrompt]
  );
  useEffect(() => {
    if (aiProvider === "comfy") {
      const pendingWorkflow = (window as any).pendingWorkflowLoad;
      if (pendingWorkflow) {
        handleLoadWorkflow(pendingWorkflow);
        (window as any).pendingWorkflowLoad = null;
      }
    }
  }, [aiProvider, handleLoadWorkflow]);
  useEffect(() => {
    const handleWorkflowLoad = async (event: any) => {
      const { workflow, shouldSwitchProvider } = event.detail;
      if (shouldSwitchProvider && aiProviderRef.current !== "comfy") {
        (window as any).pendingWorkflowLoad = workflow;
        handleProviderChange("comfy");
      } else {
        setComfySettings((prev) => ({
          ...prev,
          workflowJson: workflow.workflowJson,
          workflowFileName: workflow.name,
        }));
        if (workflow.workflowJson) {
          setTimeout(() => {
            if (!showNodeEditorRef.current && toggleNodeEditor) {
              toggleNodeEditor();
            }
          }, 200);
        }
      }
    };
    const handlePromptLoad = (event: any) => {
      const { prompt } = event.detail;
      if (prompt && prompt.prompt) {
        setPrompt(prompt.prompt);
        setTimeout(() => {
          const textarea = document.querySelector(
            'textarea[placeholder*="Describe the image"]'
          ) as HTMLTextAreaElement;
          if (textarea && textarea.value !== prompt.prompt) {
            textarea.value = prompt.prompt;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, 100);
      }
    };
    window.addEventListener("loadLibraryWorkflow", handleWorkflowLoad);
    window.addEventListener("loadLibraryPrompt", handlePromptLoad);
    return () => {
      window.removeEventListener("loadLibraryWorkflow", handleWorkflowLoad);
      window.removeEventListener("loadLibraryPrompt", handlePromptLoad);
    };
  }, []);
  const handleSaveWorkflow = async (name: string, description?: string) => {
    if (comfySettings.workflowJson) {
      try {
        await createWorkflow({
          name,
          description,
          data: comfySettings.workflowJson,
        });
        alert("Workflow saved to library successfully!");
      } catch (error) {
        alert("Failed to save workflow to library.");
      }
    }
  };
  const handleSavePrompt = async (name: string, description?: string) => {
    if (prompt.trim()) {
      try {
        const promptData = {
          id: "",
          name,
          prompt: prompt.trim(),
          description,
          createdAt: new Date(),
          lastModified: new Date(),
          isDefault: false,
        };
        if (mode === "composite") {
          await createCompositePrompt({
            name,
            description,
            data: promptData,
          });
          alert("Composite prompt saved to library successfully!");
        } else {
          await createSynthPrompt({
            name,
            description,
            data: promptData,
          });
          alert("Synth prompt saved to library successfully!");
        }
      } catch (error) {
        alert("Failed to save prompt to library.");
      }
    }
  };
  useEffect(() => {
    const checkLibraryWorkflow = () => {
      const libraryWorkflowData = (window as any).libraryWorkflowToLoad;
      if (libraryWorkflowData) {
        const { workflow, shouldSwitchProvider } = libraryWorkflowData;
        if (shouldSwitchProvider) {
          (window as any).pendingWorkflowAfterSwitch = workflow;
          handleProviderChange("comfy")
            .then(() => {
              setTimeout(() => {
                const stillPendingWorkflow = (window as any)
                  .pendingWorkflowAfterSwitch;
                if (stillPendingWorkflow) {
                  handleLoadWorkflow(stillPendingWorkflow);
                  (window as any).pendingWorkflowAfterSwitch = null;
                }
              }, 500);
            })
            .catch(() => {
            });
        } else if (aiProvider === "comfy") {
          handleLoadWorkflow(workflow);
        }
        (window as any).libraryWorkflowToLoad = null;
      }
      const pendingWorkflow = (window as any).pendingWorkflowAfterSwitch;
      if (pendingWorkflow && aiProvider === "comfy") {
        handleLoadWorkflow(pendingWorkflow);
        (window as any).pendingWorkflowAfterSwitch = null;
      }
      const libraryPromptData = (window as any).libraryPromptToLoad;
      if (libraryPromptData) {
        handleLoadPrompt(libraryPromptData);
        (window as any).libraryPromptToLoad = null;
      }
    };
    checkLibraryWorkflow();
    const timeoutId1 = setTimeout(checkLibraryWorkflow, 100);
    const timeoutId2 = setTimeout(checkLibraryWorkflow, 300);
    const timeoutId3 = setTimeout(checkLibraryWorkflow, 1000);
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [aiProvider, handleProviderChange, handleLoadWorkflow, handleLoadPrompt]);
  return (
    <div className="mb-6">
      <h2 className="text-lg font-sat text-white tracking-wider mb-4">
        AI IMAGE GENERATOR
      </h2>
      <div className="bg-oscuro border border-gray-600 rounded p-6">
        <div className="space-y-6">
          {aiProvider !== "comfy" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-sat text-gray-400">
                  PROMPT
                </label>
                <LibrarySelector
                  type="prompt"
                  mode={mode}
                  onSelect={handleLoadPrompt}
                  onSave={handleSavePrompt}
                />
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                maxLength={getPromptMaxLength()}
                rows={3}
                className="w-full px-3 py-2 border rounded font-sat text-sm resize-none bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs font-sat text-gray-500 mt-1">
                {prompt.length}/{getPromptMaxLength()} characters
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-sat text-gray-400 mb-2">
                API PROVIDER
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                >
                  <span>
                    {providerOptions.find((p) => p.value === aiProvider)?.label}
                  </span>
                  <svg
                    className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                      showProviderDropdown ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                  </svg>
                </div>
                {showProviderDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-10">
                    {providerOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => handleProviderChange(option.value)}
                        className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {aiProvider !== "comfy" && (
              <div>
                <label className="block text-sm font-sat text-gray-400 mb-2">
                  API KEY (auto-saved)
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKeys[aiProvider as keyof typeof apiKeys]}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={`Enter ${aiProvider.toUpperCase()} API key`}
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm"
                  />
                  <div
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    title={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.12 14.12L15.536 15.536M9.878 9.878L14.12 14.12M15.536 15.536a10.049 10.049 0 01-3.536 3.289"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            )}
            {aiProvider === "comfy" && (
              <>
                <div>
                  <label className="block text-sm font-sat text-gray-400 mb-2">
                    COMFYUI URL
                  </label>
                  <input
                    type="text"
                    value={comfySettings.url}
                    onChange={(e) => handleComfyUrlChange(e.target.value)}
                    placeholder="http://localhost:8188"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-sat text-gray-400">
                      WORKFLOW JSON
                    </label>
                    <LibrarySelector
                      type="workflow"
                      onSelect={handleLoadWorkflow}
                      onSave={handleSaveWorkflow}
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleWorkflowUpload}
                      id="workflow-upload"
                      className="hidden"
                    />
                    <label
                      htmlFor="workflow-upload"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-sat text-sm cursor-pointer"
                    >
                      Upload Workflow
                    </label>
                    {comfySettings.workflowFileName && (
                      <>
                        <span className="text-sm text-gray-400 font-sat">
                          {comfySettings.workflowFileName}
                        </span>
                        <div
                          onClick={toggleNodeEditor}
                          className="px-3 py-2 bg-ama text-black rounded font-mana text-xxxs hover:opacity-70"
                        >
                          {showNodeEditor ? "Hide" : "Edit"} Nodes
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
            {aiProvider !== "comfy" && (
              <div>
                <label className="block text-sm font-sat text-gray-400 mb-2">
                  MODEL
                </label>
                <div className="relative">
                  <div
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                  >
                    <span>{selectedModel || "SELECT MODEL"}</span>
                    <svg
                      className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                        showModelDropdown ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                    </svg>
                  </div>
                  {showModelDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-10">
                      {getModelsForProvider(aiProvider).map((model) => (
                        <div
                          key={model}
                          onClick={() => {
                            setSelectedModel(model);
                            setShowModelDropdown(false);
                          }}
                          className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                        >
                          {model.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {aiProvider !== "comfy" &&
              getLorasForProvider(aiProvider).length > 0 && (
                <div>
                  <label className="block text-sm font-sat text-gray-400 mb-2">
                    LORA
                  </label>
                  <div className="relative">
                    <div
                      onClick={() => setShowLoraDropdown(!showLoraDropdown)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                    >
                      <svg
                        className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                          showLoraDropdown ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                      </svg>
                    </div>
                    {showLoraDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-10">
                        {getLorasForProvider(aiProvider).map((lora) => (
                          <div
                            key={lora}
                            onClick={() => {
                              setSelectedLora(lora);
                              setShowLoraDropdown(false);
                            }}
                            className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                          >
                            {lora.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            {(aiProvider === "openai" ||
              (aiProvider === "comfy" && comfySettings.hasImageInput) ||
              aiProvider === "replicate") && (
              <div>
                <label className="block text-sm font-sat text-gray-400 mb-2">
                  CANVAS INPUT
                </label>
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={handleCanvasInputToggle}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-gray-700 border border-gray-600 rounded flex items-center justify-center">
                      <div
                        className={`w-2 h-2 bg-oscurazul rounded ${
                          useCanvasAsInput ? "" : "hidden"
                        }`}
                      ></div>
                    </div>
                  </div>
                  <span className="font-sat text-white">
                    USE CANVAS AS INPUT
                  </span>
                </div>
                <p className="text-xs font-sat text-gray-500 mt-2">
                  {useCanvasAsInput
                    ? aiProvider === "openai"
                      ? "Canvas → PNG for image editing (dall-e-3 unavailable)"
                      : aiProvider === "comfy"
                      ? "Canvas → PNG sent to LoadImage nodes in workflow"
                      : aiProvider === "replicate"
                      ? mode === "composite"
                        ? "Composite canvas → PNG for image-to-image (flux models only)"
                        : "Synth canvas → PNG for image-to-image (flux models only)"
                      : "Current canvas will be converted to DataPNG for input"
                    : "Generated image will be returned directly to canvas"}
                </p>
              </div>
            )}
            {mode !== "composite" && (
              <div>
                <label className="block text-sm font-sat text-gray-400 mb-2">
                  CANVAS OUTPUT
                </label>
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => setOverwriteCanvas(!overwriteCanvas)}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-gray-700 border border-gray-600 rounded flex items-center justify-center">
                      <div
                        className={`w-2 h-2 bg-oscurazul rounded ${
                          overwriteCanvas ? "" : "hidden"
                        }`}
                      ></div>
                    </div>
                  </div>
                  <span className="font-sat text-white">OVERWRITE CANVAS</span>
                </div>
                <p className="text-xs font-sat text-gray-500 mt-2">
                  {overwriteCanvas
                    ? "Replace all canvas content with generated image"
                    : "Add generated image to existing canvas content"}
                </p>
              </div>
            )}
            <div className="flex items-end gap-2">
              {!isGenerating ? (
                <button
                  onClick={generateImage}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded font-sat text-sm cursor-pointer transition-colors"
                  disabled={
                    aiProvider === "comfy"
                      ? !comfySettings.url || !comfySettings.workflowJson
                      : !apiKeys[aiProvider as keyof typeof apiKeys] ||
                        !selectedModel ||
                        !prompt.trim()
                  }
                >
                  GENERATE IMAGE
                </button>
              ) : (
                <>
                  <div className="flex-1 px-3 py-2 bg-gray-600 text-white rounded font-sat text-sm text-center">
                    GENERATING...
                  </div>
                  <div
                    onClick={cancelGeneration}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-sat text-sm cursor-pointer transition-colors"
                    title="Cancel generation"
                  >
                    CANCEL
                  </div>
                </>
              )}
            </div>
          </div>
          {aiProvider === "openai" && selectedModel && (
            <div className="border-t border-gray-600 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-sat text-white tracking-wider">
                  OPENAI SETTINGS
                </h3>
                <span className="text-xs font-sat px-2 py-1 rounded bg-blue-600/20 text-blue-400">
                  {useCanvasAsInput ? "IMAGE EDIT MODE" : "GENERATION MODE"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-sat text-gray-400 mb-2">
                    SIZE
                  </label>
                  <div className="relative">
                    <div
                      onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>{openAiSettings.size}</span>
                      <svg
                        className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                          showSizeDropdown ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                      </svg>
                    </div>
                    {showSizeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-20">
                        {getOpenAiSizeOptions().map((size) => (
                          <div
                            key={size}
                            onClick={() => {
                              setOpenAiSettings((prev) => ({
                                ...prev,
                                size,
                              }));
                              setShowSizeDropdown(false);
                            }}
                            className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                          >
                            {size}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-sat text-gray-400 mb-2">
                    QUALITY
                  </label>
                  <div className="relative">
                    <div
                      onClick={() =>
                        setShowQualityDropdown(!showQualityDropdown)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>{openAiSettings.quality.toUpperCase()}</span>
                      <svg
                        className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                          showQualityDropdown ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                      </svg>
                    </div>
                    {showQualityDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-20">
                        {getOpenAiQualityOptions().map((quality) => (
                          <div
                            key={quality}
                            onClick={() => {
                              setOpenAiSettings((prev) => ({
                                ...prev,
                                quality,
                              }));
                              setShowQualityDropdown(false);
                            }}
                            className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                          >
                            {quality.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {getOpenAiStyleOptions().length > 0 && (
                  <div>
                    <label className="block text-sm font-sat text-gray-400 mb-2">
                      STYLE
                    </label>
                    <div className="relative">
                      <div
                        onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                      >
                        <span>{openAiSettings.style.toUpperCase()}</span>
                        <svg
                          className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                            showStyleDropdown ? "rotate-180" : ""
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                        </svg>
                      </div>
                      {showStyleDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-20">
                          {getOpenAiStyleOptions().map((style) => (
                            <div
                              key={style}
                              onClick={() => {
                                setOpenAiSettings((prev) => ({
                                  ...prev,
                                  style,
                                }));
                                setShowStyleDropdown(false);
                              }}
                              className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                            >
                              {style.toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {getOpenAiBackgroundOptions().length > 0 && (
                  <div>
                    <label className="block text-sm font-sat text-gray-400 mb-2">
                      BACKGROUND
                    </label>
                    <div className="relative">
                      <div
                        onClick={() =>
                          setShowBackgroundDropdown(!showBackgroundDropdown)
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                      >
                        <span>{openAiSettings.background.toUpperCase()}</span>
                        <svg
                          className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                            showBackgroundDropdown ? "rotate-180" : ""
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                        </svg>
                      </div>
                      {showBackgroundDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-20">
                          {getOpenAiBackgroundOptions().map((bg) => (
                            <div
                              key={bg}
                              onClick={() => {
                                setOpenAiSettings((prev) => ({
                                  ...prev,
                                  background: bg,
                                }));
                                setShowBackgroundDropdown(false);
                              }}
                              className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                            >
                              {bg.toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {getOpenAiInputFidelityOptions().length > 0 && (
                  <div>
                    <label className="block text-sm font-sat text-gray-400 mb-2">
                      INPUT FIDELITY
                    </label>
                    <div className="relative">
                      <div
                        onClick={() =>
                          setShowInputFidelityDropdown(
                            !showInputFidelityDropdown
                          )
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                      >
                        <span>
                          {openAiSettings.inputFidelity.toUpperCase()}
                        </span>
                        <svg
                          className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                            showInputFidelityDropdown ? "rotate-180" : ""
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                        </svg>
                      </div>
                      {showInputFidelityDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-20">
                          {getOpenAiInputFidelityOptions().map((fidelity) => (
                            <div
                              key={fidelity}
                              onClick={() => {
                                setOpenAiSettings((prev) => ({
                                  ...prev,
                                  inputFidelity: fidelity,
                                }));
                                setShowInputFidelityDropdown(false);
                              }}
                              className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                            >
                              {fidelity.toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-sat text-gray-500 mt-1">
                      {openAiSettings.inputFidelity === "high"
                        ? "Match input style/features closely"
                        : "Allow more creative interpretation"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {aiProvider === "replicate" && selectedModel && (
            <div className="border-t border-gray-600 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-sat text-white tracking-wider">
                  REPLICATE SETTINGS
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-sat text-gray-400 mb-2">
                    INFERENCE STEPS
                  </label>
                  <div className="relative">
                    <div
                      onClick={() =>
                        setShowInferenceStepsDropdown(
                          !showInferenceStepsDropdown
                        )
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>{replicateSettings.numInferenceSteps}</span>
                      <svg
                        className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                          showInferenceStepsDropdown ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                      </svg>
                    </div>
                    {showInferenceStepsDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-20">
                        {[1, 2, 3, 4].map((steps) => (
                          <div
                            key={steps}
                            onClick={() => {
                              setReplicateSettings({
                                ...replicateSettings,
                                numInferenceSteps: steps,
                              });
                              setShowInferenceStepsDropdown(false);
                            }}
                            className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                          >
                            {steps}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-sat text-gray-500 mt-1">
                    Higher = better quality, slower
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-sat text-gray-400 mb-2">
                    ASPECT RATIO
                  </label>
                  <div className="relative">
                    <div
                      onClick={() =>
                        setShowAspectRatioDropdown(!showAspectRatioDropdown)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-sat text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>{replicateSettings.aspectRatio}</span>
                      <svg
                        className={`w-4 h-4 fill-current text-gray-400 transition-transform ${
                          showAspectRatioDropdown ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M5.516 7.548L10 12.032l4.484-4.484L16 9.064l-6 6-6-6z" />
                      </svg>
                    </div>
                    {showAspectRatioDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded font-sat text-sm z-20">
                        {["1:1", "16:9", "9:16", "4:3", "3:4"].map((ratio) => (
                          <div
                            key={ratio}
                            onClick={() => {
                              setReplicateSettings({
                                ...replicateSettings,
                                aspectRatio: ratio,
                              });
                              setShowAspectRatioDropdown(false);
                            }}
                            className="px-3 py-2 text-white hover:bg-gray-600 cursor-pointer"
                          >
                            {ratio}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-sat text-gray-500 mt-1">
                    Image dimensions ratio
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
