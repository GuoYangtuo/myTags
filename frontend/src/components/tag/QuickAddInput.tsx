import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { ConfidenceSlider } from './ConfidenceSlider';
import { NO_CONFIDENCE_VALUE } from '../../utils/helpers';
import type { Category } from '../../types';

const CONFIDENCE_LABEL_PRESETS = [
  '置信度',
  '熟练度',
  '喜欢程度',
  '亲密度',
  '了解程度',
  '掌握度',
  '重要度',
  '自定义',
];

interface QuickAddInputProps {
  categories: Category[];
  pageId: number;
  onAdd: (name: string, categoryId: number, confidence?: number, confidenceLabel?: string) => void;
  currentCategoryId?: number;
}

interface FlatCat { cat: Category; depth: number }

export function QuickAddInput({ categories, pageId, onAdd, currentCategoryId }: QuickAddInputProps) {
  const [value, setValue] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(currentCategoryId || null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [useConfidence, setUseConfidence] = useState(true);
  const [confidence, setConfidence] = useState(100);
  const [confidenceLabel, setConfidenceLabel] = useState('置信度');
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const labelDropdownRef = useRef<HTMLDivElement>(null);

  const flatCategories: FlatCat[] = [];
  const flatten = (cats: Category[], depth: number) => {
    for (const cat of cats) {
      flatCategories.push({ cat, depth });
      if (cat.children) flatten(cat.children, depth + 1);
    }
  };
  flatten(categories, 0);

  const selectedCat = flatCategories.find((f) => f.cat.id === selectedCatId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (labelDropdownRef.current && !labelDropdownRef.current.contains(e.target as Node)) {
        setShowLabelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (!value.trim() || !selectedCatId) return;
    const finalConfidence = useConfidence ? confidence : NO_CONFIDENCE_VALUE;
    onAdd(value.trim(), selectedCatId, finalConfidence, confidenceLabel);
    setValue('');
    setConfidence(100);
    setConfidenceLabel('置信度');
    setCustomLabel('');
    setShowLabelDropdown(false);
  };

  const handleLabelSelect = (label: string) => {
    if (label === '自定义') {
      setConfidenceLabel(customLabel || '置信度');
    } else {
      setConfidenceLabel(label);
      setCustomLabel('');
    }
    setShowLabelDropdown(false);
  };

  const activeLabel = confidenceLabel === '自定义' && customLabel ? customLabel : confidenceLabel;

  return (
    <div className="bg-bg-card rounded-xl border-2 border-border-strong p-3 md:p-4 mb-4 md:mb-6 shadow-[3px_3px_0_var(--color-border-strong)]">
      {/* Desktop: dropdown | input | button */}
      <div className="hidden md:flex flex-row gap-2 md:gap-3 mb-3">
        <div className="relative flex-shrink-0 flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-border-strong bg-bg-secondary hover:bg-border-light transition-colors text-sm font-medium h-10 min-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis"
          >
            <span className="truncate">{selectedCat?.cat.name || '选择分类'}</span>
            <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-bg-card rounded-xl border-2 border-border-strong shadow-[4px_4px_0_var(--color-border-strong)] z-20 max-h-64 overflow-y-auto category-enter">
                {flatCategories.map(({ cat, depth }) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCatId(cat.id); setShowDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary transition-colors ${cat.id === selectedCatId ? 'bg-accent-primary/10 text-accent-primary font-medium' : ''}`}
                    style={{ paddingLeft: 12 + depth * 16 }}
                  >
                    {cat.name}
                  </button>
                ))}
                {flatCategories.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-text-secondary">
                    还没有分类，先创建一个吧
                  </div>
                )}
              </div>
            )}
        </div>

        <input
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="今天又新增了什么成分？"
          className="flex-1 px-3 md:px-4 py-2 rounded-lg border-2 border-border-strong outline-none focus:border-accent-primary text-base h-10"
        />

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || !selectedCatId}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-primary text-white border-2 border-border-strong flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_var(--color-border-strong)]"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Mobile: input | dropdown + button */}
      <div className="flex flex-col gap-2 md:hidden mb-3">
        <input
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="今天又新增了什么成分？"
          className="w-full px-3 py-2 rounded-lg border-2 border-border-strong outline-none focus:border-accent-primary text-base h-10"
        />

        <div className="flex gap-2">
          <div className="relative flex-1 flex items-center" ref={mobileDropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-border-strong bg-bg-secondary hover:bg-border-light transition-colors text-sm font-medium h-10 w-full whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <span className="truncate">{selectedCat?.cat.name || '选择分类'}</span>
              <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-bg-card rounded-xl border-2 border-border-strong shadow-[4px_4px_0_var(--color-border-strong)] z-20 max-h-64 overflow-y-auto category-enter">
                {flatCategories.map(({ cat, depth }) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCatId(cat.id); setShowDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary transition-colors ${cat.id === selectedCatId ? 'bg-accent-primary/10 text-accent-primary font-medium' : ''}`}
                    style={{ paddingLeft: 12 + depth * 16 }}
                  >
                    {cat.name}
                  </button>
                ))}
                {flatCategories.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-text-secondary">
                    还没有分类，先创建一个吧
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!value.trim() || !selectedCatId}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-primary text-white border-2 border-border-strong flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_var(--color-border-strong)]"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
          <div className="relative">
            <input
              type="checkbox"
              checked={useConfidence}
              onChange={(e) => setUseConfidence(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-7 h-7 rounded-lg border-2 border-border-strong bg-bg-card peer-checked:bg-accent-primary peer-checked:border-border-strong shadow-[2px_2px_0_var(--color-border-strong)] transition-all cursor-pointer hover:border-accent-primary/60" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {useConfidence && (
                <svg className="w-4 h-4 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </div>
          </div>
          {useConfidence ? (
            <div className="relative" ref={labelDropdownRef}>
              <button
                onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border-2 border-border-strong hover:border-accent-secondary transition-colors text-sm text-text-secondary whitespace-nowrap shadow-[2px_2px_0_var(--color-border-strong)] hover:shadow-[2px_2px_0_var(--color-accent-secondary)]"
              >
                <span>{activeLabel}</span>
                <ChevronDown size={12} className={`transition-transform ${showLabelDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showLabelDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-bg-card rounded-xl border-2 border-border-strong shadow-[3px_3px_0_var(--color-border-strong)] z-20 py-1 min-w-[120px] category-enter">
                  {CONFIDENCE_LABEL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleLabelSelect(preset)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-bg-secondary transition-colors ${activeLabel === preset ? 'bg-accent-primary/10 text-accent-primary font-medium' : ''}`}
                    >
                      {preset}
                    </button>
                  ))}
                  <div className="border-t border-border-light mt-1 pt-1 px-3 py-1.5">
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => {
                        setCustomLabel(e.target.value);
                        if (e.target.value) setConfidenceLabel(e.target.value);
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleLabelSelect('自定义'); } }}
                      placeholder="自定义..."
                      className="w-full px-2 py-0.5 text-xs rounded border border-border-light outline-none focus:border-accent-primary bg-white"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-text-secondary/60 italic">不使用置信度</span>
          )}
        </label>

        {useConfidence && (
          <div className="flex-1">
            <ConfidenceSlider
              value={confidence}
              onChange={setConfidence}
              label=""
              size="sm"
              debounceMs={0}
            />
          </div>
        )}
      </div>
    </div>
  );
}
