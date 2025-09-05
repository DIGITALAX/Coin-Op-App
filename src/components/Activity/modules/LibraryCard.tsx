import { useState } from "react";
import { SynthPrompt, CompositePrompt, LibraryCardProps } from "../types/activity.types";

export default function LibraryCard({ item, type, onLoad, onDelete, isDeleting }: LibraryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const getTypeLabel = () => {
    switch (type) {
      case 'workflow':
        return 'ComfyUI Workflow';
      case 'synthPrompt':
        return 'Synth Prompt';
      case 'compositePrompt':
        return 'Composite Prompt';
      default:
        return 'Library Item';
    }
  };
  const getTypeColor = () => {
    switch (type) {
      case 'workflow':
        return 'text-blue-400';
      case 'synthPrompt':
        return 'text-green-400';
      case 'compositePrompt':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };
  const getPreviewContent = () => {
    if (type === 'workflow') {
      return 'ComfyUI JSON Workflow';
    }
    const prompt = item as SynthPrompt | CompositePrompt;
    return prompt.prompt?.substring(0, 100) + (prompt.prompt?.length > 100 ? '...' : '');
  };
  return (
    <div className="bg-oscuro border border-oscurazul rounded-lg overflow-hidden hover:border-ama transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-satB text-sm truncate mb-1">
              {item.name}
            </h3>
            <p className={`font-mana text-xxxs ${getTypeColor()}`}>
              {getTypeLabel()}
              {item.isDefault && ' (Default)'}
            </p>
          </div>
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className={`ml-2 p-1 text-red-400 hover:text-red-300 transition-colors ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Delete item"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              "×"
            )}
          </button>
        </div>
        {item.description && (
          <p className="text-gray-400 font-mana text-xxxs mb-3 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="bg-black/30 rounded p-2 mb-3">
          <p className="text-gray-300 font-mono text-xxxs line-clamp-3">
            {getPreviewContent()}
          </p>
        </div>
        <div className="flex items-center justify-between text-xxxs text-gray-500 font-mana mb-3">
          <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
          <span>Modified: {new Date(item.lastModified).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onLoad(item.id, type)}
            className="flex-1 px-3 py-2 bg-ama text-black font-satB text-xxxs rounded hover:opacity-80 transition-opacity"
          >
            LOAD
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-2 bg-gris text-white font-satB text-xxxs rounded hover:opacity-80 transition-opacity"
          >
            {showDetails ? 'HIDE' : 'DETAILS'}
          </button>
        </div>
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-oscurazul">
            <div className="space-y-2 text-xxxs">
              <div className="text-gray-400 font-mana">
                <span className="text-white">ID:</span> {item.id}
              </div>
              {type !== 'workflow' && (
                <>
                  <div className="text-gray-400 font-mana">
                    <span className="text-white">Prompt:</span>
                  </div>
                  <div className="bg-black/30 rounded p-2 max-h-20 overflow-y-auto">
                    <p className="font-mono text-xxxs text-gray-300">
                      {(item as SynthPrompt | CompositePrompt).prompt}
                    </p>
                  </div>
                  {(item as SynthPrompt | CompositePrompt).negativePrompt && (
                    <>
                      <div className="text-gray-400 font-mana">
                        <span className="text-white">Negative Prompt:</span>
                      </div>
                      <div className="bg-black/30 rounded p-2 max-h-20 overflow-y-auto">
                        <p className="font-mono text-xxxs text-gray-300">
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