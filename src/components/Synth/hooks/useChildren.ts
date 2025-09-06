import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import { getCurrentTemplate } from "../utils/templateHelpers";

const useChildren = () => {
  const { selectedLayer, selectedPatternChild, setSelectedPatternChild, isBackSide } =
    useApp();
  
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const [visibleStartIndex, setVisibleStartIndex] = useState<number>(0);
  const navigateChild = (direction: "prev" | "next") => {
    if (!currentTemplate?.childReferences) return;
    
    const filteredChildren = currentTemplate.childReferences.filter((child) => {
      return child.child.metadata.tags.includes("zone");
    });
    
    const currentIndex = filteredChildren.findIndex(
      (child) => child.uri === selectedPatternChild?.uri
    );
    if (currentIndex === -1) return;
    
    const newIndex =
      direction === "next"
        ? (currentIndex + 1) % filteredChildren.length
        : (currentIndex - 1 + filteredChildren.length) %
          filteredChildren.length;
          
    setSelectedPatternChild(filteredChildren[newIndex]);
    
    if (filteredChildren.length > 3) {
      if (newIndex === 0) {
        setVisibleStartIndex(filteredChildren.length - 2);
      } else if (newIndex === 1) {
        setVisibleStartIndex(filteredChildren.length - 1);
      } else {
        setVisibleStartIndex(newIndex - 1);
      }
    }
  };
  const getVisibleChildren = () => {
    if (!currentTemplate?.childReferences) return [];
    
    const filteredChildren = currentTemplate.childReferences.filter((child) => {

      return child.child.metadata.tags.includes("zone");
    });
    
    if (filteredChildren.length <= 3) return filteredChildren;
    
    return Array(3)
      .fill(null)
      .map(
        (_, index) =>
          filteredChildren[
            (visibleStartIndex + index) % filteredChildren.length
          ]
      );
  };
  return {
    getVisibleChildren,
    navigateChild,
  };
};
export default useChildren;
