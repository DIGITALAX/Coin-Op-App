import { useState, useEffect, FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { PatternPiece } from "../types/pattern.types";
import { useApp } from "../../../context/AppContext";

export const PatternLibrary: FunctionComponent = () => {
  const { t } = useTranslation();
  const { selectedLayer } = useApp();
  const [loadedPatterns, setLoadedPatterns] = useState<PatternPiece[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const getGarmentType = (): "tshirt" | "hoodie" | null => {
    if (!selectedLayer?.front?.metadata?.tags) return null;
    const tags = selectedLayer.front.metadata.tags;
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower === "t-shirt" || tagLower === "shirt") return "tshirt";
      if (tagLower === "hoodie") return "hoodie";
    }
    return null;
  };

  const loadSVGDimensionsFromData = async (
    svgData: string
  ): Promise<{ width: number; height: number }> => {
    try {
      let svgText = svgData;

      if (svgData.startsWith("ipfs://") || svgData.startsWith("Qm")) {
        const ipfsUrl = svgData.startsWith("ipfs://")
          ? `https://thedial.infura-ipfs.io/ipfs/${svgData.replace(
              "ipfs://",
              ""
            )}`
          : `https://thedial.infura-ipfs.io/ipfs/${svgData}`;
        const response = await fetch(ipfsUrl);
        if (response.ok) {
          svgText = await response.text();
        } else {
          return { width: 100, height: 100 };
        }
      }

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
    } catch (error) {}
    return { width: 100, height: 100 };
  };

  const loadActualPatterns = async (garmentType: "tshirt" | "hoodie") => {
    setIsLoading(true);

    if (!selectedLayer) {
      setLoadedPatterns([]);
      setIsLoading(false);
      return;
    }

    try {
      const loadedPieces: PatternPiece[] = [];
      const seenPatterns = new Set<string>();

      const templatesWithPatterns = [
        selectedLayer.front,
        selectedLayer.back,
      ].filter(Boolean);

      for (const template of templatesWithPatterns) {
        if (!template?.childReferences) continue;

        const patternChildren = template.childReferences.filter((child: any) =>
          child.child?.metadata?.tags?.includes("pattern")
        );

        for (const child of patternChildren) {
          if (!child.child?.metadata?.image || !child.child?.metadata?.title)
            continue;

          const patternKey = `${child.child.metadata.title}-${child.child.metadata.image}`;
          if (seenPatterns.has(patternKey)) continue;
          seenPatterns.add(patternKey);

          const svgData = child.child.metadata.image;
          const dimensions = await loadSVGDimensionsFromData(svgData);
          const quantity = child.amount || 1;

          const piece: PatternPiece = {
            id:
              child.childId || `${child.child.metadata.title}-${Math.random()}`,
            name: child.child.metadata.title,
            garmentType,
            instructions: child.metadata.instructions,
            svgPath: svgData,
            widthMM: dimensions.width,
            heightMM: dimensions.height,
            seamAllowanceMM: child.metadata.seamAllowance,
            quantity,
          };
          loadedPieces.push(piece);
        }
      }

      setLoadedPatterns(loadedPieces);
    } catch (error) {
      setLoadedPatterns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const garmentType = getGarmentType();
    if (garmentType && selectedLayer) {
      loadActualPatterns(garmentType);
    }
  }, [selectedLayer]);

  const garmentType = getGarmentType();

  return (
    <div className="bg-black/20 rounded-lg p-2">
      <h3 className="text-white font-mana text-sm mb-4">
        {t("pattern_library")}
      </h3>
      {garmentType ? (
        <>
          <div className="w-full p-4 rounded border text-center bg-black/30 text-white border-white/20">
            <div className="text-xs font-mana">
              {garmentType === "tshirt" ? "T-SHIRT" : "HOODIE"} {t("pattern")}
            </div>
            <div className="text-xxxs mt-1">
              {isLoading
                ? t("loading")
                : `${loadedPatterns.length} ${t("pieces_loaded")}`}
              {loadedPatterns.length > 0 && (
                <span className="text-verde ml-1">✓</span>
              )}
            </div>
          </div>
          <div className="mt-4 p-3 bg-black/30 rounded">
            <h4 className="text-white/70 text-xs mb-2">
              {t("pattern_pieces")}
            </h4>
            {loadedPatterns.length > 0 ? (
              loadedPatterns.map((piece) => (
                <div key={piece.id} className="text-white/60 text-xxxs mb-1">
                  • {piece.name} (x{piece.quantity})
                  <span className="text-white/40 ml-1">
                    {Math.round(piece.widthMM)}×{Math.round(piece.heightMM)}mm
                  </span>
                </div>
              ))
            ) : (
              <div className="text-white/40 text-xxxs">
                {t("no_pattern_pieces")}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-white/50 text-center py-8">
          <div className="text-sm mb-2">{t("pattern_library")}</div>
          <div className="text-xs">{t("select_garment_template_first")}</div>
        </div>
      )}
    </div>
  );
};
