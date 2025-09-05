import useWallet from "../hooks/useWallet";
import PageNavigation from "../../Common/modules/PageNavigation";
export default function Account() {
  const {
    privateKey,
    showPrivateKey,
    isLoading,
    handlePrivateKeyChange,
    toggleShowPrivateKey,
    clearPrivateKey,
  } = useWallet();
  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-black">
      <div className="mb-6">
        <h2 className="text-lg font-satB text-white tracking-wider mb-2">
          ACCOUNT SETTINGS
        </h2>
        <p className="text-gray-400 font-mana text-xxxs">
          Manage your private keys and account preferences
        </p>
      </div>
      <div className="flex-1 overflow-y-scroll">
        <div className="max-w-2xl">
          <div className="border border-gray-600 rounded-lg p-6 bg-gray-800 mb-6">
            <h3 className="text-white font-satB text-sm mb-4">
              Private Wallet Key
            </h3>
            <p className="text-gray-400 text-xs mb-4">
              Store your private wallet key securely. This key is encrypted and
              stored locally on your device.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-sat text-gray-400 mb-2">
                  Private Key
                </label>
                <div className="relative">
                  <input
                    type={showPrivateKey ? "text" : "password"}
                    value={privateKey}
                    onChange={(e) => handlePrivateKeyChange(e.target.value)}
                    placeholder="Enter your private wallet key..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded font-mono text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none pr-20"
                    disabled={isLoading}
                  />
                  <button
                    onClick={toggleShowPrivateKey}
                    className="absolute right-2 top-2 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                    disabled={isLoading}
                  >
                    {showPrivateKey ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {isLoading ? (
                      "Loading..."
                    ) : privateKey ? (
                      <>
                        <span className="text-green-400">●</span> Key stored
                        securely
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400">●</span> No key stored
                      </>
                    )}
                  </p>
                  {privateKey && !isLoading && (
                    <button
                      onClick={clearPrivateKey}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear Key
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 text-sm">⚠️</span>
                  <div>
                    <p className="text-yellow-400 text-xs font-semibold mb-1">
                      Security Notice
                    </p>
                    <p className="text-yellow-300 text-xs">
                      Your private key is encrypted and stored locally on your
                      device. Never share your private key with anyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-gray-600 rounded-lg p-6 bg-gray-800">
            <h3 className="text-white font-satB text-sm mb-2">
              Additional Settings
            </h3>
            <p className="text-gray-400 text-xs">
              More settings options will be available here in future updates.
            </p>
          </div>
        </div>
      </div>
      <PageNavigation currentPage="/Account" />
    </div>
  );
}
