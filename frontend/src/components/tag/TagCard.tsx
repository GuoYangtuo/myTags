import { useState } from 'react';
import type { Tag } from '../../types';
import { ConfidenceSlider } from './ConfidenceSlider';
import { getConfidenceColor } from '../../utils/helpers';
import { Edit2, Trash2, Link2, ExternalLink, X } from 'lucide-react';

interface TagCardProps {
  tag: Tag;
  onUpdate: (data: Partial<Tag>) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export function TagCard({ tag, onUpdate, onDelete, isDragging }: TagCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(tag.name);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState(tag.navUrl || '');
  const color = getConfidenceColor(tag.confidence);

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== tag.name) {
      onUpdate({ name: editName.trim() });
    } else {
      setEditName(tag.name);
    }
    setIsEditing(false);
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
    <div className={`tag-card bg-bg-card rounded-xl border-2 border-border-strong p-4 relative group ${isDragging ? 'dragging' : ''}`}>
      {tag.navUrl && (
        <button
          onClick={handleLinkClick}
          className="absolute top-2 right-2 p-1 rounded text-accent-tertiary hover:bg-accent-tertiary/10 opacity-0 group-hover:opacity-100 transition-opacity"
          title={`打开链接: ${tag.navUrl}`}
        >
          <ExternalLink size={14} />
        </button>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); if (e.key === 'Escape') { setEditName(tag.name); setIsEditing(false); } }}
            className="flex-1 px-2 py-1 text-base font-bold rounded border-2 border-accent-primary outline-none bg-white font-heading"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 text-left font-bold font-heading text-base hover:text-accent-primary transition-colors"
            title="点击编辑"
          >
            {tag.name}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ConfidenceSlider value={tag.confidence} onChange={(v) => onUpdate({ confidence: v })} />
      </div>

      <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
          title="添加导航链接"
        >
          <Link2 size={14} className={tag.navUrl ? 'text-accent-tertiary' : 'text-text-secondary'} />
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
          title="编辑名称"
        >
          <Edit2 size={14} className="text-text-secondary" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
          title="删除标签"
        >
          <Trash2 size={14} />
        </button>
      </div>

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
  );
}
