import { useRef, useState, useEffect, createElement } from "react";
import { INFURA_GATEWAY } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import { getCurrentTemplate } from "../utils/templateHelpers";
import { Template } from "../../Format/types/format.types";

const useInteractive = (templateChild: Template | null) => {
  const { isBackSide, selectedLayer } = useApp();
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState<number | undefined>(undefined);
  const [imageLoaded, setImageLoaded] = useState(false);

  const onImageLoad = () => {
    setImageLoaded(true);
  };

  const [position, setPosition] = useState({
    x: window.innerWidth - 500,
    y: 12,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const imageRef = useRef<HTMLImageElement>(null);
  const [parsedSvgCache, setParsedSvgCache] = useState<
    Record<string, { props: any; children: any[] }>
  >({});

  useEffect(() => {
    setImageLoaded(false);
    setParsedSvgCache({});
  }, [currentTemplate, isBackSide]);

  useEffect(() => {
    if (currentTemplate) {
      const fetchSvgContent = async () => {
        const cache: Record<string, string> = {};
        const parsedCache: Record<string, { props: any; children: any[] }> = {};
        for (const child of currentTemplate.childReferences) {
          if (!child.child.metadata.image.startsWith("data:")) {
            try {
              const svgUrl = getImageSrc(child.child.metadata.image);
              const response = await fetch(svgUrl);
              const content = await response.text();
              cache[child.child.metadata.image] = content;
              
              const parsed = parseSvgContent(content);
              if (parsed) {
                parsedCache[child.child.metadata.image] = parsed;
              }
            } catch (error) {
              cache[child.child.metadata.image] = "";
            }
          }
        }
        setParsedSvgCache(parsedCache);
      };
      fetchSvgContent();
    } else {
      setParsedSvgCache({});
    }
  }, [currentTemplate, isBackSide]);



  const convertCoordinatesToPixels = (
    mmX: number,
    mmY: number,
    childScale?: number,
    childFlip?: number,
    childRotation?: number
  ) => {
    if (!baseTemplateChild?.metadata?.ratio) {
      return null;
    }

    let baseNaturalWidth = 0;
    
    if (imageRef.current && imageRef.current.naturalWidth > 0) {
      baseNaturalWidth = imageRef.current.naturalWidth;
    } else if (imageRef.current && imageRef.current.offsetWidth > 0) {
      baseNaturalWidth = imageRef.current.offsetWidth;
    } else if (canvasWidth) {
      baseNaturalWidth = canvasWidth;
    } else {
      return null;
    }
    const realBaseWidthMM = baseTemplateChild.metadata.ratio;
    const realMmToPixelsRatio = baseNaturalWidth / realBaseWidthMM;

    const targetLeft = mmX * realMmToPixelsRatio;
    const targetTop = mmY * realMmToPixelsRatio;

    const scale = childScale || 1;
    const isFlipped = childFlip === -1;
    const rotation = childRotation || 0;

    const result = {
      left: targetLeft,
      top: targetTop,
      scale: scale,
      flip: isFlipped,
      rotation: rotation,
    };

    return result;
  };

  const getImageSrc = (uri: string) => {
    return uri?.startsWith("data:")
      ? uri
      : uri?.replace("ipfs://", `${INFURA_GATEWAY}/ipfs/`);
  };

  const parseSvgContent = (svgString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (!svgElement) return null;
    
    const props: any = {};
    Array.from(svgElement.attributes).forEach(attr => {
      if (attr.name !== 'xmlns:xlink') {
        props[attr.name] = attr.value;
      }
    });
    
    const parseElement = (element: Element): any => {
      const tagName = element.tagName;
      const elementProps: any = {};
      
      Array.from(element.attributes).forEach(attr => {
        if (attr.name !== 'xmlns:xlink') {
          elementProps[attr.name] = attr.value;
        }
      });
      
      const children: any[] = [];
      Array.from(element.children).forEach(child => {
        children.push(parseElement(child));
      });
      
      if (element.textContent && element.children.length === 0) {
        children.push(element.textContent);
      }
      
      return {
        type: tagName.toLowerCase(),
        props: elementProps,
        children
      };
    };
    
    const children: any[] = [];
    Array.from(svgElement.children).forEach(child => {
      children.push(parseElement(child));
    });
    
    return {
      props,
      children
    };
  };

  const createReactElement = (elementData: any, key?: string, onChildClick?: (uri: string) => void, childUri?: string): any => {
    try {
      if (typeof elementData === 'string') {
        return elementData;
      }
      
      const { type, props, children } = elementData;
      
      const reactChildren = children.map((child: any, index: number) => 
        createReactElement(child, `${key || 'element'}-${index}`, onChildClick, childUri)
      );
      
      const convertSvgPropsToReact = (svgProps: any) => {
        const converted = { ...svgProps };
        
        const attributeMap: Record<string, string> = {
          'stroke-width': 'strokeWidth',
          'stroke-dasharray': 'strokeDasharray',
          'stroke-linecap': 'strokeLinecap',
          'stroke-linejoin': 'strokeLinejoin',
          'fill-rule': 'fillRule',
          'fill-opacity': 'fillOpacity',
          'stroke-opacity': 'strokeOpacity',
          'xlink:href': 'xlinkHref',
          'text-anchor': 'textAnchor',
          'dominant-baseline': 'dominantBaseline',
          'font-size': 'fontSize',
          'font-family': 'fontFamily',
          'font-weight': 'fontWeight',
          'text-decoration': 'textDecoration',
          'clip-path': 'clipPath'
        };
        
        Object.keys(attributeMap).forEach(kebabCase => {
          if (converted[kebabCase] !== undefined) {
            converted[attributeMap[kebabCase]] = converted[kebabCase];
            delete converted[kebabCase];
          }
        });
        
        delete converted['xmlns:xlink'];
        
        return converted;
      };
      
      const elementProps = { ...convertSvgPropsToReact(props), key: key || `${type}-${Math.random()}` };
      
    
      if ((type === "path" || type === "g" || type === "polygon" || type === "circle" || type === "rect") && onChildClick && childUri) {
        elementProps.style = { ...(elementProps.style || {}), pointerEvents: "all", cursor: "pointer" };
        elementProps.onClick = (e: any) => {
          e.stopPropagation();
          onChildClick(childUri);
        };
        elementProps.className = `${elementProps.className || ""} hover:opacity-80 transition-opacity`.trim();
        
        if (!elementProps.fill || elementProps.fill === "none") {
          elementProps.fill = "transparent";
        }
      }
      
      const element = createElement(
        type,
        elementProps,
        ...reactChildren
      );
      return element;
    } catch (error) {
      return null;
    }
  };

  const baseTemplateChild = !currentTemplate
    ? null
    : (currentTemplate.childReferences || []).find((child) => {
        return child.child.metadata.tags.includes("base");
      });
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);
  useEffect(() => {
    if (!isCollapsed) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
        if (canvasContainerRef.current && !canvasWidth) {
          const width = canvasContainerRef.current.offsetWidth;
          if (width > 0) {
            setCanvasWidth(width);
          }
        }
      }, 100);
    }
  }, [isCollapsed, canvasWidth]);
  useEffect(() => {
    const timer1 = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
    const timer2 = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 600);
    const timer3 = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 1000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [templateChild]);

  return {
    getImageSrc,
    convertCoordinatesToPixels,
    baseTemplateChild,
    imageRef,
    position,
    isDragging,
    setCanvasWidth,
    imageDimensions,
    setImageDimensions,
    canvasContainerRef,
    canvasWidth,
    setIsCollapsed,
    containerRef,
    handleMouseDown,
    isCollapsed,
    parsedSvgCache,
    createReactElement,
    onImageLoad,
    imageLoaded,
  };
};
export default useInteractive;
