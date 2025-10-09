import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import { useDesignContext } from "../../../context/DesignContext";
import { INFURA_GATEWAY } from "../../../lib/constants";
import DesignCreationModal from "../../Design/modules/DesignCreationModal";
import useLayer from "../hooks/useLayer";
import { CreateDesignRequest, Design } from "../../Design/types/design.types";
import { Template } from "../../Format/types/format.types";

export default function Layer() {
  const { t } = useTranslation();
  const { formatPrice, getTotalChildrenPrice } = useLayer();
  const { selectedTemplate, selectedLayer, selectLayer, isLoadingTemplates } =
    useApp();
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
    const allTags = selectedTemplate.templates.flatMap(
      (template) => template.metadata?.tags || []
    );
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

    setShowDesignModal(true);
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
          <img
            src="/images/settings.png"
            className="w-6 h-6 animate-spin"
            draggable={false}
          />
          <div className="text-white relative w-fit h-fit flex font-slim text-sm tracking-wider">
            <span className="absolute inset-0 text-azul translate-x-[3px] translate-y-[3px]">
              {t("loading_templates")}
            </span>
            <span className="absolute inset-0 text-amarillo translate-x-[2px] translate-y-[2px]">
              {t("loading_templates")}
            </span>
            <span className="absolute inset-0 text-turq translate-x-[1px] translate-y-[1px]">
              {t("loading_templates")}
            </span>
            <span className="relative text-white">
              {t("loading_templates")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-start justify-start">
      <div className="mb-6">
        <div className="relative w-full h-fit flex justify-between items-center gap-5 text-xs font-pixel mb-4 pr-12">
          <h2 className="text-white tracking-wider w-fit h-fit relative flex whitespace-nowrap">
            {t("select_layer")}
          </h2>
          {(selectedFront || selectedBack) && (
            <button
              onClick={handleCreateDesign}
              disabled={!canCreateDesign()}
              className={`relative lowercase py-1 px-2 text-xs font-count transition-all rounded-sm border-2 border-azul ${
                canCreateDesign()
                  ? "bg-white text-black hover:opacity-80 cursor-pointer"
                  : "bg-viol text-white/50 cursor-not-allowed"
              }`}
              style={{ transform: "skewX(-15deg)" }}
            >
              <span
                style={{ transform: "skewX(15deg)" }}
                className="relative inline-block"
              >
                {requiresBothSides() && (!selectedFront || !selectedBack)
                  ? !selectedFront
                    ? t("select_front_to_continue")
                    : t("select_back_to_continue")
                  : t("create_design")}
              </span>
            </button>
          )}
        </div>
        <div className="relative flex flex-col gap-2 mb-4">
          <h2 className="text-xs font-agency text-white tracking-wider mb-4">
            {t("front")}
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
                      className={`relative w-44 h-40 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:opacity-70 ${
                        (selectedFront || selectedLayer?.front)?.templateId ===
                          layer.templateId && "opacity-40 border-ligero border"
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
                        <div className="relative w-full h-fit flex flex-row font-dos text-white text-xxxs px-1.5 gap-1.5 justify-between">
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
                    className="relative w-44 h-40 flex flex-col items-center justify-center cursor-pointer opacity-50"
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
            <h2 className="text-xs font-agency text-white tracking-wider mb-4">
              {t("back")}
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
                        className={`relative w-44 h-40 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:opacity-70 ${
                          (selectedBack || selectedLayer?.back)?.templateId ===
                            layer.templateId &&
                          "opacity-40 border border-ligero"
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
                          <div className="relative w-full h-fit flex flex-row font-dos text-white text-xxxs px-1.5 gap-1.5 justify-between">
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
                              {getTotalChildrenPrice(
                                layer.childReferences || []
                              )}
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
      </div>
      {showDesignModal && (selectedFront || selectedBack) && (
        <DesignCreationModal
          isOpen={showDesignModal}
          onClose={handleModalClose}
          type={selectedTemplate?.template_type!}
          templateId={selectedTemplate?.name || ""}
          frontLayerTemplateId={selectedFront?.templateId || ""}
          backLayerTemplateId={selectedBack?.templateId}
          childUri={
            (selectedFront?.childReferences || []).filter((ref) =>
              ref.child?.metadata?.tags?.includes("zone")
            )?.[0]?.child.metadata.image || ""
          }
          onDesignCreated={handleDesignCreated}
        />
      )}
    </div>
  );
}
