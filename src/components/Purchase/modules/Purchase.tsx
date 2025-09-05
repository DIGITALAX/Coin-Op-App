import { useState, useEffect } from "react";
import { useCart } from "../../../context/CartContext";
import { INFURA_GATEWAY } from "../../../lib/constants";
import PageNavigation from "../../Common/modules/PageNavigation";
import { useDeepLinkHandler } from "../hooks/useDeepLinkHandler";
import { DesktopCartData, PAYMENT_METHODS } from "../types/purchase.types";
import { openUrl } from "@tauri-apps/plugin-opener";
import SuccessPopup from "./SuccessPopup";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useMarketContract } from "../hooks/useMarketContract";
import { collectChildrenCanvasData, collectCompositeImages } from "../../Composite/utils/collectCanvasData";

export default function Purchase() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } =
    useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentToken, setPaymentToken] = useState<"mona" | "wgho">("mona");
  const { purchaseResult, showSuccessPopup, dismissPopup } =
    useDeepLinkHandler();
  const { getItem } = useDesignStorage();
  const { loadConversionRates, conversionRates, isLoadingRates } = useMarketContract();
  const usdTotal = getCartTotal();
  const canCheckout = cartItems.length > 0;
  useEffect(() => {
    if (usdTotal > 0) {
      loadConversionRates(usdTotal);
    }
  }, [usdTotal, loadConversionRates]);
  const formatPrice = (price: number) => price.toFixed(2);
  const getColorName = (hexColor: string) => {
    const colorMap: { [key: string]: string } = {
      "#fff": "White",
      "#000": "Black",
      "#ff0000": "Red",
      "#00ff00": "Green",
      "#0000ff": "Blue",
    };
    return colorMap[hexColor.toLowerCase()] || hexColor;
  };
  const getFrontPatternThumbnail = (layer: any) => {
    const frontChild = layer.children.find(
      (child: any) => !child.location || child.location === "front"
    );
    return frontChild ? frontChild.uri : layer.uri;
  };
  const handleWebCheckout = async () => {
    if (!canCheckout) {
      return;
    }
    setIsProcessing(true);
    try {
      const updatedCartItems = await Promise.all(
        cartItems.map(async (item) => {
          const [latestCompositeImages, latestChildrenCanvasData] = await Promise.all([
            collectCompositeImages(item.layer.templateId, getItem),
            collectChildrenCanvasData(item.layer, getItem)
          ]);
          return {
            ...item,
            compositeImages: latestCompositeImages,
            childrenCanvasData: latestChildrenCanvasData
          };
        })
      );
      const cartData: DesktopCartData = {
        items: updatedCartItems,
        paymentToken,
        usdTotal,
        timestamp: Date.now(),
      };
      const webAppUrl =
        process.env.NODE_ENV === "production"
          ? "https://coinop.digitalax.xyz"
          : "http://localhost:3000";
      const response = await fetch(`${webAppUrl}/api/create-session/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify(cartData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 308) {
        }
        throw new Error(
          `Failed to create checkout session: ${response.status} ${errorText}`
        );
      }
      const result = await response.json();
      const sessionId = result.sessionId;
      const checkoutUrl = `${webAppUrl}/?sessionId=${sessionId}`;
      await openUrl(checkoutUrl);
    } catch (error: any) {
      const webAppUrl =
        process.env.NODE_ENV === "production"
          ? "https://coinop.digitalax.xyz"
          : "http://localhost:3000";
      try {
        const fallbackUrl = `${webAppUrl}/?fallback=true&token=${paymentToken}&total=${usdTotal}&items=${encodeURIComponent(
          JSON.stringify(cartItems)
        )}`;
        await openUrl(fallbackUrl);
      } catch (fallbackError) {
        alert(
          `Checkout failed: ${error.message}. Please ensure the web app is running on ${webAppUrl}`
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };
  if (cartItems.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-satB text-white tracking-wider mb-4">
            YOUR CART
          </h2>
          <div className="bg-oscuro border border-oscurazul rounded-lg p-8">
            <p className="text-gray-400 font-mana text-sm mb-4">
              Your cart is empty
            </p>
            <p className="text-white font-sat text-xs">
              Go to Fulfillment to add items to your cart
            </p>
          </div>
        </div>
        <PageNavigation currentPage="/Purchase" />
      </div>
    );
  }
  return (
    <div className="relative w-full h-full flex flex-col p-6 bg-black overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-lg font-satB text-white tracking-wider mb-2">
          YOUR CART
        </h2>
        <p className="text-white font-mana text-xxxs mb-4">
          Review your items and proceed to purchase
        </p>
      </div>
      <div className="flex-1 space-y-6 pb-20">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-oscuro border border-oscurazul rounded-lg p-6"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="relative w-24 h-24 lg:w-32 lg:h-32 bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
                    {item.compositeImages?.front ? (
                      <img
                        className="w-full h-full object-cover"
                        src={item.compositeImages.front}
                        alt="Composite design"
                        draggable={false}
                      />
                    ) : (
                      <>
                        <img
                          className="w-full h-full object-cover"
                          src={`${INFURA_GATEWAY}/ipfs/${
                            getFrontPatternThumbnail(item.layer).split("ipfs://")[1]
                          }`}
                          alt="Pattern thumbnail"
                          draggable={false}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img
                            className="w-full h-full object-contain"
                            src={`${INFURA_GATEWAY}/ipfs/${
                              item.layer.metadata.image.split("ipfs://")[1]
                            }`}
                            alt="Template"
                            draggable={false}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <h3 className="text-white font-satB text-base mb-2">
                        {item.template.name} - TID-{item.layer.templateId}
                      </h3>
                      {item.designName && (
                        <p className="text-ama font-mana text-xs mb-2">
                          Project: {item.designName}
                        </p>
                      )}
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fulfiller:</span>
                          <span className="text-white">
                            {item.fulfillmentSelection.fulfiller?.title}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Color:</span>
                          <span className="text-white">
                            {item.fulfillmentSelection.baseColor
                              ? getColorName(
                                  item.fulfillmentSelection.baseColor
                                )
                              : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Material:</span>
                          <span className="text-white">
                            {item.fulfillmentSelection.material?.title}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Unit Price:</span>
                          <span className="text-ama font-satB">
                            ${formatPrice(item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div className="space-y-3">
                        <div>
                          <label className="text-gray-400 font-mana text-xs mb-2 block">
                            Quantity (1-100)
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 1;
                                updateQuantity(
                                  item.id,
                                  Math.min(100, Math.max(1, qty))
                                );
                              }}
                              className="w-16 h-8 bg-gray-800 border border-gray-600 text-white text-center rounded font-satB text-sm"
                            />
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  Math.min(100, item.quantity + 1)
                                )
                              }
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-satB text-lg">
                            ${formatPrice(item.unitPrice * item.quantity)}
                          </div>
                          <div className="text-gray-400 font-mana text-xs">
                            {item.quantity} × ${formatPrice(item.unitPrice)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="mt-4 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                      >
                        Remove Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-oscuro border border-oscurazul rounded-lg p-6">
          <h3 className="text-white font-satB text-lg mb-4">PAYMENT METHOD</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.token}
                onClick={() => setPaymentToken(method.token)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  paymentToken === method.token
                    ? "border-ama bg-ama/20 text-ama"
                    : "border-gray-600 bg-gray-800 text-white hover:border-gray-500"
                }`}
              >
                <div className="text-center">
                  <div className="font-satB text-lg mb-1">{method.symbol}</div>
                  <div className="font-mana text-xs">{method.label}</div>
                  {conversionRates[method.token] && paymentToken === method.token && (
                    <div className="font-mana text-xxxs text-ama mt-1">
                      {conversionRates[method.token]!.tokenAmount} {method.token.toUpperCase()}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <p className="text-gray-400 font-mana text-xs mt-3">
            Payment will be processed on the web using{" "}
            {PAYMENT_METHODS.find((m) => m.token === paymentToken)?.label}.
            Shipping details will be collected during checkout.
          </p>
        </div>
        <div className="bg-ama/20 border border-ama rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-satB text-lg">ORDER TOTAL</h3>
            <div className="text-right">
              <div className="text-ama font-satB text-2xl">
                ${formatPrice(usdTotal)}
              </div>
              {conversionRates[paymentToken] && (
                <div className="text-ama font-satB text-lg">
                  {conversionRates[paymentToken]!.tokenAmount} {paymentToken.toUpperCase()}
                </div>
              )}
              {isLoadingRates && (
                <div className="text-gray-400 font-mana text-xs">
                  Loading conversion rate...
                </div>
              )}
              <div className="text-gray-400 font-mana text-xs">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
              </div>
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="text-white font-mana text-sm mb-2">
                Payment Method:{" "}
                {PAYMENT_METHODS.find((m) => m.token === paymentToken)?.label}
              </div>
              <div className="text-gray-400 font-mana text-xs">
                You'll complete the purchase in your web browser with wallet
                connection, shipping details, and final payment
              </div>
            </div>
          </div>
          <div className="border-t border-gray-600 pt-4 space-y-3">
            <button
              onClick={clearCart}
              className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white font-sat text-sm rounded transition-colors"
            >
              Clear Cart
            </button>
            <button
              onClick={handleWebCheckout}
              disabled={isProcessing || !canCheckout}
              className="w-full py-3 bg-ama hover:bg-ama/90 disabled:bg-gray-700 disabled:text-gray-400 text-black font-satB text-base rounded transition-all hover:scale-105 active:scale-95"
            >
              {isProcessing
                ? "OPENING CHECKOUT..."
                : `CHECKOUT ON WEB - ${formatPrice(usdTotal)} USD`}
            </button>
            <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-3">
              <p className="text-blue-400 font-mana text-xs text-center">
                Clicking "Checkout on Web" will open your browser to complete
                the purchase securely
              </p>
            </div>
          </div>
        </div>
      </div>
      <PageNavigation currentPage="/Purchase" />
      <SuccessPopup
        isVisible={showSuccessPopup}
        purchaseResult={purchaseResult}
        onClearCart={clearCart}
        onDismiss={dismissPopup}
      />
    </div>
  );
}
