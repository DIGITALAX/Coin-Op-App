import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SparrowStats } from '../types/pattern.types';

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
          setLiveSvgContent(svgContent);
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