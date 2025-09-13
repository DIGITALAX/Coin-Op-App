import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SparrowStats } from '../types/pattern.types';
import { PATTERN_COLORS } from '../../../lib/constants';

const removeSvgBackground = (svgContent: string): string => {
  return svgContent.replace(
    /<g id="container_\d+">\s*<path[^>]*>\s*<title>[^<]*<\/title>\s*<\/g>/g,
    ''
  );
};

const addPatternColors = (svgContent: string): string => {
  return svgContent.replace(
    /(<g id="item_(\d+)">\s*<path[^>]*?)fill="#[^"]*"([^>]*>)/g,
    (_, prefix, itemNum, suffix) => {
      const colorIndex = parseInt(itemNum) % PATTERN_COLORS.length;
      const color = PATTERN_COLORS[colorIndex];
      return `${prefix}fill="${color}" fill-opacity="0.8"${suffix}`;
    }
  );
};

export const useLiveSparrowVisualization = (isSparrowRunning: boolean, onComplete?: () => void) => {
  const [liveSvgContent, setLiveSvgContent] = useState<string | null>(null);
  const [sparrowStats, setSparrowStats] = useState<SparrowStats | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  useEffect(() => {
    if (isSparrowRunning) {
      setIsPolling(true);
      const fetchSvg = async () => {
        try {
          const [svgContent, stats] = await Promise.all([
            invoke<string>('get_live_sparrow_svg'),
            invoke<SparrowStats>('get_sparrow_stats')
          ]);
          const cleanedSvg = removeSvgBackground(svgContent);
          const coloredSvg = addPatternColors(cleanedSvg);
          setLiveSvgContent(coloredSvg);
          setSparrowStats(stats);
          if (stats.phase === "Complete" && onComplete) {
            onComplete();
          }
        } catch (error) {
        }
      };
      const interval = setInterval(fetchSvg, 500);
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    } else {
      setIsPolling(false);
    }
  }, [isSparrowRunning]); 
  return {
    liveSvgContent,
    sparrowStats,
    isPolling
  };
};