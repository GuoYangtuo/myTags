import { useState, useRef, useEffect } from 'react';
import { getConfidenceColor } from '../../utils/helpers';
import { clamp } from '../../utils/helpers';

interface ConfidenceSliderProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
}

export function ConfidenceSlider({ value, onChange, size = 'md' }: ConfidenceSliderProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value);
    onChange(newVal);
    setInputValue(newVal.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const num = parseInt(inputValue);
    if (!isNaN(num)) {
      onChange(clamp(num, -20, 120));
    } else {
      setInputValue(value.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
    if (e.key === 'Escape') {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  };

  const color = getConfidenceColor(value);
  const trackColor = value >= 0 ? color : '#94A3B8';
  const percentage = ((value + 20) / 140) * 100;

  const thumbSize = size === 'sm' ? 16 : 20;
  const trackHeight = size === 'sm' ? 6 : 8;

  return (
    <div className={`flex items-center gap-2 ${size === 'sm' ? 'scale-90 origin-right' : ''}`}>
      <div className="relative flex-1" style={{ height: trackHeight }}>
        <div className="absolute inset-0 bg-border-light rounded-full border border-border-strong overflow-hidden">
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-75"
            style={{ width: `${percentage}%`, backgroundColor: trackColor }}
          />
        </div>
        <input
          type="range"
          min={-20}
          max={120}
          value={value}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: trackHeight * 2 }}
        />
      </div>

      <button
        onClick={() => { setIsEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}
        className={`font-mono font-bold text-sm px-2 py-0.5 rounded border border-border-strong hover:border-accent-primary transition-colors min-w-[48px] text-center ${isEditing ? 'border-accent-primary bg-white' : ''}`}
        style={{ color: isEditing ? undefined : color }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent outline-none text-center font-mono font-bold"
            style={{ color }}
          />
        ) : (
          <span>{value}%</span>
        )}
      </button>
    </div>
  );
}
