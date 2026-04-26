import { useState, useEffect, useCallback } from 'react';
import type { Page, Category } from '../../types';
import { Modal, Button } from '../ui';
import { Share, Copy, Check, Clock, Trash2, CheckSquare, Square, ChevronRight } from 'lucide-react';
import { shareApi } from '../../api/shares';
import type { Share as ShareType } from '../../types';
import { formatDate } from '../../utils/helpers';
import { usePageStore } from '../../stores/pageStore';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  page: Page;
}

function collectAllIds(categories: Category[]): number[] {
  const ids: number[] = [];
  const traverse = (cats: Category[]) => {
    for (const c of cats) {
      ids.push(c.id);
      for (const t of c.tags) ids.push(t.id);
      traverse(c.children);
    }
  };
  traverse(categories);
  return ids;
}

// ---------------------------------------------------------------------------
// Tree picker — standalone, no external state dependency
// ---------------------------------------------------------------------------

interface TreePickerProps {
  categories: Category[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
}

function findCategoryNode(cats: Category[], id: number): Category | undefined {
  for (const c of cats) {
    if (c.id === id) return c;
    const found = findCategoryNode(c.children, id);
    if (found) return found;
  }
  return undefined;
}

function TreePicker({ categories, selected, onChange }: TreePickerProps) {
  const toggleCat = useCallback((cat: Category, checked: boolean) => {
    const ids = new Set(selected);
    const apply = (c: Category) => {
      if (checked) ids.add(c.id);
      else ids.delete(c.id);
      for (const t of c.tags) {
        if (checked) ids.add(t.id);
        else ids.delete(t.id);
      }
      for (const child of c.children) apply(child);
    };
    apply(cat);
    onChange(ids);
  }, [selected, onChange]);

  const toggleTag = useCallback((catId: number, tagId: number, checked: boolean) => {
    const ids = new Set(selected);
    if (checked) {
      ids.add(tagId);
      const parent = findCategoryNode(categories, catId);
      if (parent) {
        const allSelected = parent.tags.every(t => t.id === tagId || ids.has(t.id));
        if (allSelected) ids.add(catId);
      }
    } else {
      ids.delete(tagId);
      ids.delete(catId);
    }
    onChange(ids);
  }, [selected, onChange, categories]);

  const isCatChecked = (cat: Category) => {
    const allIds = [cat.id, ...cat.tags.map(t => t.id)];
    return allIds.every(id => selected.has(id));
  };

  const isCatIndeterminate = (cat: Category) => {
    const allIds = [cat.id, ...cat.tags.map(t => t.id)];
    const checkedCount = allIds.filter(id => selected.has(id)).length;
    return checkedCount > 0 && checkedCount < allIds.length;
  };

  return (
    <div>
      {categories.map(cat => (
        <TreeNode
          key={cat.id}
          cat={cat}
          depth={0}
          selected={selected}
          isCatChecked={isCatChecked}
          isCatIndeterminate={isCatIndeterminate}
          toggleCat={toggleCat}
          toggleTag={toggleTag}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  cat: Category;
  depth: number;
  selected: Set<number>;
  isCatChecked: (cat: Category) => boolean;
  isCatIndeterminate: (cat: Category) => boolean;
  toggleCat: (cat: Category, checked: boolean) => void;
  toggleTag: (catId: number, tagId: number, checked: boolean) => void;
}

function TreeNode({ cat, depth, selected, isCatChecked, isCatIndeterminate, toggleCat, toggleTag }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const checked = isCatChecked(cat);
  const indeterminate = isCatIndeterminate(cat);

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 py-2 pr-3 rounded-xl cursor-pointer select-none transition-colors hover:bg-bg-secondary/70"
        style={{ paddingLeft: `${depth * 18 + 10}px` }}
        onClick={() => toggleCat(cat, !checked)}
      >
        {cat.children.length > 0 || cat.tags.length > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(x => !x); }}
            className="p-0.5 rounded flex-shrink-0 hover:bg-border-light/50"
          >
            <ChevronRight
              size={13}
              className={`text-text-secondary transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="w-[18px] flex-shrink-0" />
        )}

        {indeterminate ? (
          <CheckSquare size={15} className="text-accent-primary flex-shrink-0" />
        ) : checked ? (
          <CheckSquare size={15} className="text-accent-primary flex-shrink-0" />
        ) : (
          <Square size={15} className="text-text-secondary flex-shrink-0" />
        )}

        <span className="text-sm font-medium text-text-primary">{cat.name}</span>
        {cat.tags.length > 0 && (
          <span className="text-xs text-text-secondary ml-auto mr-1 flex-shrink-0">
            {cat.tags.length}个标签
          </span>
        )}
      </div>

      {expanded && (
        <>
          {cat.tags.map(tag => (
            <div
              key={tag.id}
              className="flex items-center gap-1.5 py-1.5 pr-3 rounded-xl cursor-pointer select-none transition-colors hover:bg-bg-secondary/50"
              style={{ paddingLeft: `${(depth + 1) * 18 + 28}px` }}
              onClick={() => toggleTag(cat.id, tag.id, !selected.has(tag.id))}
            >
              <span className="w-[18px] flex-shrink-0">
                {selected.has(tag.id) ? (
                  <CheckSquare size={15} className="text-accent-primary" />
                ) : (
                  <Square size={15} className="text-text-secondary" />
                )}
              </span>
              <span className="text-sm text-text-secondary truncate">{tag.name}</span>
            </div>
          ))}
          {cat.children.map(child => (
            <TreeNode
              key={child.id}
              cat={child}
              depth={depth + 1}
              selected={selected}
              isCatChecked={isCatChecked}
              isCatIndeterminate={isCatIndeterminate}
              toggleCat={toggleCat}
              toggleTag={toggleTag}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ShareModal
// ---------------------------------------------------------------------------

export function ShareModal({ open, onClose, page }: ShareModalProps) {
  const currentPage = usePageStore(s => s.currentPage);
  const [expiry, setExpiry] = useState<string>('permanent');
  const [customDate, setCustomDate] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState<ShareType[]>([]);
  const [loading, setLoading] = useState(false);
  const [limitVisibility, setLimitVisibility] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      loadShares();
    }
  }, [open, page]);

  useEffect(() => {
    if (open) {
      setGeneratedLink(null);
      setCopied(false);
      setExpiry('permanent');
      setCustomDate('');
      setLimitVisibility(false);
      setSelectedItems(new Set());
    }
  }, [open]);

  const loadShares = async () => {
    try {
      const data = await shareApi.list();
      setShares(data.filter((s) => s.pageId === page.id));
    } catch { /* ignore */ }
  };

  const getExpiryDate = (): string | null => {
    if (expiry === 'permanent') return null;
    if (expiry === '1h') {
      const d = new Date(); d.setHours(d.getHours() + 1); return d.toISOString();
    }
    if (expiry === '1d') {
      const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString();
    }
    if (expiry === '7d') {
      const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString();
    }
    if (expiry === 'custom' && customDate) return new Date(customDate).toISOString();
    return null;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload: { pageId: number; expiresAt: string | null; visibleItems?: number[] } = {
        pageId: page.id,
        expiresAt: getExpiryDate(),
      };
      if (limitVisibility && selectedItems.size > 0) {
        payload.visibleItems = Array.from(selectedItems);
      }
      const data = await shareApi.create(payload);
      const url = `${window.location.origin}/share/${data.shareCode}`;
      setGeneratedLink(url);
      loadShares();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteShare = async (id: number) => {
    await shareApi.delete(id);
    loadShares();
  };

  const categories = currentPage?.categories ?? page.categories ?? [];
  const hasCategories = categories.length > 0;
  const allIds = collectAllIds(categories);

  return (
    <Modal open={open} onClose={onClose} title="分享页面" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          分享 <strong className="text-text-primary">{page.name}</strong> 页面给朋友
        </p>

        {generatedLink ? (
          <div className="space-y-4 category-enter">
            <div className="p-4 bg-accent-primary/10 rounded-xl border-2 border-accent-primary">
              <p className="text-sm font-medium text-accent-primary mb-2">分享链接已生成！</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedLink || ''}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-strong bg-bg-card font-mono"
                />
                <Button onClick={handleCopy} size="sm" variant="secondary">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            {shares.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2">已创建的分享链接：</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {shares.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 p-2 bg-bg-secondary rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate">{window.location.origin}/share/{s.shareCode}</p>
                        <p className="text-xs text-text-secondary">{formatDate(s.expiresAt)}</p>
                      </div>
                      <button onClick={() => handleDeleteShare(s.id)} className="p-1 rounded hover:bg-red-500/10 text-red-500 flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => setGeneratedLink(null)} variant="ghost" className="w-full">
              再创建一个
            </Button>
          </div>
        ) : (
          <>
            {/* 链接时效 */}
            <div>
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <Clock size={16} />
                链接时效
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '1h', label: '1小时' },
                  { value: '1d', label: '1天' },
                  { value: '7d', label: '7天' },
                  { value: 'permanent', label: '永久' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiry(opt.value)}
                    className={`px-3 py-2 text-sm rounded-lg border-2 border-border-strong transition-all ${
                      expiry === opt.value
                        ? 'bg-accent-primary text-white shadow-[2px_2px_0_var(--color-border-strong)]'
                        : 'bg-bg-card hover:bg-bg-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setExpiry('custom')}
                className={`mt-2 px-3 py-2 text-sm rounded-lg border-2 border-border-strong transition-all w-full ${
                  expiry === 'custom' ? 'bg-accent-primary text-white' : 'bg-bg-card hover:bg-bg-secondary'
                }`}
              >
                {expiry === 'custom' ? (
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-transparent outline-none w-full text-center"
                  />
                ) : (
                  '自定义时间'
                )}
              </button>
            </div>

            {/* 控制可见范围 */}
            {hasCategories && (
              <>
                <div
                  className="flex items-center gap-3 cursor-pointer select-none"
                  onClick={() => {
                    if (!limitVisibility) setSelectedItems(new Set(allIds));
                    setLimitVisibility(v => !v);
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={limitVisibility}
                      onChange={() => {
                        if (!limitVisibility) setSelectedItems(new Set(allIds));
                        setLimitVisibility(v => !v);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-6 h-6 rounded-lg border-2 border-border-strong bg-bg-card peer-checked:bg-accent-primary shadow-[2px_2px_0_var(--color-border-strong)] transition-all cursor-pointer hover:border-accent-primary/60" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {limitVisibility && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-text-primary">控制可见范围</span>
                </div>

                {limitVisibility && (
                  <div className="space-y-2 category-enter">
                    <div className="flex items-center gap-2 px-1">
                      <button
                        onClick={() => setSelectedItems(new Set(allIds))}
                        className="text-xs px-2.5 py-1 rounded-lg border-2 border-border-strong bg-bg-card text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-all"
                      >
                        全选
                      </button>
                      <button
                        onClick={() => setSelectedItems(new Set())}
                        className="text-xs px-2.5 py-1 rounded-lg border-2 border-border-strong bg-bg-card text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-all"
                      >
                        清空
                      </button>
                      <span className="text-xs text-text-secondary ml-auto">
                        已选 {selectedItems.size} / {allIds.length}
                      </span>
                    </div>
                    <div className="border-2 border-border-strong rounded-xl overflow-hidden bg-bg-card">
                      <TreePicker
                        categories={categories}
                        selected={selectedItems}
                        onChange={setSelectedItems}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <Button onClick={handleGenerate} loading={loading} className="w-full">
              <Share size={16} className="mr-2" />
              生成分享链接
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
