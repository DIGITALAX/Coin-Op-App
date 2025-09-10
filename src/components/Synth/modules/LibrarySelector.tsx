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
  const typeColor = type === 'workflow' ? 'text-blue-400' : (mode === 'composite' ? 'text-purple-400' : 'text-green-400');
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
          className="px-3 py-2 bg-gris text-white font-satB text-xxxs rounded hover:opacity-80 transition-opacity"
          title={`${t('load_from_library')} ${typeLabel}`}
        >
          {type === 'workflow' ? t('load_workflows') : (mode === 'composite' ? t('load_composite_prompts') : t('load_synth_prompts'))}
        </button>
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-3 py-2 bg-ama text-black font-satB text-xxxs rounded hover:opacity-80 transition-opacity"
          title={`${t('save_current_to_library')} ${type}`}
        >
          {t('save_to_library')}
        </button>
      </div>
    );
  }
  if (showSaveModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-black border border-oscurazul rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className={`font-satB text-lg ${typeColor} mb-4`}>
            {type === 'workflow' ? t('save_workflow_to_library') : t('save_prompt_to_library')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white font-mana text-xxxs mb-2">{t('name')} *</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-oscurazul rounded text-white font-mana text-xxxs focus:border-ama outline-none"
                placeholder={`${t('enter_name')} ${type}`}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-white font-mana text-xxxs mb-2">{t('description')}</label>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-oscurazul rounded text-white font-mana text-xxxs focus:border-ama outline-none resize-none"
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
              className="px-4 py-2 bg-gris text-white font-satB text-xxxs rounded hover:opacity-80 transition-opacity"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className={`px-4 py-2 font-satB text-xxxs rounded transition-opacity ${
                saveName.trim()
                  ? 'bg-ama text-black hover:opacity-80'
                  : 'bg-gris/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-oscuro border border-oscurazul rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`font-satB text-lg ${typeColor}`}>
            {t('library')} {typeLabel} ({items.length})
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors text-xl font-bold"
          >
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-gray-500 font-sat text-lg mb-2">
              {t('no_yet')} {typeLabel}
            </div>
            <div className="text-gray-400 font-mana text-sm max-w-md">
              {t('save_your_first')} {type} {t('to_see_it_appear_here')}.
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/30 border border-oscurazul rounded p-4 hover:border-ama transition-colors cursor-pointer"
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-white font-satB text-sm truncate">
                      {item.name}
                    </h4>
                    {item.isDefault && (
                      <span className="px-2 py-1 bg-ama/20 text-ama font-mana text-xxxs rounded">
                        {t('default')}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-gray-400 font-mana text-xxxs mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {type === 'prompt' && (
                    <div className="bg-black/50 rounded p-2 mb-3">
                      <p className="text-gray-300 font-mono text-xxxs line-clamp-3">
                        {(item as SynthPrompt).prompt}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xxxs text-gray-500 font-mana">
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
            className="px-6 py-2 bg-gris text-white font-satB text-sm rounded hover:opacity-80 transition-opacity"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}