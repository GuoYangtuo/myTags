import { getConfidenceColor } from '../../utils/helpers';

interface ConfidenceSliderProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
}

export function ConfidenceSlider({ value, onChange, size = 'md' }: ConfidenceSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value));
  };

  const color = getConfidenceColor(value);
  const trackHeight = size === 'sm' ? 6 : 8;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="range"
        min={-20}
        max={120}
        value={value}
        onChange={handleChange}
        className="confidence-slider"
        data-size={size}
      />
      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color }}>
        {value}%
      </span>
    </div>
  );
}
