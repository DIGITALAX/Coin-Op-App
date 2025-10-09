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
      <div className="bg-black border-2 border-crema p-6 max-w-md mx-4">
        <h3 className="font-ark text-white text-xl mb-4">{t("delete_design")}</h3>
        <p className="font-agency text-crema text-sm mb-6">
          {t("delete_design_confirmation", { designName })}.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="lowercase px-3 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80"
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {t("cancel")}
            </span>
          </button>
          <button
            onClick={onConfirm}
            className="lowercase px-3 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-rosa text-white hover:opacity-80"
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {t("delete")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}