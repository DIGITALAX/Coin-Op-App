import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { DesignProvider } from "./context/DesignContext";
import { CartProvider } from "./context/CartContext";
import { LibraryProvider } from "./context/LibraryContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./i18n";
import "./App.css";
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <DesignProvider>
        <CartProvider>
          <LibraryProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </LibraryProvider>
        </CartProvider>
      </DesignProvider>
    </AppProvider>
  </React.StrictMode>,
);
