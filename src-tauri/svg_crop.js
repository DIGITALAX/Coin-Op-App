#!/usr/bin/env node

const { DOMParser } = require('xmldom');

const I = () => [1,0,0,1,0,0];
const mul = (m1,m2)=>[
  m1[0]*m2[0]+m1[2]*m2[1],
  m1[1]*m2[0]+m1[3]*m2[1],
  m1[0]*m2[2]+m1[2]*m2[3],
  m1[1]*m2[2]+m1[3]*m2[3],
  m1[0]*m2[4]+m1[2]*m2[5]+m1[4],
  m1[1]*m2[4]+m1[3]*m2[5]+m1[5]
];
const translate = (tx,ty)=>[1,0,0,1,tx,ty];
const scale = (sx,sy)=>[sx,0,0,sy,0,0];
const rotate = (deg,cx=0,cy=0)=>{
  const r=deg*Math.PI/180, cos=Math.cos(r), sin=Math.sin(r);
  return mul(mul(translate(cx,cy), [cos,sin,-sin,cos,0,0]), translate(-cx,-cy));
};

function parseTransform(str='') {
  let m = I();
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let match;
  while ((match = re.exec(str)) !== null) {
    const cmd = match[1];
    const nums = match[2].trim().split(/[\s,]+/).map(Number);
    let t = I();
    if (cmd === 'matrix' && nums.length===6) t = nums;
    else if (cmd === 'translate') t = translate(nums[0]||0, nums[1]||0);
    else if (cmd === 'scale') t = scale(nums[0]||1, nums.length>1?nums[1]:nums[0]||1);
    else if (cmd === 'rotate') t = rotate(nums[0]||0, nums[1]||0, nums[2]||0);
    m = mul(m, t);
  }
  return m;
}

function applyM(m,x,y){
  return { x: m[0]*x + m[2]*y + m[4], y: m[1]*x + m[3]*y + m[5] };
}
function bboxApplyM(b,m){
  const pts = [
    applyM(m,b.minX,b.minY), applyM(m,b.maxX,b.minY),
    applyM(m,b.minX,b.maxY), applyM(m,b.maxX,b.maxY),
  ];
  const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}
function rectBBox(x,y,w,h){ return { minX:x, minY:y, maxX:x+w, maxY:y+h }; }
function intersects(a,b){
  return !(a.maxX <= b.minX || a.minX >= b.maxX || a.maxY <= b.minY || a.minY >= b.maxY);
}

function getAttr(node, name){
  if (!node || !node.getAttribute) return null;
  const v = node.getAttribute(name);
  if (v!=null) return v;
  if (name==='href') return node.getAttribute('href') || node.getAttribute('xlink:href');
  return null;
}

function checkTileHasContent(svgString, tileX, tileY, tileWidth, tileHeight) {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.tagName.toLowerCase() !== 'svg') return false;

  const idMap = {};
  (function indexIds(node){
    if (node.getAttribute && node.getAttribute('id')) {
      idMap['#'+node.getAttribute('id')] = node;
    }
    for (let c=node.firstChild;c;c=c.nextSibling){
      if (c.nodeType===1) indexIds(c);
    }
  })(svg);

  const tileBBox = rectBBox(tileX, tileY, tileWidth, tileHeight);

  function walk(node, ctm){
    if (!node || node.nodeType!==1) return false;
    const tag = node.tagName.toLowerCase();

    const thisT = parseTransform(getAttr(node,'transform')||'');
    const M = mul(ctm, thisT);

    if (tag === 'g' || tag === 'svg' || tag === 'symbol') {
      for (let c=node.firstChild;c;c=c.nextSibling){
        if (walk(c, M)) return true;
      }
      return false;
    }

    if (tag === 'use') {
      const href = getAttr(node,'href');
      if (href && idMap[href]) {
        const ux = parseFloat(getAttr(node,'x')||'0')||0;
        const uy = parseFloat(getAttr(node,'y')||'0')||0;
        const MU = mul(M, translate(ux, uy));
        if (walk(idMap[href], MU)) return true;
      }
      return false;
    }

    let b = null;
    if (tag === 'path') {
      const d = getAttr(node,'d');
      if (d) {
        try{
          const coords = d.match(/[-+]?[0-9]*\.?[0-9]+/g);
          if (coords && coords.length >= 2) {
            const nums = coords.map(Number);
            const xs = [], ys = [];
            for (let i = 0; i < nums.length - 1; i += 2) {
              xs.push(nums[i]); ys.push(nums[i+1]);
            }
            if (xs.length > 0) {
              b = { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
            }
          }
        }catch{}
      }
    } else if (tag === 'rect') {
      const x = parseFloat(getAttr(node,'x')||'0')||0;
      const y = parseFloat(getAttr(node,'y')||'0')||0;
      const w = parseFloat(getAttr(node,'width')||'0')||0;
      const h = parseFloat(getAttr(node,'height')||'0')||0;
      if (w>0 && h>0) b = rectBBox(x,y,w,h);
    }

    if (b) {
      const world = bboxApplyM(b, M);
      if (intersects(world, tileBBox)) return true;
    }
    return false;
  }

  return walk(svg, I());
}

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

        const hasContent = checkTileHasContent(svgString, tileX, tileY, A4_WIDTH_SVG, A4_HEIGHT_SVG);
       
        if (!hasContent) {
          continue;
        }

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
