import { SuccessPopupProps } from "../types/purchase.types";

export default function SuccessPopup({
  isVisible,
  purchaseResult,
  onClearCart,
  onDismiss,
}: SuccessPopupProps) {
  if (!isVisible || !purchaseResult) return null;
  const handleClearCart = () => {
    onClearCart();
    onDismiss();
  };
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-oscuro border border-ama rounded-lg p-8 max-w-md mx-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-ama rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-ama font-satB text-xl mb-2">
              Purchase Successful!
            </h2>
            <p className="text-white font-mana text-sm">
              Your order has been processed successfully.
            </p>
          </div>
          {purchaseResult.txHash && (
            <div className="bg-black/30 rounded-lg p-4 mb-6">
              <p className="text-gray-400 font-mana text-xs mb-1">
                Transaction Hash:
              </p>
              <p className="text-ama font-sat text-xs break-all">
                {purchaseResult.txHash}
              </p>
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={handleClearCart}
              className="w-full py-3 bg-ama hover:bg-ama/90 text-black font-satB text-base rounded transition-all hover:scale-105 active:scale-95"
            >
              Clear Cart & Continue
            </button>
            <button
              onClick={onDismiss}
              className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white font-sat text-sm rounded transition-colors"
            >
              Keep Cart Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}