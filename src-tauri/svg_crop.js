#!/usr/bin/env node

async function cropSvgToA4Tiles(svgString, canvasWidthPt, canvasHeightPt) {
  const A4_WIDTH_PT = 595;
  const A4_HEIGHT_PT = 842;

  if (canvasWidthPt <= A4_WIDTH_PT && canvasHeightPt <= A4_HEIGHT_PT) {
    return [svgString];
  }

  const cols = Math.ceil(canvasWidthPt / A4_WIDTH_PT);
  const rows = Math.ceil(canvasHeightPt / A4_HEIGHT_PT);

  try {
    const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
    if (!viewBoxMatch) {
      throw new Error("No viewBox found in original SVG");
    }

    const [origX, origY, origWidth, origHeight] = viewBoxMatch[1]
      .split(/[\s,]+/)
      .map(parseFloat);

    const svgUnitsPerPtX = origWidth / canvasWidthPt;
    const svgUnitsPerPtY = origHeight / canvasHeightPt;

    const A4_WIDTH_SVG = A4_WIDTH_PT * svgUnitsPerPtX;
    const A4_HEIGHT_SVG = A4_HEIGHT_PT * svgUnitsPerPtY;

    const svgContentMatch = svgString.match(/<svg[^>]*>(.*)<\/svg>/s);
    if (!svgContentMatch) {
      throw new Error("Could not extract SVG content");
    }

    const originalContent = svgContentMatch[1];

    const tilesSvgs = [];

    let pageNumber = 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileX = origX + col * A4_WIDTH_SVG;
        const tileY = origY + row * A4_HEIGHT_SVG;

        const centerX = tileX + A4_WIDTH_SVG / 2;
        const centerY = tileY + A4_HEIGHT_SVG / 2;

        const gridCol = col + 1;
        const gridRow = row + 1;

        const tileSvg = `<svg width="${A4_WIDTH_PT}pt" height="${A4_HEIGHT_PT}pt" viewBox="${tileX} ${tileY} ${A4_WIDTH_SVG} ${A4_HEIGHT_SVG}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="a4-tile-clip">
      <rect x="${tileX}" y="${tileY}" width="${A4_WIDTH_SVG}" height="${A4_HEIGHT_SVG}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#a4-tile-clip)">
    ${originalContent}
  </g>
  <!-- Page number and grid coordinates -->
  <text x="${centerX}" y="${
          centerY - 20
        }" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="red" fill-opacity="0.5">
    Page ${pageNumber}
  </text>
  <text x="${centerX}" y="${
          centerY + 30
        }" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="blue" fill-opacity="0.5">
    (${gridCol},${gridRow})
  </text>
</svg>`;

        tilesSvgs.push(tileSvg);
        pageNumber++;
      }
    }

    return tilesSvgs;
  } catch (error) {
    throw error;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    process.exit(1);
  }

  const [svgString, canvasWidthPt, canvasHeightPt] = args;

  cropSvgToA4Tiles(
    svgString,
    parseFloat(canvasWidthPt),
    parseFloat(canvasHeightPt)
  )
    .then((tiles) => {
      console.log(JSON.stringify(tiles));
    })
    .catch((error) => {
      console.error("Error:", error.message);
      process.exit(1);
    });
}

module.exports = { cropSvgToA4Tiles };
