import { useState, useCallback } from 'react';
export const useNodeInput = (value: any, type: string, onChange: (value: any) => void) => {
  const getInitialValue = () => {
    if (typeof value === 'object' && value !== null && 'type' in value) {
      if (value.type === 'file') return value.value;
      if (value.type === 'text') return value.value;
      if (value.type === 'number') return value.value.toString();
      if (value.type === 'boolean') return value.value.toString();
      return '';
    }
    return value?.toString() || '';
  };
  const [localValue, setLocalValue] = useState<string | { name: string; url: string; type: string }>(getInitialValue());
  const handleChange = useCallback((newValue: string | number | boolean | { name: string; url: string; type: string }) => {
    if (typeof newValue === 'object' && newValue !== null && 'name' in newValue) {
      setLocalValue(newValue);
      onChange({ type: 'file', value: newValue });
    } else {
      setLocalValue(newValue.toString());
      if (type === 'TEXT' || type === 'STRING') {
        onChange({ type: 'text', value: newValue as string });
      } else if (type === 'INT' || type === 'FLOAT') {
        onChange({ type: 'number', value: Number(newValue) });
      } else if (type === 'BOOLEAN') {
        onChange({ type: 'boolean', value: newValue as boolean });
      } else {
        onChange({ type: 'text', value: newValue as string });
      }
    }
  }, [type, onChange]);
  const getBooleanValue = () => {
    if (typeof value === 'object' && value !== null && 'type' in value) {
      return value.type === 'boolean' ? value.value : false;
    }
    return Boolean(value);
  };
  const getSamplers = () => ['ddim', 'euler', 'euler_ancestral', 'heun', 'dpm_2', 'dpm_2_ancestral', 'lms', 'dpm_fast', 'dpm_adaptive', 'dpmpp_2s_ancestral', 'dpmpp_sde', 'dpmpp_2m'];
  const getSchedulers = () => ['normal', 'karras', 'exponential', 'sgm_uniform', 'simple', 'ddim_uniform', 'kl_optimal'];
  return {
    localValue,
    handleChange,
    getBooleanValue,
    getSamplers,
    getSchedulers
  };
};