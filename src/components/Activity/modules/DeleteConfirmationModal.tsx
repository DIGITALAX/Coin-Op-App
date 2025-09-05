import { DeleteConfirmationModalProps } from "../types/activity.types";

export default function DeleteConfirmationModal({
  isOpen,
  designName,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-white font-satB text-lg mb-4">Delete Design</h3>
        <p className="text-gray-300 font-sat text-sm mb-6">
          Are you sure you want to delete "{designName}"? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-sat text-sm rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-sat text-sm rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}