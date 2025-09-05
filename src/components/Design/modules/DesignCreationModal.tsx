import { useState } from "react";
import { DesignCreationModalProps } from "../types/design.types";
export default function DesignCreationModal({
  isOpen,
  onClose,
  templateId,
  layerTemplateId,
  childUri,
  onDesignCreated,
}: DesignCreationModalProps) {
  const [designName, setDesignName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const handleCreate = async () => {
    if (!designName.trim()) {
      setError("Design name is required");
      return;
    }
    setIsCreating(true);
    setError("");
    try {
      await onDesignCreated({
        name: designName.trim(),
        templateId,
        layerTemplateId,
        childUri,
        description: description.trim() || undefined,
      });
      setDesignName("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create design");
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
        <h2 className="text-xl font-satB text-white mb-4">Create New Design</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-sat text-gray-300 mb-2">
              Design Name *
            </label>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Enter design name..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded font-sat text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              disabled={isCreating}
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-sat text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your design concept..."
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
            <p>Template: {templateId}</p>
            <p>Layer: {layerTemplateId}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded font-sat text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !designName.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-sat text-sm transition-colors"
          >
            {isCreating ? "Creating..." : "Create Design"}
          </button>
        </div>
      </div>
    </div>
  );
}
