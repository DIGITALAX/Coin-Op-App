import { createContext, useContext, useState, useEffect } from "react";

import {
  writeTextFile,
  readTextFile,
  exists,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import {
  CartContextType,
  CartItem,
  CartProviderProps,
} from "../components/Common/types/common.types";

const CartContext = createContext<CartContextType | undefined>(undefined);
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

const CART_FILE_PATH = "global-cart.json";
const loadGlobalCart = async (): Promise<CartItem[]> => {
  try {
    const fileExists = await exists(CART_FILE_PATH, {
      baseDir: BaseDirectory.AppData,
    });
    if (!fileExists) {
      return [];
    }
    const cartData = await readTextFile(CART_FILE_PATH, {
      baseDir: BaseDirectory.AppData,
    });
    const parsedCart = JSON.parse(cartData);
    if (Array.isArray(parsedCart)) {
      const items = parsedCart.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
      return items;
    }
    return [];
  } catch (error) {
    return [];
  }
};
const saveGlobalCart = async (cartItems: CartItem[]): Promise<void> => {
  try {
    await writeTextFile(CART_FILE_PATH, JSON.stringify(cartItems, null, 2), {
      baseDir: BaseDirectory.AppData,
    });
  } catch (error) {}
};
export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    const loadCart = async () => {
      const savedCart = await loadGlobalCart();
      setCartItems(savedCart);
      setIsInitialized(true);
    };
    loadCart();
  }, []);
  useEffect(() => {
    if (isInitialized) {
      saveGlobalCart(cartItems);
    }
  }, [cartItems, isInitialized]);
  const addToCart = (item: Omit<CartItem, "id" | "timestamp" | "quantity">) => {
    const newItem: CartItem = {
      ...item,
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      quantity: 1,
      timestamp: new Date(),
    };
    setCartItems((prev) => [...prev, newItem]);
  };
  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };
  const removeByDesignId = (designId: string) => {
    setCartItems((prev) => prev.filter((item) => item.designId !== designId));
  };
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1 || quantity > 100) return;
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };
  const clearCart = () => {
    setCartItems([]);
  };
  const getCartTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  };
  const getCartItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        removeByDesignId,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
