import { MouseEvent } from "react";
import { DesignCardExtendedProps } from "../types/activity.types";

export default function DesignCard({
  designMetadata,
  onLoad,
  onDelete,
  isDeleting = false,
}: DesignCardExtendedProps) {
  const { design, stats } = designMetadata;
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
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
      className={`group bg-gray-900 border border-gray-700 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
        isDeleting 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20'
      }`}
    >
      <div className="aspect-video bg-gray-800 relative overflow-hidden">
        {design.thumbnail ? (
          <img
            src={design.thumbnail}
            alt={design.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-2xl mb-2">📐</div>
              <div className="text-xs font-sat">No Preview</div>
            </div>
          </div>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Delete design"
        >
          {isDeleting ? '⏳' : '×'}
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-satB text-white text-sm truncate flex-1 mr-2">
            {design.name}
          </h3>
          <div className="text-xs text-gray-500 font-sat whitespace-nowrap">
            {formatTime(design.lastModified)}
          </div>
        </div>
        {design.description && (
          <p className="text-xs text-gray-400 font-mana mb-3 line-clamp-2">
            {design.description}
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 font-sat mb-3">
          <div className="text-center">
            <div className="text-white font-satB">{stats.canvasHistoryCount}</div>
            <div>Canvas</div>
          </div>
          <div className="text-center">
            <div className="text-white font-satB">{stats.aiGenerationCount}</div>
            <div>AI Gen</div>
          </div>
          <div className="text-center">
            <div className="text-white font-satB">{stats.compositeCount}</div>
            <div>Composite</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Template:</span>
            <span className="font-mono">{design.templateId}</span>
          </div>
          <div className="flex justify-between">
            <span>Layer:</span>
            <span className="font-mono">{design.layerTemplateId}</span>
          </div>
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{formatDate(design.createdAt)}</span>
          </div>
        </div>
      </div>
      {isDeleting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white font-sat text-sm">Deleting...</div>
        </div>
      )}
    </div>
  );
}