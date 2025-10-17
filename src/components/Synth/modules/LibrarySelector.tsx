import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLibrary } from "../../../context/LibraryContext";
import { SynthPrompt } from "../../Activity/types/activity.types";
import { LibrarySelectorProps } from "../types/synth.types";

export default function LibrarySelector({ type, mode = 'synth', onSelect, onSave, className = "" }: LibrarySelectorProps) {
  const { t } = useTranslation();
  const { workflows, synthPrompts, compositePrompts } = useLibrary();
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const items = type === 'workflow' ? workflows : (mode === 'composite' ? compositePrompts : synthPrompts);
  const typeLabel = type === 'workflow' ? t('workflows') : (mode === 'composite' ? t('composite_prompts') : t('synth_prompts'));
  const handleSave = () => {
    if (saveName.trim()) {
      onSave(saveName.trim(), saveDescription.trim() || undefined);
      setSaveName("");
      setSaveDescription("");
      setShowSaveModal(false);
    }
  };
  const handleSelect = (item: any) => {
    onSelect(item);
    setIsOpen(false);
  };
  if (!isOpen && !showSaveModal) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-viol text-white hover:opacity-80"
          style={{ transform: "skewX(-15deg)" }}
          title={`${t('load_from_library')} ${typeLabel}`}
        >
          <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
            {type === 'workflow' ? t('load_workflows') : (mode === 'composite' ? t('load_composite_prompts') : t('load_synth_prompts'))}
          </span>
        </button>
        <button
          onClick={() => setShowSaveModal(true)}
          className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80"
          style={{ transform: "skewX(-15deg)" }}
          title={`${t('save_current_to_library')} ${type}`}
        >
          <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
            {t('save_to_library')}
          </span>
        </button>
      </div>
    );
  }
  if (showSaveModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-oscuro border-2 border-azul rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="font-pixel text-xs text-white mb-4">
            {type === 'workflow' ? t('save_workflow_to_library') : t('save_prompt_to_library')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white font-agency text-xs mb-2">{t('name')} *</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-oscurazul rounded text-white font-agency text-xs focus:border-azul outline-none"
                placeholder={`${t('enter_name')} ${type}`}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-white font-agency text-xs mb-2">{t('description')}</label>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-oscurazul rounded text-white font-agency text-xs focus:border-azul outline-none resize-none"
                placeholder={t('optional_description')}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowSaveModal(false);
                setSaveName("");
                setSaveDescription("");
              }}
              className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-viol text-white hover:opacity-80"
              style={{ transform: "skewX(-15deg)" }}
            >
              <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                {t('cancel')}
              </span>
            </button>
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className={`lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul ${
                saveName.trim()
                  ? 'bg-white text-black hover:opacity-80'
                  : 'bg-viol text-white/50 cursor-not-allowed'
              }`}
              style={{ transform: "skewX(-15deg)" }}
            >
              <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                {t('save')}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-oscuro border-2 border-azul rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-pixel text-xs text-white">
            {t('library')} {typeLabel} ({items.length})
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:opacity-80 transition-opacity text-xl font-bold"
          >
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-white font-agency text-xs mb-2">
              {t('no_yet')} {typeLabel}
            </div>
            <div className="text-crema font-agency text-xs max-w-md">
              {t('save_your_first')} {type} {t('to_see_it_appear_here')}.
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/30 border-2 border-oscurazul rounded p-4 hover:border-azul transition-colors cursor-pointer"
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-white font-agency text-xs truncate">
                      {item.name}
                    </h4>
                    {item.isDefault && (
                      <span className="px-2 py-1 bg-azul/20 text-azul font-agency text-xs rounded">
                        {t('default')}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-crema font-agency text-xs mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {type === 'prompt' && (
                    <div className="bg-black/50 rounded p-2 mb-3">
                      <p className="text-crema font-agency text-xs line-clamp-3">
                        {(item as SynthPrompt).prompt}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-crema font-agency">
                    <span>{t('created')}: {new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>{t('modified')}: {new Date(item.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setIsOpen(false)}
            className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-viol text-white hover:opacity-80"
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {t('close')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}