import { useNodeInput } from "../../hooks/useNodeInput";
import { NodeInputProps } from "../../types/comfyui.types";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { useComfyUIModels } from "../../hooks/useComfyUIModels";
import { useState, useMemo } from "react";
export default function NodeInput({
  name,
  type,
  value,
  connected,
  onChange,
  comfyUrl,
}: NodeInputProps) {
  const {
    localValue,
    handleChange,
    getBooleanValue,
    getSamplers,
    getSchedulers,
  } = useNodeInput(value, type, onChange);
  if (connected) {
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-white font-mana text-xxxs">{name}:</span>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>
    );
  }
  switch (type) {
    case "TEXT":
    case "STRING":
      if (name.toLowerCase().includes("prompt") || name === "text") {
        return (
          <div className="mb-2">
            <label className="block text-white font-mana text-xxxs mb-1">
              {name}:
            </label>
            <textarea
              value={localValue.toString()}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-sm text-white resize-none"
              rows={12}
              placeholder={`Enter ${name.toLowerCase()}...`}
            />
          </div>
        );
      } else {
        return (
          <div className="mb-2">
            <label className="block text-white font-mana text-xxxs mb-1">
              {name}:
            </label>
            <input
              type="text"
              value={localValue.toString()}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
              placeholder={`Enter ${name.toLowerCase()}...`}
            />
          </div>
        );
      }
    case "INT":
      return (
        <div className="mb-2">
          <label className="block text-white font-mana text-xxxs mb-1">
            {name}:
          </label>
          <input
            type="number"
            step="1"
            value={localValue.toString()}
            onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
          />
        </div>
      );
    case "FLOAT":
      return (
        <div className="mb-2">
          <label className="block text-white font-mana text-xxxs mb-1">
            {name}:
          </label>
          <input
            type="number"
            step="0.1"
            value={localValue.toString()}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
          />
        </div>
      );
    case "BOOLEAN":
      return (
        <div className="mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={getBooleanValue()}
              onChange={(e) => handleChange(e.target.checked)}
              className="w-3 h-3 rounded"
            />
            <span className="text-white font-mana text-xxxs">{name}</span>
          </label>
        </div>
      );
    case "IMAGE":
      return (
        <div className="mb-2">
          <label className="block text-white font-mana text-xxxs mb-1">
            {name}:
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    const selected = await open({
                      multiple: false,
                      filters: [{
                        name: 'Images',
                        extensions: ['png', 'webp', 'jpg', 'jpeg']
                      }]
                    });
                    if (selected && typeof selected === 'string') {
                      const fileName = selected.split('/').pop() || selected.split('\\').pop() || 'image';
                      const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase();
                      let mimeType = 'image/png';
                      if (fileExtension === '.webp') mimeType = 'image/webp';
                      else if (['.jpg', '.jpeg'].includes(fileExtension)) mimeType = 'image/jpeg';
                      try {
                        const fileBytes = await readFile(selected);
                        let binary = '';
                        for (let i = 0; i < fileBytes.length; i++) {
                          binary += String.fromCharCode(fileBytes[i]);
                        }
                        const base64String = btoa(binary);
                        const dataUrl = `data:${mimeType};base64,${base64String}`;
                        handleChange({ name: fileName, url: dataUrl, type: mimeType });
                      } catch (error) {
                      }
                    }
                  } catch (error) {
                  }
                }}
                className="px-2 py-1 bg-gris text-white rounded font-mana text-xxxs cursor-pointer hover:opacity-70"
              >
                Upload
              </button>
              {localValue && typeof localValue === 'object' && localValue.name && (
                <span className="text-crema font-mana text-xxxs truncate">
                  {localValue.name}
                </span>
              )}
              {localValue && typeof localValue === 'string' && (
                <span className="text-crema font-mana text-xxxs truncate">
                  {localValue}
                </span>
              )}
            </div>
            {localValue && typeof localValue === 'object' && localValue.url && (
              <div className="mt-2">
                {localValue.type?.startsWith('image/') ? (
                  <img 
                    src={localValue.url} 
                    alt="Preview" 
                    className="max-w-full max-h-32 object-contain rounded border border-ligero"
                    draggable={false}
                  />
                ) : localValue.type?.startsWith('video/') ? (
                  <video 
                    src={localValue.url} 
                    controls 
                    className="max-w-full max-h-32 rounded border border-ligero"
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <div className="px-2 py-1 bg-black border border-ligero rounded text-white font-mana text-xxxs">
                    {localValue.name} - {localValue.type}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    case "VAE_NAME": {
      const { models, loading } = useComfyUIModels(comfyUrl || "", "VAELoader");
      return (
        <div className="mb-2">
          <label className="block text-white font-mana text-xxxs mb-1">
            {name}:
          </label>
          <select
            value={localValue.toString()}
            onChange={(e) => handleChange(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
            disabled={loading}
          >
            {models.map((vae) => (
              <option key={vae} value={vae}>
                {vae}
              </option>
            ))}
          </select>
        </div>
      );
    }
    case "LORA_NAME": {
      const { models, loading } = useComfyUIModels(comfyUrl || "", "LoraLoader");
      const [searchTerm, setSearchTerm] = useState<string>("");
      const filteredModels = useMemo(() => {
        if (!searchTerm) return models;
        return models.filter(lora => 
          lora.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }, [models, searchTerm]);
      return (
        <div className="mb-2">
          <label className="block text-white font-mana text-xxxs mb-1">
            {name}:
          </label>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search LoRAs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
            />
            <select
              value={localValue.toString()}
              onChange={(e) => handleChange(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white max-h-32 overflow-y-auto"
              disabled={loading}
              size={Math.min(filteredModels.length + 1, 6)}
            >
              {filteredModels.map((lora) => (
                <option key={lora} value={lora}>
                  {lora}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }
    case "UNET_NAME": {
      const { models, loading } = useComfyUIModels(comfyUrl || "", "UnetLoaderGGUF");
      return (
        <div className="mb-2">
          <label className="block text-white font-mana text-xxxs mb-1">
            {name}:
          </label>
          <select
            value={localValue.toString()}
            onChange={(e) => handleChange(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
            disabled={loading}
          >
            {models.map((unet) => (
              <option key={unet} value={unet}>
                {unet}
              </option>
            ))}
          </select>
        </div>
      );
    }
    case "CLIP_NAME": {
      const { models, loading } = useComfyUIModels(comfyUrl || "", "CLIPLoaderGGUF");
      return (
        <div className="mb-2">
          <label className="block text-white font-mana text-xxxs mb-1">
            {name}:
          </label>
          <select
            value={localValue.toString()}
            onChange={(e) => handleChange(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
            disabled={loading}
          >
            {models.map((clip) => (
              <option key={clip} value={clip}>
                {clip}
              </option>
            ))}
          </select>
        </div>
      );
    }
    default:
      if (name === "sampler_name") {
        return (
          <div className="mb-2">
            <label className="block text-white font-mana text-xxxs mb-1">
              {name}:
            </label>
            <select
              value={localValue.toString()}
              onChange={(e) => handleChange(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
            >
              {getSamplers().map((sampler) => (
                <option key={sampler} value={sampler}>
                  {sampler}
                </option>
              ))}
            </select>
          </div>
        );
      } else if (name === "scheduler") {
        return (
          <div className="mb-2">
            <label className="block text-white font-mana text-xxxs mb-1">
              {name}:
            </label>
            <select
              value={localValue.toString()}
              onChange={(e) => handleChange(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
            >
              {getSchedulers().map((scheduler) => (
                <option key={scheduler} value={scheduler}>
                  {scheduler}
                </option>
              ))}
            </select>
          </div>
        );
      } else {
        return (
          <div className="mb-2">
            <label className="block text-white font-mana text-xxxs mb-1">
              {name}:
            </label>
            <input
              type="text"
              value={localValue.toString()}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-2 py-1 bg-black border border-ligero rounded font-mana text-xxxs text-white"
              placeholder={`Enter ${name.toLowerCase()}...`}
            />
          </div>
        );
      }
  }
}
