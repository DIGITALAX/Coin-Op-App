import { useTranslation } from "react-i18next";
import { DeleteConfirmationModalProps } from "../types/activity.types";

export default function DeleteConfirmationModal({
  isOpen,
  designName,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-white font-satB text-lg mb-4">{t("delete_design")}</h3>
        <p className="text-gray-300 font-sat text-sm mb-6">
          {t("delete_design_confirmation", { designName })}.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-sat text-sm rounded transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-sat text-sm rounded transition-colors"
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}