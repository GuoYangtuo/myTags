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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <span style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap' }}>置信度</span>
      <div className={`confidence-slider-wrapper ${size === 'sm' ? 'sm' : ''}`} style={{ flex: 1, minWidth: 0 }}>
        <input
          type="range"
          min={-20}
          max={120}
          value={value}
          onChange={handleChange}
          className={`confidence-slider ${size === 'sm' ? 'sm' : ''}`}
        />
      </div>
      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color: '#6b7280' }}>
        {value}%
      </span>
    </div>
  );
}
