import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import { useDesignContext } from "../../../context/DesignContext";
import { FULFILLERS, INFURA_GATEWAY } from "../../../lib/constants";
import PageNavigation from "../../Common/modules/PageNavigation";
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
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-satB text-white tracking-wider mb-4">
            {t("fulfillment")}
          </h2>
          <p className="text-red-400 font-mana text-sm">
            {t("no_layer_selected")}
          </p>
        </div>
        <PageNavigation currentPage="/Fulfill" />
      </div>
    );
  }
  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <h2 className="text-lg font-satB text-white tracking-wider mb-4">
              {t("fulfillment")}
            </h2>
            {currentDesign && (
              <p className="text-ama font-mana text-xs mb-2">
                {t("project")}: {currentDesign.name}
              </p>
            )}
            <p className="text-white font-mana text-xs mb-6">
              {selectedTemplate?.name} - TID-{currentTemplate?.templateId}
            </p>

            <div className="border border-ama rounded-md p-4 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-satB text-sm">
                  {t("supplier_fulfiller_total")}:
                </span>
                <span className="text-ama font-satB text-lg">
                  {formatPrice(calculateTotal + FULFILLERS[0].base)} MONA
                </span>
              </div>
              <div className="text-white font-mana text-xs space-y-1">
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
          </div>

          <div className="space-y-6">
            <div className="border border-ama rounded-md p-4 mb-6">
              <h3 className="text-white font-satB text-sm mb-4 tracking-wider">
                {t("fulfiller")}
              </h3>
              <div className="flex gap-4">
                {FULFILLERS.map((fulfiller, index) => (
                  <div
                    key={index}
                    className="relative flex-1 border border-ama bg-black rounded-md p-4"
                  >
                    <img
                      className="w-full h-32 object-contain rounded-md mb-2"
                      src={`${INFURA_GATEWAY}/ipfs/${
                        fulfiller.uri.split("ipfs://")[1]
                      }`}
                      alt={fulfiller.title}
                      draggable={false}
                    />
                    <div className="text-center">
                      <h4 className="text-white font-mana text-xs mb-1">
                        {fulfiller.title}
                      </h4>
                      <p className="text-white font-mana text-xxxs opacity-70 mb-2">
                        {t("professional_garment_manufacturing")}
                      </p>
                      <div className="text-ama font-mana text-xxxs">
                        <div>
                          {t("base")}: {fulfiller.base} MONA
                        </div>
                        <div>
                          {t("vig")}: {fulfiller.vig}% {t("of_sale_price")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-ama rounded-md p-4 mb-6">
              <h3 className="text-white font-satB text-sm mb-4 tracking-wider">
                {t("select_print_dye")}
              </h3>
              <div className="flex gap-3">
                {filteredValues?.colors?.map((color, index) => (
                  <div
                    key={index}
                    onClick={() => toggleColor(color)}
                    className={`relative border rounded-md p-2 cursor-pointer hover:opacity-80 ${
                      fulfillmentSelection.color?.title == color.title
                        ? "border-ama bg-black"
                        : "border-white opacity-60"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-md border border-gray-300"
                      style={{ backgroundColor: color.title }}
                    />
                    <p className="text-white font-mana text-xxxs mt-1 text-center">
                      {getColorName(color.title)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-ama rounded-md p-4 mb-6">
              <h3 className="text-white font-satB text-sm mb-4 tracking-wider">
                {t("select_materials")}
              </h3>
              {loading ? (
                <div className="text-white font-mana text-xs text-center py-4">
                  {t("loading_materials")}
                </div>
              ) : filteredValues?.materials.length === 0 ? (
                <div className="text-white font-mana text-xs text-center py-4">
                  {t("no_materials_available")}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredValues?.materials?.map((material, index) => (
                    <div
                      key={index}
                      onClick={() => toggleMaterial(material)}
                      className={`relative border rounded-md p-3 cursor-pointer hover:opacity-80 ${
                        fulfillmentSelection.material?.title == material.title
                          ? "border-ama bg-black"
                          : "border-white opacity-60"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="text-white font-mana text-xs mb-1">
                            {material.title}
                          </h4>
                          <p className="text-white font-mana text-xxxs opacity-80">
                            {material.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-ama font-mana text-xs">
                            {material.price === 0
                              ? t("base")
                              : `${formatPrice(material.price)} MONA`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {fulfillmentSelection.color && fulfillmentSelection.material && (
              <div className="border border-ama rounded-md p-4">
                <h3 className="text-ama font-satB text-sm mb-4 tracking-wider">
                  {t("fulfillment_ready")}
                </h3>
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-white font-mana">{t("colors")}:</span>
                    <span className="text-white font-mana">
                      {fulfillmentSelection.color.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white font-mana">
                      {t("materials")}:
                    </span>
                    <span className="text-white font-mana">
                      {fulfillmentSelection.material.title}
                    </span>
                  </div>
                </div>
                <div className="border-t border-ama pt-3 mb-4">
                  <div className="flex justify-between mb-4">
                    <span className="text-white font-satB text-sm">
                      {t("supplier_fulfiller_total")}:
                    </span>
                    <span className="text-ama font-satB text-sm">
                      {formatPrice(calculateTotal + FULFILLERS[0].base)} MONA
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/Sell")}
                    className="w-full bg-ama hover:bg-ama/90 text-black font-satB text-xs py-3 px-4 rounded-md hover:opacity-80"
                  >
                    {t("proceed_to_sell")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <PageNavigation currentPage="/Fulfill" />
    </div>
  );
}
