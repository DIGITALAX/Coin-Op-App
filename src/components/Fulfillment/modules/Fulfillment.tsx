import { useNavigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import { useCart } from "../../../context/CartContext";
import { useDesignContext } from "../../../context/DesignContext";
import {
  FULFILLERS,
  BASE_COLORS,
  MATERIALS,
  INFURA_GATEWAY,
} from "../../../lib/constants";
import PageNavigation from "../../Common/modules/PageNavigation";
import useFulfillment from "../hooks/useFulfillment";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { collectChildrenCanvasData, collectCompositeImages } from "../../Composite/utils/collectCanvasData";
export default function Fulfillment() {
  const navigate = useNavigate();
  const { selectedTemplate, selectedLayer, isBackSide, flipCanvas } = useApp();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { addToCart } = useCart();
  const { currentDesign } = useDesignContext();
  const { getItem, setItem } = useDesignStorage();
  const {
    fulfillmentSelection,
    selectFulfiller,
    selectBaseColor,
    selectMaterial,
    calculateTotal,
    formatPrice,
    getColorName,
    getMaterialTypeForTemplate,
    resetFulfillmentSelection,
  } = useFulfillment();
  const handleProceedToPurchase = async () => {
    if (
      !selectedTemplate ||
      !selectedLayer ||
      !fulfillmentSelection.fulfiller ||
      !fulfillmentSelection.material ||
      !fulfillmentSelection.baseColor
    ) {
      return;
    }
    const compositeCanvases = document.querySelectorAll("canvas");
    let compositeCanvas: HTMLCanvasElement | null = null;
    for (const canvas of compositeCanvases) {
      if (canvas.width === 600 && canvas.height === 600) {
        compositeCanvas = canvas;
        break;
      }
    }
    if (compositeCanvas) {
      try {
        const originalSide = isBackSide;
        const captures: { [key: string]: string } = {};
        if (isBackSide) {
          flipCanvas();
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
        captures.front = compositeCanvas.toDataURL("image/png");
        flipCanvas();
        await new Promise((resolve) => setTimeout(resolve, 800));
        captures.back = compositeCanvas.toDataURL("image/png");
        if (!originalSide) {
          flipCanvas();
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
        await Promise.all([
          setItem(
            `compositeCanvasCapture_${currentTemplate?.templateId}_front`,
            captures.front,
            "composite"
          ),
          setItem(
            `compositeCanvasCapture_${currentTemplate?.templateId}_back`,
            captures.back,
            "composite"
          ),
        ]);
      } catch (error) {}
    }
    const [compositeImages, childrenCanvasData] = await Promise.all([
      collectCompositeImages(currentTemplate?.templateId!, getItem),
      collectChildrenCanvasData(currentTemplate!, getItem),
    ]);
    addToCart({
      designId: currentDesign?.id,
      designName: currentDesign?.name,
      template: {
        name: selectedTemplate.name,
        type: selectedTemplate.template_type as
          | "hoodie"
          | "shirt"
          | "poster"
          | "sticker",
        image: selectedTemplate.image,
      },
      layer: currentTemplate!,
      fulfillmentSelection,
      unitPrice: calculateTotal,
      compositeImages,
      childrenCanvasData,
    });
    resetFulfillmentSelection();
    navigate("/Purchase");
  };
  const filteredMaterials = selectedTemplate
    ? MATERIALS.filter(
        (material) =>
          material.type ===
          getMaterialTypeForTemplate(selectedTemplate.template_type)
      )
    : MATERIALS;
    
  if (!selectedLayer) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-satB text-white tracking-wider mb-4">
            FULFILLMENT
          </h2>
          <p className="text-red-400 font-mana text-sm">
            No layer selected. Please go to Layer page and select a layer first.
          </p>
        </div>
        <PageNavigation currentPage="/Fulfillment" />
      </div>
    );
  }
  return (
    <div className="relative w-full h-full flex flex-col p-6 bg-black overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-lg font-satB text-white tracking-wider mb-2">
          FULFILLMENT SETUP
        </h2>
        {currentDesign && (
          <p className="text-ama font-mana text-xxxs mb-2">
            Project: {currentDesign.name}
          </p>
        )}
        <p className="text-white font-mana text-xxxs mb-4">
          Configure your fulfillment options for {selectedTemplate?.name} - TID-
          {currentTemplate?.templateId}
        </p>
        <div className="bg-ama/20 border border-ama rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-white font-satB text-sm">TOTAL PRICE:</span>
            <span className="text-ama font-satB text-lg">
              ${formatPrice(calculateTotal)}
            </span>
          </div>
          <div className="text-white font-mana text-xxxs mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span>
                ${formatPrice(parseFloat(currentTemplate?.price!) / 1e18)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                Children ({(currentTemplate?.childReferences || []).length}):
              </span>
              <span>
                $
                {formatPrice(
                  (currentTemplate?.childReferences || []).reduce(
                    (sum, child) => sum + parseFloat(child.price) / 1e18,
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Material:</span>
              <span>
                +${formatPrice(fulfillmentSelection.material?.price || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-8 pb-20">
        <div className="bg-oscuro border border-oscurazul rounded-lg p-6">
          <h3 className="text-white font-satB text-base mb-4 flex items-center">
            <span className="bg-ama text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">
              1
            </span>
            CHOOSE FULFILLER
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FULFILLERS.map((fulfiller, index) => (
              <div
                key={index}
                onClick={() => selectFulfiller(fulfiller)}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                  fulfillmentSelection.fulfiller?.title === fulfiller.title
                    ? "border-ama bg-ama/10"
                    : "border-gray-600 bg-gray-800"
                }`}
              >
                <div className="text-center">
                  <img
                    className="w-16 h-16 mx-auto mb-3 rounded-lg object-cover"
                    src={`${INFURA_GATEWAY}/ipfs/${
                      fulfiller.uri.split("ipfs://")[1]
                    }`}
                    alt={fulfiller.title}
                    draggable={false}
                  />
                  <h4 className="text-white font-satB text-sm mb-1">
                    {fulfiller.title}
                  </h4>
                  <p className="text-gray-400 font-mana text-xxxs">
                    Premium Fulfillment
                  </p>
                </div>
                {fulfillmentSelection.fulfiller?.title === fulfiller.title && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-ama rounded-full flex items-center justify-center">
                    <span className="text-black text-xs">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {fulfillmentSelection.fulfiller && (
          <div className="bg-oscuro border border-oscurazul rounded-lg p-6">
            <h3 className="text-white font-satB text-base mb-4 flex items-center">
              <span className="bg-ama text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                2
              </span>
              SELECT BASE COLOR
            </h3>
            <p className="text-gray-400 font-mana text-xs mb-4">
              Choose the base template color for production
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {BASE_COLORS.map((color, index) => (
                <div
                  key={index}
                  onClick={() => selectBaseColor(color)}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                    fulfillmentSelection.baseColor === color
                      ? "border-ama bg-ama/10"
                      : "border-gray-600 bg-gray-800"
                  }`}
                >
                  <div className="text-center">
                    <div
                      className="w-12 h-12 mx-auto mb-2 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-white font-sat text-xs">
                      {getColorName(color)}
                    </p>
                  </div>
                  {fulfillmentSelection.baseColor === color && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-ama rounded-full flex items-center justify-center">
                      <span className="text-black text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {fulfillmentSelection.fulfiller && fulfillmentSelection.baseColor && (
          <div className="bg-oscuro border border-oscurazul rounded-lg p-6">
            <h3 className="text-white font-satB text-base mb-4 flex items-center">
              <span className="bg-ama text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                3
              </span>
              SELECT MATERIAL
            </h3>
            <p className="text-gray-400 font-mana text-xs mb-4">
              Choose material type and quality level
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map((material, index) => (
                <div
                  key={index}
                  onClick={() => selectMaterial(material)}
                  className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:scale-102 ${
                    fulfillmentSelection.material?.title === material.title
                      ? "border-ama bg-ama/10"
                      : "border-gray-600 bg-gray-800"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-satB text-sm mb-1">
                        {material.title}
                      </h4>
                      <p className="text-gray-400 font-mana text-xs mb-2">
                        {material.description}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <span
                        className={`font-satB text-sm ${
                          material.price === 0 ? "text-green-400" : "text-ama"
                        }`}
                      >
                        {material.price === 0
                          ? "BASE"
                          : `+$${formatPrice(material.price)}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {material.price >= 10 && (
                        <span className="bg-green-600 text-white text-xxxs px-2 py-1 rounded">
                          ECO-FRIENDLY
                        </span>
                      )}
                      {material.price === 0 && (
                        <span className="bg-blue-600 text-white text-xxxs px-2 py-1 rounded">
                          STANDARD
                        </span>
                      )}
                    </div>
                  </div>
                  {fulfillmentSelection.material?.title === material.title && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-ama rounded-full flex items-center justify-center">
                      <span className="text-black text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {fulfillmentSelection.fulfiller &&
          fulfillmentSelection.baseColor &&
          fulfillmentSelection.material && (
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-6">
              <h3 className="text-green-400 font-satB text-base mb-4">
                ✓ FULFILLMENT READY
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Fulfiller:</span>
                  <span className="text-white">
                    {fulfillmentSelection.fulfiller.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Color:</span>
                  <span className="text-white">
                    {fulfillmentSelection.baseColor
                      ? getColorName(fulfillmentSelection.baseColor)
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Material:</span>
                  <span className="text-white">
                    {fulfillmentSelection.material.title}
                  </span>
                </div>
                <div className="border-t border-gray-600 pt-2 mt-3">
                  <div className="flex justify-between text-lg mb-4">
                    <span className="text-white font-satB">TOTAL:</span>
                    <span className="text-ama font-satB">
                      ${formatPrice(calculateTotal)}
                    </span>
                  </div>
                  <button
                    onClick={handleProceedToPurchase}
                    className="w-full bg-ama hover:bg-ama/90 text-black font-satB text-sm py-3 px-4 rounded-lg transition-all hover:scale-105 active:scale-95"
                  >
                    PROCEED TO PURCHASE
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
      <PageNavigation currentPage="/Fulfillment" />
    </div>
  );
}
