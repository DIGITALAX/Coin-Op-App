import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNavigation from "../../Common/modules/PageNavigation";
import { useDesignContext } from "../../../context/DesignContext";
import { useCart } from "../../../context/CartContext";
import { useLibrary } from "../../../context/LibraryContext";
import DesignCard from "./DesignCard";
import LibraryCard from "./LibraryCard";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
export default function Activity() {
  const { availableDesigns, isLoading, loadDesign, deleteDesign } =
    useDesignContext();
  const { removeByDesignId } = useCart();
  const { 
    workflows, 
    synthPrompts, 
    compositePrompts, 
    stats, 
    isLoading: libraryLoading,
    deleteWorkflow,
    deleteSynthPrompt,
    deleteCompositePrompt
  } = useLibrary();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingLibrary, setIsDeletingLibrary] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    designId: string;
    designName: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'library'>('projects');
  const handleLoadDesign = async (designId: string) => {
    try {
      await loadDesign(designId);
      navigate("/Synth");
    } catch (error) {
      alert("Failed to load design. It may have been corrupted or deleted.");
    }
  };
  const handleShowDeleteModal = (designId: string) => {
    const design = availableDesigns.find((d) => d.design.id === designId);
    if (design) {
      setShowDeleteModal({ designId, designName: design.design.name });
    }
  };
  const handleConfirmDelete = async () => {
    if (!showDeleteModal) return;
    const { designId } = showDeleteModal;
    try {
      setIsDeleting(designId);
      setShowDeleteModal(null);
      await deleteDesign(designId);
      removeByDesignId(designId);
    } catch (error) {
      alert("Failed to delete design. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };
  const handleCancelDelete = () => {
    setShowDeleteModal(null);
  };
  const handleLoadLibraryItem = async (id: string, type: 'workflow' | 'synthPrompt' | 'compositePrompt') => {
    try {
      switch (type) {
        case 'workflow':
          localStorage.setItem('loadWorkflowId', id);
          localStorage.setItem('switchToComfyUI', 'true');
          navigate('/Synth');
          break;
        case 'synthPrompt':
          navigate('/Synth');
          localStorage.setItem('loadSynthPromptId', id);
          break;
        case 'compositePrompt':
          navigate('/Composite');
          localStorage.setItem('loadCompositePromptId', id);
          break;
      }
    } catch (error) {
      alert("Failed to load library item. Please try again.");
    }
  };
  const handleDeleteLibraryItem = async (id: string, type: 'workflow' | 'synthPrompt' | 'compositePrompt') => {
    try {
      setIsDeletingLibrary(id);
      switch (type) {
        case 'workflow':
          await deleteWorkflow(id);
          break;
        case 'synthPrompt':
          await deleteSynthPrompt(id);
          break;
        case 'compositePrompt':
          await deleteCompositePrompt(id);
          break;
      }
    } catch (error) {
      alert("Failed to delete library item. Please try again.");
    } finally {
      setIsDeletingLibrary(null);
    }
  };
  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-black">
      <div className="mb-6">
        <h2 className="text-lg font-satB text-white tracking-wider mb-4">
          ACTIVITY
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 font-satB text-sm rounded transition-colors ${
              activeTab === 'projects'
                ? 'bg-ama text-black'
                : 'bg-gris text-white hover:opacity-70'
            }`}
          >
            PROJECTS ({availableDesigns.length})
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 font-satB text-sm rounded transition-colors ${
              activeTab === 'library'
                ? 'bg-ama text-black'
                : 'bg-gris text-white hover:opacity-70'
            }`}
          >
            LIBRARY ({stats.workflowsCount + stats.synthPromptsCount + stats.compositePromptsCount})
          </button>
        </div>
        <p className="text-gray-400 font-mana text-xxxs">
          {activeTab === 'projects' 
            ? 'Manage your saved designs and project history'
            : 'Manage your saved workflows, synth prompts, and composite prompts'
          }
        </p>
      </div>
      <div className="flex-1 overflow-y-scroll">
        {activeTab === 'projects' ? (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400 font-sat text-sm">
                  Loading designs...
                </div>
              </div>
            ) : availableDesigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-gray-500 font-sat text-lg mb-2">
                  No Designs Yet
                </div>
                <div className="text-gray-400 font-mana text-sm max-w-md">
                  Start creating by selecting a template and child pattern on the
                  Format page. Your first design will appear here once you begin
                  working.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableDesigns.map((designMetadata) => (
                  <DesignCard
                    key={designMetadata.design.id}
                    designMetadata={designMetadata}
                    onLoad={handleLoadDesign}
                    onDelete={handleShowDeleteModal}
                    isDeleting={isDeleting === designMetadata.design.id}
                  />
                ))}
              </div>
            )}
            {availableDesigns.length > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400 font-sat">
                  {availableDesigns.length} design
                  {availableDesigns.length !== 1 ? "s" : ""} saved locally
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {libraryLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400 font-sat text-sm">
                  Loading library...
                </div>
              </div>
            ) : workflows.length === 0 && synthPrompts.length === 0 && compositePrompts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-gray-500 font-sat text-lg mb-2">
                  No Library Items Yet
                </div>
                <div className="text-gray-400 font-mana text-sm max-w-md">
                  Save workflows and prompts from the Synth and Composite pages to build your library.
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {workflows.length > 0 && (
                  <div>
                    <h3 className="text-blue-400 font-satB text-sm mb-4 flex items-center gap-2">
                      <span>ComfyUI Workflows</span>
                      <span className="text-gray-400">({workflows.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {workflows.map((workflow) => (
                        <LibraryCard
                          key={workflow.id}
                          item={workflow}
                          type="workflow"
                          onLoad={(id, type) => handleLoadLibraryItem(id, type)}
                          onDelete={(id) => handleDeleteLibraryItem(id, 'workflow')}
                          isDeleting={isDeletingLibrary === workflow.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {synthPrompts.length > 0 && (
                  <div>
                    <h3 className="text-green-400 font-satB text-sm mb-4 flex items-center gap-2">
                      <span>Synth Prompts</span>
                      <span className="text-gray-400">({synthPrompts.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {synthPrompts.map((prompt) => (
                        <LibraryCard
                          key={prompt.id}
                          item={prompt}
                          type="synthPrompt"
                          onLoad={(id, type) => handleLoadLibraryItem(id, type)}
                          onDelete={(id) => handleDeleteLibraryItem(id, 'synthPrompt')}
                          isDeleting={isDeletingLibrary === prompt.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {compositePrompts.length > 0 && (
                  <div>
                    <h3 className="text-purple-400 font-satB text-sm mb-4 flex items-center gap-2">
                      <span>Composite Prompts</span>
                      <span className="text-gray-400">({compositePrompts.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {compositePrompts.map((prompt) => (
                        <LibraryCard
                          key={prompt.id}
                          item={prompt}
                          type="compositePrompt"
                          onLoad={(id, type) => handleLoadLibraryItem(id, type)}
                          onDelete={(id) => handleDeleteLibraryItem(id, 'compositePrompt')}
                          isDeleting={isDeletingLibrary === prompt.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {(workflows.length > 0 || synthPrompts.length > 0 || compositePrompts.length > 0) && (
              <div className="mt-8 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400 font-sat">
                  {stats.workflowsCount + stats.synthPromptsCount + stats.compositePromptsCount} library item
                  {(stats.workflowsCount + stats.synthPromptsCount + stats.compositePromptsCount) !== 1 ? "s" : ""} saved locally
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <PageNavigation currentPage="/Activity" />
      <DeleteConfirmationModal
        isOpen={!!showDeleteModal}
        designName={showDeleteModal?.designName || ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
