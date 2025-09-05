import { useState, useEffect, useCallback } from "react";
import { useFileStorage } from "../../Activity/hooks/useFileStorage";
const useWallet = () => {
  const { setItem, getItem } = useFileStorage();
  const [privateKey, setPrivateKey] = useState<string>("");
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const generateEncryptionKey = async (): Promise<CryptoKey> => {
    const deviceInfo = navigator.userAgent + navigator.language + screen.width + screen.height;
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(deviceInfo.slice(0, 32).padEnd(32, '0')),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode("coinop-wallet-salt"),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  };
  const encryptKey = async (key: string): Promise<string> => {
    try {
      const cryptoKey = await generateEncryptionKey();
      const iv = crypto.getRandomValues(new Uint8Array(12)); 
      const encodedKey = new TextEncoder().encode(key);
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        encodedKey
      );
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      throw new Error("Encryption failed");
    }
  };
  const decryptKey = async (encryptedKey: string): Promise<string> => {
    try {
      const cryptoKey = await generateEncryptionKey();
      const combined = new Uint8Array(
        atob(encryptedKey).split('').map(char => char.charCodeAt(0))
      );
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        encryptedData
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      throw new Error("Decryption failed");
    }
  };
  useEffect(() => {
    const loadPrivateKey = async () => {
      try {
        setIsLoading(true);
        const saved = await getItem<string>("private-wallet-key", "");
        if (saved && typeof saved === 'string') {
          const decrypted = await decryptKey(saved);
          setPrivateKey(decrypted);
        }
      } catch (error) {
        try {
          await setItem("private-wallet-key", "");
        } catch (clearError) {
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadPrivateKey();
  }, [getItem, setItem]);
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        if (privateKey) {
          const encrypted = await encryptKey(privateKey);
          await setItem("private-wallet-key", encrypted);
        } else {
          await setItem("private-wallet-key", "");
        }
      } catch (error) {
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [privateKey, setItem]);
  const handlePrivateKeyChange = useCallback((value: string) => {
    setPrivateKey(value);
  }, []);
  const toggleShowPrivateKey = useCallback(() => {
    setShowPrivateKey((prev) => !prev);
  }, []);
  const clearPrivateKey = useCallback(() => {
    setPrivateKey("");
  }, []);
  return {
    privateKey,
    showPrivateKey,
    isLoading,
    handlePrivateKeyChange,
    toggleShowPrivateKey,
    clearPrivateKey,
  };
};
export default useWallet;