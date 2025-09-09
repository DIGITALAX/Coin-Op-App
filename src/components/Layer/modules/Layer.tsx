import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import { useDesignContext } from "../../../context/DesignContext";
import { INFURA_GATEWAY } from "../../../lib/constants";
import PageNavigation from "../../Common/modules/PageNavigation";
import DesignCreationModal from "../../Design/modules/DesignCreationModal";
import useLayer from "../hooks/useLayer";
import { CreateDesignRequest, Design } from "../../Design/types/design.types";
import { Template } from "../../Format/types/format.types";

export default function Layer() {
  const { t } = useTranslation();
  const { formatPrice, getTotalChildrenPrice } = useLayer();
  const { selectedTemplate, selectedLayer, selectLayer, isLoadingTemplates } = useApp();
  const { createDesign } = useDesignContext();
  const navigate = useNavigate();
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [selectedFront, setSelectedFront] = useState<Template | null>(null);
  const [selectedBack, setSelectedBack] = useState<Template | null>(null);

  useEffect(() => {
    setSelectedFront(null);
    setSelectedBack(null);
  }, [selectedTemplate]);
  const getTemplateType = () => {
    if (!selectedTemplate || !selectedTemplate.templates.length) return null;
    const allTags = selectedTemplate.templates.flatMap(template => template.metadata?.tags || []);
    for (const tag of allTags) {
      const tagLower = tag.toLowerCase();
      if (tagLower === "t-shirt" || tagLower === "shirt") return "shirt";
      if (tagLower === "hoodie") return "hoodie";
      if (tagLower === "poster") return "poster";
      if (tagLower === "sticker") return "sticker";
    }
    return null;
  };

  const requiresBothSides = () => {
    const type = getTemplateType();
    return type === "shirt" || type === "hoodie";
  };

  const handleFrontClick = (layer: Template) => {
    setSelectedFront(layer);
  };

  const handleBackClick = (layer: Template) => {
    setSelectedBack(layer);
  };

  const canCreateDesign = () => {
    if (requiresBothSides()) {
      return selectedFront && selectedBack;
    }
    return selectedFront;
  };

  const handleCreateDesign = () => {
    if (!canCreateDesign()) return;
    const primaryLayer = selectedFront || selectedBack;
    if (primaryLayer) {
      selectLayer(primaryLayer);
      setShowDesignModal(true);
    }
  };
  const handleDesignCreated = async (
    request: CreateDesignRequest
  ): Promise<Design> => {
    try {
      const design = await createDesign(request);
      if (selectedFront) {
        selectLayer(selectedFront, selectedBack || undefined);
      }
      navigate("/Synth");
      return design;
    } catch (error) {
      throw error;
    }
  };
  const handleModalClose = () => {
    setShowDesignModal(false);
  };

  if (isLoadingTemplates) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ama"></div>
          <div className="text-white font-satB text-lg tracking-wider">
            {t('loading_templates')}
          </div>
        </div>
        <PageNavigation currentPage="/Layer" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-start justify-start">
      <div className="mb-6">
        <h2 className="text-lg font-satB text-white tracking-wider mb-4">
          {t('select_layer')}
        </h2>
        <div className="relative flex flex-col gap-2 mb-4">
          <h2 className="text-base font-sat text-white tracking-wider mb-4">
            {t('front')}
          </h2>
          <div className="relative w-full flex flex-wrap gap-8 items-center justify-start">
            {Number(selectedTemplate?.templates.length) > 0
              ? selectedTemplate?.templates
                  .filter((template) =>
                    template.metadata?.tags?.some((tag) =>
                      tag.toLowerCase().includes("front")
                    )
                  )
                  .map((layer, index) => (
                    <div
                      key={index}
                      className={`relative w-48 h-44 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:opacity-70 ${
                         (selectedFront || selectedLayer?.front)?.templateId === layer.templateId &&
                        "opacity-40 border-2 border-ama"
                      }`}
                      onClick={() => handleFrontClick(layer)}
                    >
                      <div className="absolute w-full h-full">
                        <img
                          className="w-full h-full object-cover"
                          src={`${INFURA_GATEWAY}/ipfs/QmabrLTvs7EW8P9sZ2WGcf1gSrc4n3YmsFyvtcLYN8gtuP`}
                          draggable={false}
                          alt="background"
                        />
                      </div>
                      <div className="relative flex flex-col w-full h-full gap-2 items-center justify-between p-2">
                        <div className="relative w-full h-3/4">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img
                              className="w-full h-full object-contain"
                              src={`${INFURA_GATEWAY}/ipfs/${
                                layer.metadata.image.split("ipfs://")[1]
                              }`}
                              draggable={false}
                              alt="layer uri"
                            />
                          </div>
                          
                        </div>
                        <div className="relative w-full h-fit flex flex-row font-mana text-white text-xxxs px-1.5 gap-1.5 justify-between">
                          <div className="relative w-fit h-fit">FGO</div>
                          <div className="relative w-fit h-fit">
                            TID-{layer.templateId}
                          </div>
                          <div className="relative w-fit h-fit">
                            ${formatPrice(layer.price)}
                          </div>
                          <div className="relative w-fit h-fit">
                            CID-{(layer.childReferences || []).length}
                          </div>
                          <div className="relative w-fit h-fit">
                            $
                            {getTotalChildrenPrice(layer.childReferences || [])}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              : Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative w-48 h-44 flex flex-col items-center justify-center cursor-pointer opacity-50"
                  >
                    <div className="absolute w-full h-full">
                      <img
                        className="w-full h-full object-cover"
                        src={`${INFURA_GATEWAY}/ipfs/QmabrLTvs7EW8P9sZ2WGcf1gSrc4n3YmsFyvtcLYN8gtuP`}
                        draggable={false}
                        alt="loading"
                      />
                    </div>
                  </div>
                ))}
          </div>
        </div>
        {requiresBothSides() && (
          <div className="relative flex flex-col gap-2">
            <h2 className="text-base font-sat text-white tracking-wider mb-4">
              {t('back')}
            </h2>
          <div className="relative w-full flex flex-wrap gap-8 items-center justify-start">
            {Number(selectedTemplate?.templates.length) > 0
              ? selectedTemplate?.templates
                  .filter((template) =>
                    template.metadata?.tags?.some((tag) =>
                      tag.toLowerCase().includes("back")
                    )
                  )
                  .map((layer, index) => (
                    <div
                      key={index}
                      className={`relative w-48 h-44 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:opacity-70 ${
                        (selectedBack || selectedLayer?.back)?.templateId === layer.templateId &&
                        "opacity-40 border-2 border-ama"
                      }`}
                      onClick={() => handleBackClick(layer)}
                    >
                      <div className="absolute w-full h-full">
                        <img
                          className="w-full h-full object-cover"
                          src={`${INFURA_GATEWAY}/ipfs/QmabrLTvs7EW8P9sZ2WGcf1gSrc4n3YmsFyvtcLYN8gtuP`}
                          draggable={false}
                          alt="background"
                        />
                      </div>
                      <div className="relative flex flex-col w-full h-full gap-2 items-center justify-between p-2">
                        <div className="relative w-full h-3/4">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img
                              className="w-full h-full object-contain"
                              src={`${INFURA_GATEWAY}/ipfs/${
                                 layer.metadata.image.split("ipfs://")[1]
                              }`}
                              draggable={false}
                              alt="layer uri"
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center h-full w-full">
                            <div className="relative items-center justify-center flex w-full h-full">
                              <img
                                className="w-full h-full object-contain"
                                src={`${INFURA_GATEWAY}/ipfs/${
                                  layer.metadata.image.split("ipfs://")[1]
                                }`}
                                draggable={false}
                                alt="layer poster"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="relative w-full h-fit flex flex-row font-mana text-white text-xxxs px-1.5 gap-1.5 justify-between">
                          <div className="relative w-fit h-fit">FGO</div>
                          <div className="relative w-fit h-fit">
                            TID-{layer.templateId}
                          </div>
                          <div className="relative w-fit h-fit">
                            ${formatPrice(layer.price)}
                          </div>
                          <div className="relative w-fit h-fit">
                            CID-{(layer.childReferences || []).length}
                          </div>
                          <div className="relative w-fit h-fit">
                            $
                            {getTotalChildrenPrice(layer.childReferences || [])}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              : Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative w-48 h-44 flex flex-col items-center justify-center cursor-pointer opacity-50"
                  >
                    <div className="absolute w-full h-full">
                      <img
                        className="w-full h-full object-cover"
                        src={`${INFURA_GATEWAY}/ipfs/QmabrLTvs7EW8P9sZ2WGcf1gSrc4n3YmsFyvtcLYN8gtuP`}
                        draggable={false}
                        alt="loading"
                      />
                    </div>
                  </div>
                ))}
          </div>
          </div>
        )}
        {(selectedFront || selectedBack) && (
          <div className="relative w-full flex justify-center mt-8">
            <button
              onClick={handleCreateDesign}
              disabled={!canCreateDesign()}
              className={`px-8 py-3 rounded-lg font-satB text-lg tracking-wider transition-all ${
                canCreateDesign()
                  ? "bg-ama text-black hover:bg-ama/80 cursor-pointer"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              {requiresBothSides() && (!selectedFront || !selectedBack)
                ? (!selectedFront ? t('select_front_to_continue') : t('select_back_to_continue'))
                : t('create_design')
              }
            </button>
          </div>
        )}
      </div>
      <PageNavigation currentPage="/Layer" />
      {showDesignModal && (selectedFront || selectedBack) && (
        <DesignCreationModal
          isOpen={showDesignModal}
          onClose={handleModalClose}
          templateId={selectedTemplate?.name || ""}
          frontLayerTemplateId={selectedFront?.templateId || ""}
          backLayerTemplateId={selectedBack?.templateId}
          childUri={
            ((selectedFront || selectedBack)?.childReferences || []).find(ref => ref.child?.metadata?.image)?.child.metadata.image || ""
          }
          onDesignCreated={handleDesignCreated}
        />
      )}
    </div>
  );
}
