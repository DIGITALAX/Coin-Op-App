import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Walkthrough } from "../types/common.types";
import { pageMap } from "../../../lib/constants";
import { useDesignContext } from "../../../context/DesignContext";

export default function usePageNavigation(currentPage: string) {
  const navigate = useNavigate();
  const { currentDesign } = useDesignContext();
  const hasActiveProject = currentDesign !== null;
  
  const restrictedPages = ["/Synth", "/Pattern", "/Composite", "/Fulfill", "/Sell"];
  
  const isPageAccessible = (page: string) => {
    return !restrictedPages.includes(page) || hasActiveProject;
  };
  
  const currentIndex = Object.keys(Walkthrough).findIndex(
    (page) => pageMap[page] === currentPage
  );
  
  let prevPage = null;
  if (currentIndex > 0) {
    const candidatePage = pageMap[Object.keys(Walkthrough)[currentIndex - 1]];
    if (isPageAccessible(candidatePage)) {
      prevPage = candidatePage;
    }
  }
  
  let nextPage = null;
  if (currentIndex < Object.keys(Walkthrough).length - 1) {
    const candidatePage = pageMap[Object.keys(Walkthrough)[currentIndex + 1]];
    if (isPageAccessible(candidatePage)) {
      nextPage = candidatePage;
    }
  }
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && prevPage) {
        navigate(prevPage);
      } else if (event.key === "ArrowRight" && nextPage) {
        navigate(nextPage);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, prevPage, nextPage]);
  return {
    prevPage,
    nextPage,
  };
}
