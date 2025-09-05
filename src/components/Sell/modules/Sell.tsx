import PageNavigation from "../../Common/modules/PageNavigation";
import { useDesignContext } from "../../../context/DesignContext";
import { useSell } from "../hooks/useSell";
import { MARKETS } from "../../../lib/constants";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useEffect, useState } from "react";
import { Design } from "../../Design/types/design.types";
export default function Sell() {
  const { availableDesigns } = useDesignContext();
  const { getItem } = useDesignStorage();
  const [compositeThumbnails, setCompositeThumbnails] = useState<{[key: string]: string}>({});
  const {
    selectedProject,
    showMarketSelector,
    handleSellProject,
    handleMarketSelection,
    cancelSell
  } = useSell();
  useEffect(() => {
    const loadCompositeThumbnails = async () => {
      const thumbnails: {[key: string]: string} = {};
      for (const designMetadata of availableDesigns) {
        const design = designMetadata.design;
        try {
          const compositeHistory = await getItem("aiCompositeHistory", design.id, []) as any[];
          if (compositeHistory && compositeHistory.length > 0) {
            const mostRecent = compositeHistory[0];
            if (mostRecent?.imageData) {
              thumbnails[design.id] = mostRecent.imageData;
            }
          }
        } catch (error) {
        }
      }
      setCompositeThumbnails(thumbnails);
    };
    if (availableDesigns.length > 0) {
      loadCompositeThumbnails();
    }
  }, [availableDesigns, getItem]);
  if (availableDesigns.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-satB text-white tracking-wider mb-4">
            SELL YOUR DESIGNS
          </h2>
          <div className="bg-oscuro border border-oscurazul rounded-lg p-8">
            <p className="text-gray-400 font-mana text-sm mb-4">
              No projects to sell
            </p>
            <p className="text-white font-sat text-xs">
              Create a project first to sell your designs
            </p>
          </div>
        </div>
        <PageNavigation currentPage="/Sell" />
      </div>
    );
  }
  return (
    <div className="relative w-full h-full flex flex-col p-6 bg-black overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-lg font-satB text-white tracking-wider mb-2">
          SELL YOUR DESIGNS
        </h2>
        <p className="text-white font-mana text-xxxs mb-4">
          Select a project to submit to marketplace
        </p>
      </div>
      <div className="flex-1 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableDesigns.map((designMetadata) => {
            const design: Design = designMetadata.design;
            return (
            <div
              key={design.id}
              className="bg-oscuro border border-oscurazul rounded-lg p-4 hover:border-ama transition-colors"
            >
              <div className="aspect-square mb-4 bg-black rounded-lg overflow-hidden border border-gray-600">
                {compositeThumbnails[design.id] ? (
                  <img
                    src={compositeThumbnails[design.id]}
                    alt={design.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎨</div>
                      <p className="font-mana text-xs">No composite preview</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-white font-satB text-base truncate">
                  {design.name}
                </h3>
                <div className="text-gray-400 font-mana text-xs space-y-1">
                  <p>Created: {new Date(design.createdAt).toLocaleDateString()}</p>
                  <p>Modified: {new Date(design.lastModified).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleSellProject(design)}
                  className="w-full py-2 bg-ama hover:bg-ama/90 text-black font-satB text-sm rounded transition-colors"
                >
                  SELL PROJECT
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
      {showMarketSelector && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-oscuro border border-oscurazul rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-white font-satB text-lg mb-4">
              SELECT MARKETPLACE
            </h3>
            <p className="text-gray-400 font-mana text-sm mb-6">
              Choose where to sell "{selectedProject.name}"
            </p>
            <div className="space-y-3 mb-6">
              {MARKETS.map((market) => (
                <button
                  key={market.title}
                  onClick={() => handleMarketSelection(market)}
                  className="w-full p-4 bg-gray-800 hover:bg-ama/20 hover:border-ama border border-gray-600 rounded-lg text-left transition-colors"
                >
                  <div className="text-white font-satB text-base mb-1">
                    {market.title}
                  </div>
                  <div className="text-gray-400 font-mana text-xs">
                    Submit to this marketplace
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelSell}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white font-satB text-sm rounded transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
      <PageNavigation currentPage="/Sell" />
    </div>
  );
}