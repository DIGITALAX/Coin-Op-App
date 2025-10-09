import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import { useDesignContext } from "../../../context/DesignContext";
import { FULFILLERS, INFURA_GATEWAY } from "../../../lib/constants";
import useFulfillment from "../hooks/useFulfillment";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";
import { Color, Material } from "../types/fulfillment.types";

export default function Fulfillment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedTemplate, selectedLayer, isBackSide } = useApp();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { currentDesign } = useDesignContext();
  const {
    fulfillmentSelection,
    toggleColor,
    toggleMaterial,
    calculateTotal,
    formatPrice,
    getColorName,
    loading,
    getFilteredMaterialsColors,
  } = useFulfillment();

  const filteredValues = getFilteredMaterialsColors()! as {
    materials: Material[];
    colors: Color[];
  };

  if (!selectedLayer) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4 bg-black">
        <div className="text-center">
          <h2 className="text-xs font-pixel text-white tracking-wider mb-4">
            {t("fulfillment")}
          </h2>
          <p className="text-rosa font-agency text-xs">
            {t("no_layer_selected")}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-black">
      <div className="mb-6">
        <h2 className="text-xs font-pixel text-white tracking-wider mb-2">
          {t("fulfillment")}
        </h2>
        {currentDesign && (
          <p className="text-white font-agency text-xs mb-2">
            {t("project")}: {currentDesign.name}
          </p>
        )}
        {selectedLayer && (
          <p className="text-white font-agency text-xs">
            {selectedTemplate?.name} - TID-{currentTemplate?.templateId}
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto flex justify-center">
        <div className="w-full max-w-2xl space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-agency text-xs">
                {t("supplier_fulfiller_total")}:
              </span>
              <span className="text-crema font-agency text-xs">
                {formatPrice(calculateTotal + FULFILLERS[0].base)} MONA
              </span>
            </div>
            <div className="text-crema font-agency text-xs space-y-1">
                <div className="flex justify-between">
                  <span>{t("template")}:</span>
                  <span>
                    {formatPrice(parseFloat(currentTemplate?.price!) / 1e18)}{" "}
                    MONA
                  </span>
                </div>

                {(currentTemplate?.childReferences || []).length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>{t("template_children")}:</span>
                      <span></span>
                    </div>
                    {(currentTemplate?.childReferences || []).map(
                      (child, index) => (
                        <div key={index} className="flex justify-between pl-4">
                          <span>
                            •{" "}
                            {child.child?.metadata?.title ||
                              `Child ${index + 1}`}
                            :
                          </span>
                          <span>
                            {formatPrice(parseFloat(child.price) / 1e18)} MONA
                          </span>
                        </div>
                      )
                    )}
                  </>
                )}

                {fulfillmentSelection.material && (
                  <>
                    <div className="flex justify-between">
                      <span>{t("material_children")}:</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between">
                      <span>• {fulfillmentSelection.material.title}:</span>
                      <span>
                        {formatPrice(fulfillmentSelection.material.price)} MONA
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <span>{t("fulfiller_base")}:</span>
                  <span>
                    {FULFILLERS[0].base} MONA (+ {FULFILLERS[0].vig}% {t("vig")}
                    )
                  </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-agency text-sm mb-4">
              {t("fulfiller")}
            </h3>
            {FULFILLERS.map((fulfiller, index) => (
              <div key={index} className="flex gap-4 items-start justify-start">
                <img
                  className="w-24 h-24 object-contain flex-shrink-0"
                  src={`${INFURA_GATEWAY}/ipfs/${
                    fulfiller.uri.split("ipfs://")[1]
                  }`}
                  alt={fulfiller.title}
                  draggable={false}
                />
                <div className="text-left">
                  <h4 className="text-white font-agency text-sm mb-1">
                    {fulfiller.title}
                  </h4>
                  <p className="text-crema font-agency text-xs mb-2">
                    {t("professional_garment_manufacturing")}
                  </p>
                  <p className="text-crema font-agency text-xs">
                    {t("base")}: {fulfiller.base} MONA • {t("vig")}: {fulfiller.vig}% {t("of_sale_price")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-white font-agency text-sm mb-4">
              {t("select_print_dye")}
            </h3>
            <div className="flex gap-4 flex-wrap">
              {filteredValues?.colors?.map((color, index) => (
                <div
                  key={index}
                  onClick={() => toggleColor(color)}
                  className="cursor-pointer"
                >
                  <div
                    className={`w-20 h-20 rounded border-2 ${
                      fulfillmentSelection.color?.title === color.title
                        ? "border-white"
                        : "border-ligero"
                    }`}
                    style={{ backgroundColor: color.title }}
                  />
                  <p className={`font-agency text-xs mt-2 text-center ${
                    fulfillmentSelection.color?.title === color.title
                      ? "text-white"
                      : "text-ligero"
                  }`}>
                    {getColorName(color.title)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-agency text-sm mb-4">
              {t("select_materials")}
            </h3>
            {loading ? (
              <div className="text-white font-agency text-sm text-center py-8">
                {t("loading_materials")}
              </div>
            ) : filteredValues?.materials.length === 0 ? (
              <div className="text-white font-agency text-sm text-center py-8">
                {t("no_materials_available")}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredValues?.materials?.map((material, index) => (
                  <div
                    key={index}
                    onClick={() => toggleMaterial(material)}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`font-agency text-sm mb-1 ${
                          fulfillmentSelection.material?.title === material.title
                            ? "text-white"
                            : "text-ligero"
                        }`}>
                          {material.title}
                        </h4>
                        <p className="text-ligero font-agency text-xs">
                          {material.description}
                        </p>
                      </div>
                      <span className={`font-agency text-sm ml-6 ${
                        fulfillmentSelection.material?.title === material.title
                          ? "text-white"
                          : "text-ligero"
                      }`}>
                        {material.price === 0
                          ? t("base")
                          : `${formatPrice(material.price)} MONA`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {fulfillmentSelection.color && fulfillmentSelection.material && (
            <div className="pt-4">
              <button
                onClick={() => navigate("/Sell")}
                className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80"
                style={{ transform: "skewX(-15deg)" }}
              >
                <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                  {t("proceed_to_sell")}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
