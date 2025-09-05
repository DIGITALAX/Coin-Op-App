import { useState, useEffect, FunctionComponent } from "react";
import {
  NestingSettings,
  ROTATION_PRESETS,
  DEFAULT_NESTING_SETTINGS,
  NestingSettingsProps,
} from "../types/pattern.types";

export const NestingSettingsPanel: FunctionComponent<NestingSettingsProps> = ({
  settings,
  onSettingsChange,
  disabled,
}) => {
  const [localSettings, setLocalSettings] = useState<NestingSettings>(settings);
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  const handleSeparationChange = (value: number) => {
    const newSettings = { ...localSettings, minItemSeparation: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  const handleRotationPresetChange = (angles: number[]) => {
    const newSettings = { ...localSettings, allowedRotations: angles };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  const handleStripWidthChange = (value: number) => {
    const newSettings = { ...localSettings, stripWidthMultiplier: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  const resetToDefaults = () => {
    setLocalSettings(DEFAULT_NESTING_SETTINGS);
    onSettingsChange(DEFAULT_NESTING_SETTINGS);
  };
  const currentRotationPreset = ROTATION_PRESETS.find(
    (preset) =>
      preset.angles.length === localSettings.allowedRotations.length &&
      preset.angles.every((angle) =>
        localSettings.allowedRotations.includes(angle)
      )
  );
  return (
    <div className="w-80 bg-oscuro/50 border border-white/10 rounded p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-mana text-sm">NESTING SETTINGS</h3>
        <button
          onClick={resetToDefaults}
          disabled={disabled}
          className={`px-2 py-1 rounded text-xxxs font-mana ${
            disabled
              ? "bg-gris/40 text-white/50 cursor-not-allowed"
              : "bg-gris hover:opacity-70 text-white cursor-pointer"
          }`}
        >
          RESET
        </button>
      </div>
      {disabled && (
        <div className="bg-ama/20 border border-ama/30 rounded p-2">
          <div className="text-ama text-xxxs font-mana">
            Settings locked during optimization
          </div>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-white/70 text-xxxs font-mana mb-2">
            MINIMUM SPACING (mm)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.0"
              max="10.0"
              step="0.1"
              value={localSettings.minItemSeparation}
              onChange={(e) =>
                handleSeparationChange(parseFloat(e.target.value))
              }
              disabled={disabled}
              className={`flex-1 ${disabled ? "opacity-50" : ""}`}
            />
            <span className="text-ama text-xxxs font-mana w-12">
              {localSettings.minItemSeparation.toFixed(1)}
            </span>
          </div>
          <div className="text-white/40 text-xxxs mt-1">
            Space between pattern pieces (0.0 = touching edges)
          </div>
        </div>
        <div>
          <label className="block text-white/70 text-xxxs font-mana mb-2">
            ROTATION ANGLES
          </label>
          <select
            value={currentRotationPreset?.name || "Custom"}
            onChange={(e) => {
              const preset = ROTATION_PRESETS.find(
                (p) => p.name === e.target.value
              );
              if (preset) {
                handleRotationPresetChange(preset.angles);
              }
            }}
            disabled={disabled}
            className={`w-full bg-negro border border-white/20 rounded px-2 py-1 text-white text-xxxs ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {ROTATION_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
            {!currentRotationPreset && <option value="Custom">Custom</option>}
          </select>
          <div className="text-white/40 text-xxxs mt-1">
            {currentRotationPreset
              ? `${
                  currentRotationPreset.angles.length
                } angles: ${currentRotationPreset.angles
                  .slice(0, 4)
                  .join(", ")}${
                  currentRotationPreset.angles.length > 4 ? "..." : ""
                }`
              : `${localSettings.allowedRotations.length} custom angles`}
          </div>
        </div>
        <div>
          <label className="block text-white/70 text-xxxs font-mana mb-2">
            LAYOUT WIDTH FACTOR
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={localSettings.stripWidthMultiplier}
              onChange={(e) =>
                handleStripWidthChange(parseFloat(e.target.value))
              }
              disabled={disabled}
              className={`flex-1 ${disabled ? "opacity-50" : ""}`}
            />
            <span className="text-ama text-xxxs font-mana w-12">
              {localSettings.stripWidthMultiplier.toFixed(1)}x
            </span>
          </div>
          <div className="text-white/40 text-xxxs mt-1">
            Higher values = wider layouts (less vertical stacking)
          </div>
        </div>
        <div className="pt-2 border-t border-white/10">
          <div className="text-white/50 text-xxxs space-y-1">
            <div>• 0.0mm spacing = touching edges (max efficiency)</div>
            <div>• More rotations = better optimization</div>
            <div>• Higher layout width = wider, less tall results</div>
          </div>
        </div>
      </div>
    </div>
  );
};
