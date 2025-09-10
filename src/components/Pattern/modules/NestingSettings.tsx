import { useState, useEffect, FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    <div className="w-80 bg-oscuro/50 rounded p-2 space-y-6">
      <div className="flex justify-between items-center">
<h3 className="text-white font-mana text-sm">{t("nesting_settings")}</h3>
        <button
          onClick={resetToDefaults}
          disabled={disabled}
          className={`px-2 py-1 rounded text-xxxs font-mana ${
            disabled
              ? "bg-gris/40 text-white/50 cursor-not-allowed"
              : "bg-gris hover:opacity-70 text-white cursor-pointer"
          }`}
        >
{t("reset")}
        </button>
      </div>
      {disabled && (
        <div className="bg-ama/20 border border-ama/30 rounded p-2">
          <div className="text-ama text-xxxs font-mana">
{t("settings_locked_optimization")}
          </div>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-white/70 text-xxxs font-mana mb-2">
{t("minimum_spacing_mm")}
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
{t("space_between_pattern_pieces")}
          </div>
        </div>
        <div>
          <label className="block text-white/70 text-xxxs font-mana mb-2">
{t("rotation_angles")}
          </label>
          <select
value={currentRotationPreset?.name || "custom"}
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
                {t(preset.name)}
              </option>
            ))}
{!currentRotationPreset && <option value="custom">{t("custom")}</option>}
          </select>
          <div className="text-white/40 text-xxxs mt-1">
            {currentRotationPreset
              ? `${
                  currentRotationPreset.angles.length
} ${t("angles")}: ${currentRotationPreset.angles
                  .slice(0, 4)
                  .join(", ")}${
                  currentRotationPreset.angles.length > 4 ? "..." : ""
                }`
              : `${localSettings.allowedRotations.length} ${t("custom_angles")}`}
          </div>
        </div>
        <div>
          <label className="block text-white/70 text-xxxs font-mana mb-2">
{t("layout_width_factor")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1.0"
              max="5.0"
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
{t("higher_values_wider_layouts")}
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-xxxs font-mana mb-2">
{t("iteration_limit")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={localSettings.iterationLimit}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  iterationLimit: parseInt(e.target.value),
                })
              }
              disabled={disabled}
              className={`flex-1 ${disabled ? "opacity-50" : ""}`}
            />
            <span className="text-ama text-xxxs font-mana w-12">
              {localSettings.iterationLimit}
            </span>
          </div>
          <div className="text-white/40 text-xxxs mt-1">
            {t("iteration_limit_description")}
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-xxxs font-mana mb-2">
            {t("strike_limit")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={localSettings.strikeLimit}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  strikeLimit: parseInt(e.target.value),
                })
              }
              disabled={disabled}
              className={`flex-1 ${disabled ? "opacity-50" : ""}`}
            />
            <span className="text-ama text-xxxs font-mana w-12">
              {localSettings.strikeLimit}
            </span>
          </div>
          <div className="text-white/40 text-xxxs mt-1">
            {t("strike_limit_description")}
          </div>
        </div>

      </div>
    </div>
  );
};
