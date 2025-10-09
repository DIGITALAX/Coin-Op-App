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
    <div className="w-80 bg-white/5 rounded p-2 space-y-6">
      <div className="flex justify-between items-center">
<h3 className="text-white font-agency text-xs">{t("nesting_settings")}</h3>
        <button
          onClick={resetToDefaults}
          disabled={disabled}
          className={`px-2 py-1 rounded-sm text-xs font-agency ${
            disabled
              ? "bg-crema/40 text-black/50 cursor-not-allowed"
              : "bg-crema hover:opacity-70 text-black cursor-pointer"
          }`}
        >
{t("reset")}
        </button>
      </div>
      {disabled && (
        <div className="bg-white/20 border border-crema rounded p-2">
          <div className="text-white font-agency text-xs">
{t("settings_locked_optimization")}
          </div>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-crema text-xs font-agency mb-2">
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
            <span className="text-white text-xs font-agency w-12">
              {localSettings.minItemSeparation.toFixed(1)}
            </span>
          </div>
          <div className="text-crema text-xs mt-1 font-agency">
{t("space_between_pattern_pieces")}
          </div>
        </div>
        <div>
          <label className="block text-crema text-xs font-agency mb-2">
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
            className={`w-full appearance-none bg-black border border-crema rounded-sm px-3 py-2 text-white text-xs font-agency ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{ backgroundImage: 'none' }}
          >
            {ROTATION_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {t(preset.name)}
              </option>
            ))}
{!currentRotationPreset && <option value="custom">{t("custom")}</option>}
          </select>
          
          {!currentRotationPreset && (
            <div className="mt-2">
              <input
                type="text"
                placeholder={t("enter_angles_separated_by_commas")}
                value={localSettings.allowedRotations.join(", ")}
                onChange={(e) => {
                  const angleString = e.target.value;
                  const angles = angleString
                    .split(",")
                    .map(s => s.trim())
                    .filter(s => s !== "")
                    .map(s => parseFloat(s))
                    .filter(n => !isNaN(n) && n >= 0 && n < 360);

                  if (angles.length > 0) {
                    handleRotationPresetChange(angles);
                  }
                }}
                disabled={disabled}
                className={`w-full bg-black border border-crema rounded-sm px-3 py-2 text-white text-xs font-agency ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <div className="text-crema text-xs mt-1 font-agency">
                {t("example")}: 0, 45, 90, 180, 270
              </div>
            </div>
          )}

          <div className="text-crema text-xs mt-1 font-agency">
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
          <label className="block text-crema text-xs font-agency mb-2">
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
            <span className="text-white text-xs font-agency w-12">
              {localSettings.stripWidthMultiplier.toFixed(1)}x
            </span>
          </div>
          <div className="text-crema text-xs mt-1 font-agency">
{t("higher_values_wider_layouts")}
          </div>
        </div>

        <div>
          <label className="block text-crema text-xs font-agency mb-2">
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
            <span className="text-white text-xs font-agency w-12">
              {localSettings.iterationLimit}
            </span>
          </div>
          <div className="text-crema text-xs mt-1 font-agency">
            {t("iteration_limit_description")}
          </div>
        </div>

        <div>
          <label className="block text-crema text-xs font-agency mb-2">
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
            <span className="text-white text-xs font-agency w-12">
              {localSettings.strikeLimit}
            </span>
          </div>
          <div className="text-crema text-xs mt-1 font-agency">
            {t("strike_limit_description")}
          </div>
        </div>

      </div>
    </div>
  );
};
