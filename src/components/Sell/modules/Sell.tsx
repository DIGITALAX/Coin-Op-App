import { useTranslation } from "react-i18next";
import { useDesignContext } from "../../../context/DesignContext";
import { useSell } from "../hooks/useSell";

export default function Sell() {
  const { t } = useTranslation();
  const { currentDesign } = useDesignContext();
  const {
    handleCoinOpMarket,
    isProcessing,
    hasComposite,
    isCheckingComposite,
  } = useSell();

  if (!currentDesign) {
    return (
      <div className="relative w-full h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <h1 className="font-ark text-white text-lg tracking-wider mb-4">
                {t("sell")}
              </h1>
              <p className="font-agency text-rosa text-sm">
                {t("no_design_selected")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 overflow-y-auto">
        <div className="max-w-2xl justify-center items-center flex flex-col gap-8 py-8">
          <div className="space-y-4">
            <h1 className="font-ark text-white text-3xl tracking-wider mb-4">
              {t("sell")}
            </h1>
            <p className="font-agency text-crema text-lg mb-2">
              {t("project")}: {currentDesign.name}
            </p>
            <p className="font-agency text-white text-sm opacity-80">
              {t("sell_description")}
            </p>
          </div>

          <div className="space-y-8 w-full">
            <div className="space-y-4">
              <h2 className="font-agency text-white text-sm tracking-wider">
                {t("selling_options")}:
              </h2>

              <div className="space-y-6">
                <div className="text-left space-y-3">
                  <h3 className="font-agency text-white text-sm">
                    {t("coin_op_option")}
                  </h3>
                  <p className="font-dos text-white opacity-80 text-xs">
                    {t("coin_op_description")}
                  </p>
                  <div className="relative w-fit h-fit flex flex-row gap-2 items-center">
                    <div className="relative w-fit h-fit flex">
                      <img
                        draggable={false}
                        src="/images/arrow.png"
                        className="relative w-8 h-8 object-contain flex"
                      />
                    </div>
                    <button
                      onClick={handleCoinOpMarket}
                      disabled={
                        isProcessing || isCheckingComposite || !hasComposite
                      }
                      className={`relative whitespace-nowrap w-fit h-fit flex uppercase text-base justify-center text-center font-slim transition-colors ${
                        isCheckingComposite || !hasComposite
                          ? "text-crema cursor-not-allowed"
                          : isProcessing
                          ? "text-crema"
                          : "text-white hover:text-rosa"
                      }`}
                    >
                      <div className="relative w-fit h-fit z-10 flex">
                        {isCheckingComposite
                          ? t("loading")
                          : !hasComposite
                          ? t("complete_composite")
                          : isProcessing
                          ? t("sending")
                          : t("send_to_coin")}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="text-left space-y-3">
                  <h3 className="font-agency text-white text-sm">
                    {t("independent_option")}
                  </h3>
                  <p className="font-dos text-white opacity-80 text-xs">
                    {t("independent_description")}
                  </p>
                  <p className="font-dos text-crema text-xs">
                    {t("independent_assistance")}
                  </p>
                  <div className="relative w-fit h-fit flex flex-row gap-2 items-center">
                    <div className="relative w-fit h-fit flex">
                      <img
                        draggable={false}
                        src="/images/arrow.png"
                        className="relative w-8 h-8 object-contain flex"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const fgoUrl =
                          "https://fgo.themanufactory.xyz/account/";
                        import("@tauri-apps/plugin-opener").then(
                          ({ openUrl }) => {
                            openUrl(fgoUrl);
                          }
                        );
                      }}
                      className={`relative whitespace-nowrap w-fit h-fit flex uppercase text-base justify-center text-center font-slim transition-colors text-white hover:text-rosa`}
                    >
                      <div className="relative w-fit h-fit z-10 flex">
                        {t("create_with_fgo")}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-left space-y-3">
              <h2 className="font-agency text-white text-sm tracking-wider">
                {t("fulfillment_option")}:
              </h2>
              <p className="font-dos text-white opacity-80 text-xs">
                {t("fulfillment_description")}
              </p>
            </div>

            <div className="text-left space-y-3">
              <h2 className="font-agency text-amarillo text-sm tracking-wider">
                {t("important_notice")}:
              </h2>
              <p className="font-dos text-white opacity-80 text-xs">
                {t("listing_notice")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
