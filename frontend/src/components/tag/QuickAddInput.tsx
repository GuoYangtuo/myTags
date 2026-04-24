import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import type { Category } from '../../types';

interface QuickAddInputProps {
  categories: Category[];
  pageId: number;
  onAdd: (name: string, categoryId: number) => void;
  currentCategoryId?: number;
}

interface FlatCat { cat: Category; depth: number }

export function QuickAddInput({ categories, pageId, onAdd, currentCategoryId }: QuickAddInputProps) {
  const [value, setValue] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(currentCategoryId || null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (!value.trim() || !selectedCatId) return;
    onAdd(value.trim(), selectedCatId);
    setValue('');
  };

  return (
    <div className="bg-bg-card rounded-xl border-2 border-border-strong p-4 mb-6 shadow-[3px_3px_0_var(--color-border-strong)]">
      <div className="flex gap-3">
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-border-strong bg-bg-secondary hover:bg-border-light transition-colors text-sm font-medium min-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis"
          >
            <span className="truncate">{selectedCat?.cat.name || '选择分类'}</span>
            <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-bg-card rounded-xl border-2 border-border-strong shadow-[4px_4px_0_var(--color-border-strong)] z-20 max-h-64 overflow-y-auto category-enter">
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
          placeholder="今天又新增了什么成分？按回车添加..."
          className="flex-1 px-4 py-2 rounded-lg border-2 border-border-strong outline-none focus:border-accent-primary text-base"
        />

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || !selectedCatId}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-primary text-white border-2 border-border-strong flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_var(--color-border-strong)]"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
