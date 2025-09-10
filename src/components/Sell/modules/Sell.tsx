import { useTranslation } from "react-i18next";
import PageNavigation from "../../Common/modules/PageNavigation";
import { useDesignContext } from "../../../context/DesignContext";
import { useSell } from "../hooks/useSell";

export default function Sell() {
  const { t } = useTranslation();
  const { currentDesign } = useDesignContext();
  const { handleCoinOpMarket, isProcessing, hasComposite, isCheckingComposite } = useSell();

  if (!currentDesign) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-satB text-white tracking-wider mb-4">
            {t("sell")}
          </h2>
          <p className="text-red-400 font-mana text-sm">
            {t("no_design_selected")}
          </p>
        </div>
        <PageNavigation currentPage="/Sell" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <h2 className="text-lg font-satB text-white tracking-wider mb-4">
              {t("sell")}
            </h2>
            <p className="text-ama font-mana text-xs mb-2">
              {t("project")}: {currentDesign.name}
            </p>
            <p className="text-white font-mana text-sm mb-8">
              {t("sell_description")}
            </p>
          </div>

          <div className="space-y-6">
            <div className="border border-ama rounded-md p-6">
              <h3 className="text-white font-satB text-sm mb-4 tracking-wider">
                {t("selling_options")}
              </h3>

              <div className="space-y-4">
                <div className="w-full border border-ama bg-black rounded-md p-6">
                  <div className="mb-4">
                    <h4 className="text-white font-satB text-base mb-2">
                      {t("coin_op_option")}
                    </h4>
                    <p className="text-white font-mana text-xs opacity-80 mb-3">
                      {t("coin_op_description")}
                    </p>
                  </div>
                  <button
                    onClick={handleCoinOpMarket}
                    disabled={isProcessing || isCheckingComposite || !hasComposite}
                    className={`w-full py-3 font-satB text-sm rounded transition-colors ${
                      isCheckingComposite || !hasComposite
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : isProcessing
                        ? "bg-gray-600 text-gray-400"
                        : "bg-ama hover:bg-ama/90 text-black"
                    }`}
                  >
                    {isCheckingComposite
                      ? t("loading")
                      : !hasComposite
                      ? t("complete_composite")
                      : isProcessing
                      ? t("sending")
                      : t("send_to_coin")}
                  </button>
                </div>

                <div className="border border-white/30 rounded-md p-6 bg-black/50">
                  <div className="mb-4">
                    <h4 className="text-white font-satB text-base mb-2">
                      {t("independent_option")}
                    </h4>
                    <p className="text-white font-mana text-xs opacity-80 mb-3">
                      {t("independent_description")}
                    </p>
                    <p className="text-gray-400 font-mana text-xs mb-4">
                      {t("independent_assistance")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const fgoUrl = "https://fgo.themanufactory.xyz/account/";
                      import("@tauri-apps/plugin-opener").then(
                        ({ openUrl }) => {
                          openUrl(fgoUrl);
                        }
                      );
                    }}
                    className="w-full py-3 bg-ama hover:bg-ama/90 text-black font-satB text-sm rounded transition-colors"
                  >
                    {t("create_with_fgo")}
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-ama rounded-md p-6">
              <h3 className="text-ama font-satB text-sm mb-4 tracking-wider">
                {t("fulfillment_option")}
              </h3>
              <p className="text-white font-mana text-xs mb-4">
                {t("fulfillment_description")}
              </p>
            </div>

            <div className="border border-yellow-500/50 rounded-md p-6 bg-yellow-500/5">
              <h3 className="text-yellow-400 font-satB text-sm mb-3 tracking-wider">
                {t("important_notice")}
              </h3>
              <p className="text-white font-mana text-xs">
                {t("listing_notice")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <PageNavigation currentPage="/Sell" />
    </div>
  );
}
