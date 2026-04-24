import { useState, useRef, useEffect } from 'react';
import type { Tag } from '../../types';
import { ConfidenceSlider } from './ConfidenceSlider';
import { getConfidenceColor, isNoConfidence, NO_CONFIDENCE_VALUE } from '../../utils/helpers';
import { Edit2, Trash2, Link2, ExternalLink, X, ChevronDown } from 'lucide-react';
import { Modal, Input, Button } from '../ui';

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

interface TagCardProps {
  tag: Tag;
  onUpdate: (data: Partial<Tag>) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export function TagCard({ tag, onUpdate, onDelete, isDragging }: TagCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(tag.name);
  const [editDescription, setEditDescription] = useState(tag.description || '');
  const [useConfidence, setUseConfidence] = useState(!isNoConfidence(tag.confidence));
  const [editConfidence, setEditConfidence] = useState(tag.confidence);
  const [editConfidenceLabel, setEditConfidenceLabel] = useState(tag.confidenceLabel || '');
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState(tag.navUrl || '');
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const color = getConfidenceColor(tag.confidence);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (labelDropdownRef.current && !labelDropdownRef.current.contains(e.target as Node)) {
        setShowLabelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLabel = customLabel && editConfidenceLabel === '自定义' ? customLabel : (editConfidenceLabel || '置信度');

  const handleLabelSelect = (label: string) => {
    if (label === '自定义') {
      setEditConfidenceLabel(customLabel || '置信度');
    } else {
      setEditConfidenceLabel(label);
      setCustomLabel('');
    }
    setShowLabelDropdown(false);
  };

  const handleOpenEdit = () => {
    setEditName(tag.name);
    setEditDescription(tag.description);
    setUseConfidence(!isNoConfidence(tag.confidence));
    setEditConfidence(tag.confidence);
    setEditConfidenceLabel(tag.confidenceLabel || '');
    setCustomLabel('');
    setShowLabelDropdown(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    onUpdate({
      name: editName.trim() || tag.name,
      description: editDescription.trim(),
      confidence: useConfidence ? editConfidence : NO_CONFIDENCE_VALUE,
      confidenceLabel: editConfidenceLabel.trim() || '置信度',
    });
    setShowEditModal(false);
  };

  const handleLinkSubmit = () => {
    onUpdate({ navUrl: linkUrl || null });
    setShowLinkInput(false);
  };

  const handleLinkClick = () => {
    if (tag.navUrl) {
      window.open(tag.navUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <div className={`tag-card bg-bg-card rounded-xl border-2 border-border-strong p-4 relative group ${isDragging ? 'dragging' : ''}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-left font-bold font-heading text-base">
              {tag.name}
            </span>
            <button
              onClick={handleOpenEdit}
              className="p-1 rounded hover:bg-bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              title="编辑标签"
            >
              <Edit2 size={14} className="text-text-secondary" />
            </button>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowLinkInput(!showLinkInput)}
              className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
              title="添加导航链接"
            >
              <Link2 size={14} className={tag.navUrl ? 'text-accent-tertiary' : 'text-text-secondary'} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
              title="删除标签"
            >
              <Trash2 size={14} />
            </button>
            {tag.navUrl && (
              <button
                onClick={handleLinkClick}
                className="p-1.5 rounded-lg text-accent-tertiary hover:bg-accent-tertiary/10 transition-colors"
                title={`打开链接: ${tag.navUrl}`}
              >
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>

        {isNoConfidence(tag.confidence) ? (
          <p className="text-xs text-text-secondary/50 italic">不使用置信度</p>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <ConfidenceSlider value={tag.confidence} onChange={(v) => onUpdate({ confidence: v })} label={tag.confidenceLabel} />
          </div>
        )}

        {showLinkInput && (
          <div className="mt-3 pt-3 border-t border-border-light category-enter">
            <div className="flex gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="输入链接 URL..."
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border-strong outline-none focus:border-accent-primary"
                onKeyDown={(e) => { if (e.key === 'Enter') handleLinkSubmit(); if (e.key === 'Escape') setShowLinkInput(false); }}
                autoFocus
              />
              <button onClick={handleLinkSubmit} className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg border border-border-strong hover:bg-orange-600 transition-colors">确定</button>
              <button onClick={() => setShowLinkInput(false)} className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors"><X size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="编辑标签" size="sm">
          <div className="space-y-4">
            <Input
              label="名称"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-secondary">描述</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="标签描述..."
                rows={2}
                className="px-4 py-2 rounded-lg border-2 border-border-strong bg-bg-card text-text-primary placeholder:text-text-secondary/50 outline-none transition-all duration-150 focus:border-accent-primary resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative flex-shrink-0">
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
              <span className="text-sm">{useConfidence ? '使用置信度' : '不使用置信度'}</span>
            </label>

            {useConfidence && (
              <div className="flex items-center gap-2" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
                <div className="relative flex-shrink-0" ref={labelDropdownRef} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
                  <button
                    onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border-2 border-border-strong hover:border-accent-secondary transition-colors text-sm text-text-secondary whitespace-nowrap shadow-[2px_2px_0_var(--color-border-strong)] hover:shadow-[2px_2px_0_var(--color-accent-secondary)]"
                  >
                    <span>{activeLabel}</span>
                    <ChevronDown size={12} className={`transition-transform ${showLabelDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showLabelDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-bg-card rounded-xl border-2 border-border-strong shadow-[3px_3px_0_var(--color-border-strong)] py-1 min-w-[120px] category-enter" style={{ overflow: 'visible', zIndex: 1000 }}>
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
                            if (e.target.value) setEditConfidenceLabel(e.target.value);
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
                <div className="flex-1">
                  <ConfidenceSlider value={editConfidence} onChange={setEditConfidence} label="" size="sm" debounceMs={0} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>取消</Button>
            <Button variant="primary" onClick={handleSaveEdit}>保存</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
