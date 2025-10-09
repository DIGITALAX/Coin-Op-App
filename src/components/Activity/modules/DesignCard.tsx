import { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { DesignCardExtendedProps } from "../types/activity.types";

export default function DesignCard({
  designMetadata,
  onLoad,
  onDelete,
  isDeleting = false,
}: DesignCardExtendedProps) {
  const { t } = useTranslation();
  const { design, stats } = designMetadata;
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const handleLoad = () => {
    if (!isDeleting) {
      onLoad(design.id);
    }
  };
  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    if (!isDeleting) {
      onDelete(design.id);
    }
  };
  return (
    <div
      onClick={handleLoad}
      className={`group text-ligero font-dos bg-turq1 border border-aqua rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
        isDeleting
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20"
      }`}
    >
      <div className="aspect-video bg-turq relative overflow-hidden">
        {design.thumbnail ? (
          <img
            src={design.thumbnail}
            alt={design.name}
            draggable={false}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex-col gap-2 flex items-center justify-center">
            <div className="w-fit h-fit flex relative">
              <img
                draggable={false}
                src="/images/preview.png"
                className="flex w-20 h-20 object-contain relative"
              />
            </div>
            <div className="text-xs">{t("no_preview")}</div>
          </div>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 w-6 h-6 bg-rosa hover:opacity-80 disabled:bg-crema font-sat text-white rounded-sm text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title={t("delete_design")}
        >
          ×
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm truncate flex-1 text-white mr-2">{design.name}</h3>
          <div className="text-xs whitespace-nowrap">
            {formatTime(design.lastModified)}
          </div>
        </div>
        {design.description && (
          <p className="text-xs mb-3 line-clamp-2">{design.description}</p>
        )}
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div className="text-center">
            <div className="text-white">{stats.canvasHistoryCount}</div>
            <div>{t("canvas")}</div>
          </div>
          <div className="text-center">
            <div className="text-white">{stats.aiGenerationCount}</div>
            <div>{t("ai_gen")}</div>
          </div>
          <div className="text-center">
            <div className="text-white">{stats.compositeCount}</div>
            <div>{t("composite")}</div>
          </div>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>{t("layer")}:</span>
            <span className="text-white">{design.frontLayerTemplateId}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("created")}:</span>
            <span>{formatDate(design.createdAt)}</span>
          </div>
        </div>
      </div>
      {isDeleting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-sm">{t("deleting")}</div>
        </div>
      )}
    </div>
  );
}
