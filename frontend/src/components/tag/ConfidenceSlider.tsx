import { useState, useEffect, useRef } from 'react';
import { getConfidenceColor } from '../../utils/helpers';

interface ConfidenceSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  size?: 'sm' | 'md';
  debounceMs?: number;
}

export function ConfidenceSlider({ value, onChange, label = '置信度', size = 'md', debounceMs = 500 }: ConfidenceSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const color = getConfidenceColor(value);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      {label && (
        <span style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      )}
      <div className={`confidence-slider-wrapper ${size === 'sm' ? 'sm' : ''}`} style={{ flex: 1, minWidth: 0 }}>
          <input
              type="range"
              min={-20}
              max={120}
              value={localValue}
              onChange={handleChange}
              className={`confidence-slider ${size === 'sm' ? 'sm' : ''}`}
              style={size === 'sm' ? { height: '8px' } : undefined}
            />
      </div>
      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color: '#6b7280' }}>
        {localValue}%
      </span>
    </div>
  );
}
