import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DesignCreationModalProps } from "../types/design.types";
export default function DesignCreationModal({
  isOpen,
  onClose,
  templateId,
  frontLayerTemplateId,
  backLayerTemplateId,
  childUri,
  onDesignCreated,
}: DesignCreationModalProps) {
  const { t } = useTranslation();
  const [designName, setDesignName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const handleCreate = async () => {
    if (!designName.trim()) {
      setError(t("design_name_required"));
      return;
    }
    setIsCreating(true);
    setError("");
    try {
      await onDesignCreated({
        name: designName.trim(),
        templateId,
        frontLayerTemplateId,
        backLayerTemplateId,
        childUri,
        description: description.trim() || undefined,
      });
      setDesignName("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed_to_create_design"));
    } finally {
      setIsCreating(false);
    }
  };
  const handleClose = () => {
    if (!isCreating) {
      setDesignName("");
      setDescription("");
      setError("");
      onClose();
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-satB text-white mb-4">{t("create_new_design")}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-sat text-gray-300 mb-2">
              {t("design_name")} *
            </label>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder={t("enter_design_name")}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded font-sat text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              disabled={isCreating}
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-sat text-gray-300 mb-2">
              {t("description_optional")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("describe_design_concept")}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded font-sat text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              disabled={isCreating}
              maxLength={200}
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm font-sat">{error}</div>
          )}
          <div className="text-xs text-gray-500 space-y-1">
            <p>{t("template_type")}: {templateId}</p>
            <p>{t("front_layer_tid")}: {frontLayerTemplateId}</p>
            {backLayerTemplateId && <p>{t("back_layer_tid")}: {backLayerTemplateId}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded font-sat text-sm transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !designName.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-sat text-sm transition-colors"
          >
            {isCreating ? t("creating") : t("create_design")}
          </button>
        </div>
      </div>
    </div>
  );
}
