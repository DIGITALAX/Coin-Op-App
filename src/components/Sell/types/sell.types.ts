import { Design } from "../../Design/types/design.types";

export interface Market {
  title: string;
  uri: string;
  address: string;
}

export interface UseSellReturn {
  selectedProject: Design | null;
  selectedMarket: Market | null;
  setSelectedProject: (project: Design | null) => void;
  setSelectedMarket: (market: Market | null) => void;
  showMarketSelector: boolean;
  setShowMarketSelector: (show: boolean) => void;
  handleSellProject: (project: Design) => void;
  handleMarketSelection: (market: Market) => void;
  cancelSell: () => void;
}