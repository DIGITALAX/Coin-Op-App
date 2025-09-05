import { useState, useEffect, FunctionComponent } from "react";
import {
  PatternPiece,
  PatternLibraryProps,
  Size,
  calculateScaleFactor,
  UNISEX_T_SHIRT_SIZING,
  UNISEX_HOODIE_SIZING,
} from "../types/pattern.types";

export const PatternLibrary: FunctionComponent<PatternLibraryProps> = ({
  onSelectPieces,
  onSizeChange,
  templateType,
}) => {
  const [selectedSize, setSelectedSize] = useState<Size>("M");
  const [loadedPatterns, setLoadedPatterns] = useState<PatternPiece[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const getGarmentType = (): "tshirt" | "hoodie" | null => {
    if (templateType === "shirt") return "tshirt";
    if (templateType === "hoodie") return "hoodie";
    return null;
  };
  const loadSVGDimensions = async (
    svgPath: string
  ): Promise<{ width: number; height: number }> => {
    try {
      const publicPath = svgPath.replace("/src/assets/", "/");
      const response = await fetch(publicPath);
      if (response.ok) {
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");
        if (svgElement) {
          const viewBox = svgElement.getAttribute("viewBox");
          if (viewBox) {
            const [, , width, height] = viewBox.split(" ").map(Number);
            return { width, height };
          }
          const width = parseFloat(svgElement.getAttribute("width") || "0");
          const height = parseFloat(svgElement.getAttribute("height") || "0");
          return { width, height };
        }
      }
    } catch (error) {}
    return { width: 100, height: 100 };
  };
  const loadActualPatterns = async (garmentType: "tshirt" | "hoodie") => {
    setIsLoading(true);
    const patternDefinitions =
      garmentType === "tshirt"
        ? [
            {
              id: "tshirt-front",
              name: "T-Shirt Front",
              svgPath: "/patterns/tshirt/front.svg",
              category: "body",
              seamAllowanceMM: 10,
              grainDirection: "lengthwise" as const,
              quantity: 1,
            },
            {
              id: "tshirt-back",
              name: "T-Shirt Back",
              svgPath: "/patterns/tshirt/back.svg",
              category: "body",
              seamAllowanceMM: 10,
              grainDirection: "lengthwise" as const,
              quantity: 1,
            },
            {
              id: "tshirt-sleeve-left",
              name: "Left Sleeve",
              svgPath: "/patterns/tshirt/sleeve_left.svg",
              category: "sleeve",
              seamAllowanceMM: 10,
              grainDirection: "crosswise" as const,
              quantity: 1,
            },
            {
              id: "tshirt-sleeve-right",
              name: "Right Sleeve",
              svgPath: "/patterns/tshirt/sleeve_right.svg",
              category: "sleeve",
              seamAllowanceMM: 10,
              grainDirection: "crosswise" as const,
              quantity: 1,
            },
            {
              id: "tshirt-neckbinding",
              name: "Neck Binding",
              svgPath: "/patterns/tshirt/neckbinding.svg",
              category: "trim",
              seamAllowanceMM: 6,
              grainDirection: "crosswise" as const,
              quantity: 1,
            },
          ]
        : [];
    try {
      const loadedPieces: PatternPiece[] = [];
      for (const def of patternDefinitions) {
        const dimensions = await loadSVGDimensions(def.svgPath);
        const piece: PatternPiece = {
          id: def.id,
          name: def.name,
          garmentType,
          category: def.category as any,
          svgPath: def.svgPath,
          widthMM: dimensions.width,
          heightMM: dimensions.height,
          seamAllowanceMM: def.seamAllowanceMM,
          grainDirection: def.grainDirection,
          quantity: def.quantity,
        };
        loadedPieces.push(piece);
      }
      setLoadedPatterns(loadedPieces);
    } catch (error) {
      setLoadedPatterns(mockTShirtPieces);
    } finally {
      setIsLoading(false);
    }
  };
  const mockTShirtPieces: PatternPiece[] = [
    {
      id: "tshirt-front",
      name: "T-Shirt Front",
      garmentType: "tshirt",
      category: "body",
      svgPath: "/patterns/tshirt/front.svg",
      widthMM: 480,
      heightMM: 650,
      seamAllowanceMM: 10,
      grainDirection: "lengthwise",
      quantity: 1,
    },
    {
      id: "tshirt-back",
      name: "T-Shirt Back",
      garmentType: "tshirt",
      category: "body",
      svgPath: "/patterns/tshirt/back.svg",
      widthMM: 480,
      heightMM: 650,
      seamAllowanceMM: 10,
      grainDirection: "lengthwise",
      quantity: 1,
    },
    {
      id: "tshirt-sleeve-left",
      name: "Left Sleeve",
      garmentType: "tshirt",
      category: "sleeve",
      svgPath: "/patterns/tshirt/sleeve_left.svg",
      widthMM: 280,
      heightMM: 220,
      seamAllowanceMM: 10,
      grainDirection: "crosswise",
      quantity: 1,
    },
    {
      id: "tshirt-sleeve-right",
      name: "Right Sleeve",
      garmentType: "tshirt",
      category: "sleeve",
      svgPath: "/patterns/tshirt/sleeve_right.svg",
      widthMM: 280,
      heightMM: 220,
      seamAllowanceMM: 10,
      grainDirection: "crosswise",
      quantity: 1,
    },
    {
      id: "tshirt-neckbinding",
      name: "Neck Binding",
      garmentType: "tshirt",
      category: "trim",
      svgPath: "/patterns/tshirt/neckbinding.svg",
      widthMM: 600,
      heightMM: 40,
      seamAllowanceMM: 6,
      grainDirection: "crosswise",
      quantity: 1,
    },
  ];
  const mockHoodiePieces: PatternPiece[] = [
    {
      id: "hoodie-front",
      name: "Hoodie Front",
      garmentType: "hoodie",
      category: "body",
      svgPath: "/assets/patterns/hoodie/front.svg",
      widthMM: 520,
      heightMM: 720,
      seamAllowanceMM: 10,
      grainDirection: "lengthwise",
      quantity: 2,
    },
    {
      id: "hoodie-back",
      name: "Hoodie Back",
      garmentType: "hoodie",
      category: "body",
      svgPath: "/assets/patterns/hoodie/back.svg",
      widthMM: 520,
      heightMM: 720,
      seamAllowanceMM: 10,
      grainDirection: "lengthwise",
      quantity: 1,
    },
    {
      id: "hoodie-sleeve",
      name: "Hoodie Sleeve",
      garmentType: "hoodie",
      category: "sleeve",
      svgPath: "/assets/patterns/hoodie/sleeve.svg",
      widthMM: 380,
      heightMM: 600,
      seamAllowanceMM: 10,
      grainDirection: "lengthwise",
      quantity: 2,
    },
    {
      id: "hoodie-hood",
      name: "Hood",
      garmentType: "hoodie",
      category: "hood",
      svgPath: "/assets/patterns/hoodie/hood.svg",
      widthMM: 360,
      heightMM: 280,
      seamAllowanceMM: 10,
      grainDirection: "lengthwise",
      quantity: 2,
    },
    {
      id: "hoodie-pocket",
      name: "Kangaroo Pocket",
      garmentType: "hoodie",
      category: "pocket",
      svgPath: "/assets/patterns/hoodie/pocket.svg",
      widthMM: 320,
      heightMM: 200,
      seamAllowanceMM: 10,
      grainDirection: "crosswise",
      quantity: 1,
    },
  ];
  const getScaledPatternPieces = (): PatternPiece[] => {
    const garmentType = getGarmentType();
    if (!garmentType) return [];
    const basePieces =
      loadedPatterns.length > 0
        ? loadedPatterns
        : garmentType === "tshirt"
        ? mockTShirtPieces
        : mockHoodiePieces;
    const scaleFactor = calculateScaleFactor(selectedSize, garmentType);
    return basePieces.map((piece) => ({
      ...piece,
      widthMM: piece.widthMM * scaleFactor.width,
      heightMM: piece.heightMM * scaleFactor.height,
    }));
  };

  useEffect(() => {
    const garmentType = getGarmentType();
    if (garmentType) {
      loadActualPatterns(garmentType);
    }
  }, [templateType]);

  useEffect(() => {
    const scaledPieces = getScaledPatternPieces();
    if (scaledPieces.length > 0) {
      onSelectPieces(scaledPieces, selectedSize);
    }
  }, [templateType, onSelectPieces, loadedPatterns]);
  useEffect(() => {
    if (getGarmentType() && onSizeChange) {
      const scaledPieces = getScaledPatternPieces();
      if (scaledPieces.length > 0) {
        onSizeChange(scaledPieces, selectedSize);
      }
    }
  }, [selectedSize, onSizeChange]);
  const garmentType = getGarmentType();
  
  return (
    <div className="p-6 bg-black/20 rounded-lg">
      <h3 className="text-white font-mana text-sm mb-4">Pattern Library</h3>
      {garmentType ? (
        <>
          <div className="mb-4">
            <label className="block text-white/70 text-xs mb-2">Size</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value as Size)}
              className="bg-black/40 text-white border border-white/20 rounded p-2 text-xs"
            >
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M (Base)</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="XXXL">XXXL</option>
            </select>
            <div className="mt-2 p-2 bg-black/30 rounded text-xxxs text-white/60">
              {garmentType && (
                <div>
                  Chest:{" "}
                  {Math.round(
                    ((garmentType === "tshirt"
                      ? UNISEX_T_SHIRT_SIZING
                      : UNISEX_HOODIE_SIZING)[selectedSize].chest *
                      2) /
                      25.4
                  )}
                  "{" • "}Length:{" "}
                  {Math.round(
                    (garmentType === "tshirt"
                      ? UNISEX_T_SHIRT_SIZING
                      : UNISEX_HOODIE_SIZING)[selectedSize].length / 25.4
                  )}
                  "
                </div>
              )}
            </div>
          </div>
          <div className="w-full p-4 rounded border text-center bg-black/30 text-white border-white/20">
            <div className="text-xs font-mana">
              {garmentType === "tshirt" ? "T-SHIRT" : "HOODIE"} PATTERN
            </div>
            <div className="text-xxxs mt-1">
              {isLoading
                ? "Loading..."
                : `${loadedPatterns.length} pieces loaded`}
              {loadedPatterns.length > 0 && (
                <span className="text-verde ml-1">✓</span>
              )}
            </div>
          </div>
          <div className="mt-4 p-3 bg-black/30 rounded">
            <h4 className="text-white/70 text-xs mb-2">Pattern Pieces:</h4>
            {(loadedPatterns.length > 0
              ? loadedPatterns
              : garmentType === "tshirt"
              ? mockTShirtPieces
              : mockHoodiePieces
            ).map((piece) => (
              <div key={piece.id} className="text-white/60 text-xxxs mb-1">
                • {piece.name} (x{piece.quantity})
                {loadedPatterns.length > 0 && (
                  <span className="text-white/40 ml-1">
                    {Math.round(piece.widthMM)}×{Math.round(piece.heightMM)}mm
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-white/50 text-center py-8">
          <div className="text-sm mb-2">Pattern Library</div>
          <div className="text-xs">Select a garment template first</div>
        </div>
      )}
    </div>
  );
};
