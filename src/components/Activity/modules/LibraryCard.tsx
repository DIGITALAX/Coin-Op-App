import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SynthPrompt, CompositePrompt, LibraryCardProps } from "../types/activity.types";

export default function LibraryCard({ item, type, onLoad, onDelete, isDeleting }: LibraryCardProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'workflow':
        return t('comfyui_workflow');
      case 'synthPrompt':
        return t('synth_prompt');
      case 'compositePrompt':
        return t('composite_prompt');
      default:
        return t('library_item');
    }
  };

  const getPreviewContent = () => {
    if (type === 'workflow') {
      return t('comfyui_json_workflow');
    }
    const prompt = item as SynthPrompt | CompositePrompt;
    return prompt.prompt?.substring(0, 100) + (prompt.prompt?.length > 100 ? '...' : '');
  };
  return (
    <div className={`group text-ligero font-dos bg-turq1 border border-aqua rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
      isDeleting
        ? "opacity-50 cursor-not-allowed"
        : "hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20"
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm truncate mb-1">
              {item.name}
            </h3>
            <p className={`text-xs`}>
              {getTypeLabel()}
              {item.isDefault && ` (${t('default')})`}
            </p>
          </div>
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="w-6 h-6 bg-rosa hover:opacity-80 disabled:bg-crema font-sat text-white rounded-sm text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title={t('delete_item')}
          >
            ×
          </button>
        </div>
        {item.description && (
          <p className="text-xs mb-3 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="text-xs mb-3 p-2 bg-black/30 rounded">
          <p className="line-clamp-2">{getPreviewContent()}</p>
        </div>
        <div className="text-xs space-y-1 mb-3">
          <div className="flex justify-between">
            <span>{t('created')}:</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onLoad(item.id, type); }}
            className="flex-1 px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80"
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {t('load')}
            </span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
            className="px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-viol text-white hover:opacity-80"
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {showDetails ? t('hide_uppercase') : t('details')}
            </span>
          </button>
        </div>
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-aqua">
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-white">{t('id')}:</span> {item.id}
              </div>
              {type !== 'workflow' && (
                <>
                  <div className="text-crema font-mana">
                    <span className="text-white">Prompt:</span>
                  </div>
                  <div className="bg-black/30 rounded p-2 max-h-20 overflow-y-auto">
                    <p className="font-mono text-xxxs text-crema">
                      {(item as SynthPrompt | CompositePrompt).prompt}
                    </p>
                  </div>
                  {(item as SynthPrompt | CompositePrompt).negativePrompt && (
                    <>
                      <div className="text-crema font-mana">
                        <span className="text-white">Negative Prompt:</span>
                      </div>
                      <div className="bg-black/30 rounded p-2 max-h-20 overflow-y-auto">
                        <p className="font-mono text-xxxs text-crema">
                          {(item as SynthPrompt | CompositePrompt).negativePrompt}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}