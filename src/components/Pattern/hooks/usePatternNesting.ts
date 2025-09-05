import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { NestingRequest, NestingResult, NestingSettings, PatternPiece } from '../types/pattern.types';

export const usePatternNesting = () => {
  const [isNesting, setIsNesting] = useState(false);
  const [isSparrowRunning, setIsSparrowRunning] = useState(false);
  const [nestingResult, setNestingResult] = useState<NestingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nestPatterns = useCallback(async (
    patterns: PatternPiece[], 
    canvasWidth: number = 1000,
    settings: NestingSettings
  ): Promise<NestingResult | null> => {
    setIsNesting(true);
    setIsSparrowRunning(true);
    setError(null);
    try {
      const request: NestingRequest = {
        pattern_pieces: patterns.map(pattern => ({
          id: pattern.id,
          name: pattern.name,
          svg_path: pattern.svgPath.startsWith('/') ? 
            `./public${pattern.svgPath}` : 
            `./public/${pattern.svgPath}`,
          demand: pattern.quantity
        })),
        strip_width: canvasWidth,
        settings
      };
      const result = await invoke<NestingResult>('nest_pattern_pieces', { request });
      setNestingResult(result);
      setTimeout(() => {
        setIsSparrowRunning(false);
      }, 65000);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsSparrowRunning(false);
      return null;
    } finally {
      setIsNesting(false);
    }
  }, []);
  const clearResult = useCallback(() => {
    setNestingResult(null);
    setError(null);
    setIsSparrowRunning(false);
  }, []);
  const cancelNesting = useCallback(async () => {
    try {
      await invoke<string>('cancel_sparrow_process');
      setIsSparrowRunning(false);
      setIsNesting(false);
    } catch (err) {
    }
  }, []);
  return {
    nestPatterns,
    isNesting,
    isSparrowRunning,
    nestingResult,
    error,
    clearResult,
    cancelNesting
  };
};