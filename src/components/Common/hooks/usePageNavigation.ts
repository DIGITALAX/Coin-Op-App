import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Walkthrough } from "../types/common.types";
import { pageMap } from "../../../lib/constants";
export default function usePageNavigation(currentPage: string) {
  const navigate = useNavigate();
  const currentIndex = Object.keys(Walkthrough).findIndex(
    (page) => pageMap[page] === currentPage
  );
  const prevPage =
    currentIndex > 0
      ? pageMap[Object.keys(Walkthrough)[currentIndex - 1]]
      : null;
  const nextPage =
    currentIndex < Object.keys(Walkthrough).length - 1
      ? pageMap[Object.keys(Walkthrough)[currentIndex + 1]]
      : null;
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
