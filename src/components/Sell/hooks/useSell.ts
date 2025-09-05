import { useState } from "react";
import { Market, UseSellReturn } from "../types/sell.types";
import { Design } from "../../Design/types/design.types";

export const useSell = (): UseSellReturn => {
  const [selectedProject, setSelectedProject] = useState<Design | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const handleSellProject = (project: Design) => {
    setSelectedProject(project);
    setShowMarketSelector(true);
  };
  const handleMarketSelection = (market: Market) => {
    setSelectedMarket(market);
    setShowMarketSelector(false);
    alert(`Project "${selectedProject?.name}" submitted to ${market.title} market!`);
    setSelectedProject(null);
    setSelectedMarket(null);
  };
  const cancelSell = () => {
    setSelectedProject(null);
    setSelectedMarket(null);
    setShowMarketSelector(false);
  };
  return {
    selectedProject,
    selectedMarket,
    setSelectedProject,
    setSelectedMarket,
    showMarketSelector,
    setShowMarketSelector,
    handleSellProject,
    handleMarketSelection,
    cancelSell
  };
};