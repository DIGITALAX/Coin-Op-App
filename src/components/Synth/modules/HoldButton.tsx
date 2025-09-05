import { useCallback, useEffect, useRef } from "react";
import { HoldButtonProps } from "../types/synth.types";
const HoldButton = ({ onAction, className, children }: HoldButtonProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startHolding = useCallback(() => {
    try {
      onAction();
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          try {
            onAction();
          } catch (error) {
          }
        }, 100);
      }, 300);
    } catch (error) {
    }
  }, [onAction]);
  const stopHolding = useCallback(() => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
    }
  }, []);
  useEffect(() => {
    return () => {
      stopHolding();
    };
  }, [stopHolding]);
  return (
    <div
      className={`${className} cursor-pointer`}
      onMouseDown={startHolding}
      onMouseUp={stopHolding}
      onMouseLeave={stopHolding}
      onTouchStart={startHolding}
      onTouchEnd={stopHolding}
    >
      {children}
    </div>
  );
};
export default HoldButton;
