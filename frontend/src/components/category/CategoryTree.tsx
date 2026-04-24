import React, { useState } from 'react';
import type { Category, Tag } from '../../types';
import { TagCard } from '../tag/TagCard';
import { ConfidenceSlider } from '../tag/ConfidenceSlider';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

interface CategoryTreeProps {
  categories: Category[];
  allCategories: Category[];
  onUpdateTag: (tagId: number, data: Partial<Tag>) => void;
  onDeleteTag: (tagId: number) => void;
  onAddTag: (name: string, categoryId: number, confidence?: number, confidenceLabel?: string) => void;
  onUpdateCategory: (id: number, data: { name?: string; parentId?: number | null; description?: string; confidence?: number; confidenceLabel?: string }) => void;
  onDeleteCategory: (id: number) => void;
  onCreateCategory: (name: string, parentId?: number | null) => void;
  onReorderTags: (items: { id: number; categoryId: number; sortOrder: number }[]) => void;
  onReorderCategories: (items: { id: number; parentId: number | null; sortOrder: number }[]) => void;
  onMoveTag: (tagId: number, targetCategoryId: number) => void;
  onMoveCategory: (categoryId: number, newParentId: number | null) => void;
}

function SortableTagCard({ tag, onUpdate, onDelete, activeItemId, overInfo }: {
  tag: Tag;
  onUpdate: (d: Partial<Tag>) => void;
  onDelete: () => void;
  activeItemId: string | null;
  overInfo: { id: string; side: 'left' | 'right' | 'top' | 'bottom' | 'child' } | null;
}) {
  const { attributes, listeners, setNodeRef } = useSortable({ id: `tag-${tag.id}` });
  const isThisDragging = activeItemId === `tag-${tag.id}`;
  const isThisOver = overInfo?.id === `tag-${tag.id}`;

  if (isThisDragging) {
    return (
      <div ref={setNodeRef} className="tag-card rounded-xl border-2 border-dashed border-accent-primary/40 bg-accent-primary/5" style={{ minHeight: 72 }} />
    );
  }

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} data-tag-card={`tag-${tag.id}`}>
      <div className={`relative ${isThisOver ? 'opacity-40' : ''}`}>
        {isThisOver && (
          <div className="absolute inset-0 flex z-10 pointer-events-none">
            <div className={`w-1/2 flex items-center justify-center text-xs font-bold text-white bg-accent-primary/80 ${overInfo?.side === 'left' ? '' : 'opacity-30'}`}>
              {overInfo?.side === 'left' ? '← 放左边' : ''}
            </div>
            <div className={`w-1/2 flex items-center justify-center text-xs font-bold text-white bg-accent-primary/80 ${overInfo?.side === 'right' ? '' : 'opacity-30'}`}>
              {overInfo?.side === 'right' ? '放右边 →' : ''}
            </div>
          </div>
        )}
        <TagCard tag={tag} onUpdate={onUpdate} onDelete={onDelete} />
      </div>
    </div>
  );
}

function SortableCategoryNode({
  category,
  depth,
  allCategories,
  onUpdateTag,
  onDeleteTag,
  onAddTag,
  onUpdateCategory,
  onDeleteCategory,
  onCreateCategory,
  onReorderTags,
  onReorderCategories,
  onMoveTag,
  onMoveCategory,
  activeItemId,
  overInfo,
}: {
  category: Category;
  depth: number;
  allCategories: Category[];
  onUpdateTag: (tagId: number, data: Partial<Tag>) => void;
  onDeleteTag: (tagId: number) => void;
  onAddTag: (name: string, categoryId: number, confidence?: number, confidenceLabel?: string) => void;
  onUpdateCategory: (id: number, data: { name?: string; parentId?: number | null; description?: string; confidence?: number; confidenceLabel?: string }) => void;
  onDeleteCategory: (id: number) => void;
  onCreateCategory: (name: string, parentId?: number | null) => void;
  onReorderTags: (items: { id: number; categoryId: number; sortOrder: number }[]) => void;
  onReorderCategories: (items: { id: number; parentId: number | null; sortOrder: number }[]) => void;
  onMoveTag: (tagId: number, targetCategoryId: number) => void;
  onMoveCategory: (categoryId: number, newParentId: number | null) => void;
  activeItemId: string | null;
  overInfo: { id: string; side: 'left' | 'right' | 'top' | 'bottom' | 'child' } | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editDescription, setEditDescription] = useState(category.description);
  const [editConfidence, setEditConfidence] = useState(category.confidence);
  const [editConfidenceLabel, setEditConfidenceLabel] = useState(category.confidenceLabel);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagConfidence, setNewTagConfidence] = useState(50);
  const [newTagConfidenceLabel, setNewTagConfidenceLabel] = useState('置信度');
  const [dragOver, setDragOver] = useState(false);

  const { setNodeRef: setDropRef } = useDroppable({ id: `cat-drop-${category.id}` });
  const { attributes, listeners, setNodeRef: setDragRef } = useSortable({ id: `cat-${category.id}` });

  const isThisDragging = activeItemId === `cat-${category.id}`;
  const isThisOver = overInfo?.id === `cat-${category.id}`;

  const handleChildSubmit = () => {
    if (!newChildName.trim()) return;
    onCreateCategory(newChildName.trim(), category.id);
    setNewChildName('');
    setShowAddChild(false);
    setExpanded(true);
  };

  const handleTagSubmit = () => {
    if (!newTagName.trim()) return;
    onAddTag(newTagName.trim(), category.id, newTagConfidence, newTagConfidenceLabel);
    setNewTagName('');
    setNewTagConfidence(50);
    setNewTagConfidenceLabel('置信度');
    setShowAddTag(false);
  };

  return (
    <div
      ref={setDropRef}
      className={`${category.parentId === null ? '' : 'ml-2 sm:ml-4 pl-2 sm:pl-4 border-l-2 border-border-light'} mb-3`}
    >
      {isThisDragging ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-accent-primary/40 bg-accent-primary/5 mb-2" style={{ minHeight: 52 }} />
      ) : (
        <div
          ref={setDragRef}
          data-cat-bar
          className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border-strong bg-bg-secondary/70 group transition-all duration-150 mb-2 ${
            dragOver ? 'ring-2 ring-accent-primary ring-offset-2 bg-accent-primary/5' : ''
          } ${isThisOver ? 'opacity-40' : ''}`}
        >
          {/* Drop position overlay for categories */}
          {isThisOver && activeItemId?.startsWith('cat-') && (
            <div className="absolute inset-0 flex z-10 pointer-events-none rounded-xl overflow-hidden">
              {overInfo?.side === 'top' && <div className="absolute top-0 left-0 right-0 h-1/3 flex items-center justify-center"><div className="px-2 py-0.5 rounded bg-accent-primary/80 text-white text-xs font-bold">放在上方</div></div>}
              {overInfo?.side === 'bottom' && <div className="absolute bottom-0 left-0 right-0 h-1/3 flex items-center justify-center"><div className="px-2 py-0.5 rounded bg-accent-primary/80 text-white text-xs font-bold">放在下方</div></div>}
              {overInfo?.side === 'child' && <div className="absolute inset-0 flex items-center justify-center"><div className="px-2 py-0.5 rounded bg-accent-primary/80 text-white text-xs font-bold">设为子类</div></div>}
            </div>
          )}
          {isThisOver && activeItemId?.startsWith('tag-') && (category.tags ?? []).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none rounded-xl">
              <div className="px-2 py-0.5 rounded bg-accent-primary/80 text-white text-xs font-bold">放入此分类</div>
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 rounded hover:bg-bg-secondary transition-colors"
          >
            {(category.children ?? []).length > 0 || (category.tags ?? []).length > 0 ? (
              expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : (
              <span className="w-4 h-4 inline-block" />
            )}
          </button>

          {isEditing ? (
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <input
                type="text"
                value={editName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                className="px-2 py-1 text-sm font-bold rounded border border-accent-primary outline-none bg-white min-w-0"
                autoFocus
                {...attributes}
                {...listeners}
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDescription(e.target.value)}
                placeholder="描述..."
                className="px-2 py-1 text-xs rounded border border-border-light outline-none focus:border-accent-primary bg-white min-w-0"
              />
              <div className="px-1">
                <ConfidenceSlider value={editConfidence} onChange={setEditConfidence} label={editConfidenceLabel} size="sm" debounceMs={0} />
              </div>
              <input
                type="text"
                value={editConfidenceLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditConfidenceLabel(e.target.value)}
                placeholder="标签字（如：熟练度）"
                className="px-2 py-1 text-xs rounded border border-border-light outline-none focus:border-accent-primary bg-white min-w-0"
              />
              <div className="flex gap-1">
                <button
                  onBlur={() => { if (editName.trim()) onUpdateCategory(category.id, { name: editName.trim(), description: editDescription, confidence: editConfidence, confidenceLabel: editConfidenceLabel }); setIsEditing(false); }}
                  onClick={() => { if (editName.trim()) onUpdateCategory(category.id, { name: editName.trim(), description: editDescription, confidence: editConfidence, confidenceLabel: editConfidenceLabel }); setIsEditing(false); }}
                  className="px-2 py-0.5 text-xs bg-accent-primary text-white rounded border border-border-strong hover:bg-orange-600 whitespace-nowrap"
                >
                  保存
                </button>
                <button
                  onClick={() => { setEditName(category.name); setEditDescription(category.description); setEditConfidence(category.confidence); setEditConfidenceLabel(category.confidenceLabel); setIsEditing(false); }}
                  className="px-2 py-0.5 text-xs bg-bg-secondary rounded border border-border-strong hover:bg-border-light whitespace-nowrap"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              className="flex-1 text-left font-bold font-heading text-sm md:text-base hover:text-accent-primary transition-colors cursor-grab active:cursor-grabbing truncate"
              onDoubleClick={() => { setIsEditing(true); }}
              title={category.description || category.name}
              {...attributes}
              {...listeners}
            >
              {category.name}
              <span className="ml-1 md:ml-2 text-xs font-normal text-text-secondary whitespace-nowrap">
                ({(category.children ?? []).reduce((s, c) => s + (c.tags ?? []).length, 0)} 项)
              </span>
            </button>
          )}

          {/* Mobile: always show action buttons, Desktop: show on hover */}
          <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button onClick={() => setShowAddChild(true)} className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors" title="添加子分类">
              <FolderPlus size={14} className="text-accent-secondary" />
            </button>
            <button onClick={() => { setShowAddTag(true); }} className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors" title="在此分类下添加标签">
              <Plus size={14} className="text-accent-primary" />
            </button>
            <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors">
              <Edit2 size={14} className="text-text-secondary" />
            </button>
            <button
              onClick={() => { if (confirm(`确定删除分类 "${category.name}" 吗？`)) onDeleteCategory(category.id); }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {showAddChild && (
        <div className="ml-4 sm:ml-6 mb-2 flex gap-2 flex-wrap sm:flex-nowrap category-enter">
          <input
            type="text"
            value={newChildName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChildName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleChildSubmit(); if (e.key === 'Escape') setShowAddChild(false); }}
            placeholder="子分类名称..."
            className="min-w-0 flex-1 px-3 py-1.5 text-sm rounded-lg border-2 border-border-strong outline-none focus:border-accent-secondary"
            autoFocus
          />
          <button onClick={handleChildSubmit} className="px-3 py-1.5 text-sm bg-accent-secondary text-white rounded-lg border border-border-strong hover:opacity-90 transition-opacity whitespace-nowrap">添加</button>
          <button onClick={() => setShowAddChild(false)} className="px-3 py-1.5 text-sm bg-bg-secondary rounded-lg border border-border-strong hover:bg-border-light transition-colors whitespace-nowrap">取消</button>
        </div>
      )}

      {showAddTag && (
        <div className="ml-4 sm:ml-6 mb-2 flex flex-col gap-2 category-enter">
          <input
            type="text"
            value={newTagName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleTagSubmit(); if (e.key === 'Escape') setShowAddTag(false); }}
            placeholder="标签名称..."
            className="w-full px-3 py-1.5 text-sm rounded-lg border-2 border-border-strong outline-none focus:border-accent-primary"
            autoFocus
          />
          <div className="px-1">
            <ConfidenceSlider value={newTagConfidence} onChange={setNewTagConfidence} label={newTagConfidenceLabel} size="sm" debounceMs={0} />
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={newTagConfidenceLabel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagConfidenceLabel(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleTagSubmit(); if (e.key === 'Escape') setShowAddTag(false); }}
              placeholder="标签字（如：熟练度）"
              className="min-w-0 flex-1 px-3 py-1.5 text-sm rounded-lg border-2 border-border-strong outline-none focus:border-accent-primary"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleTagSubmit} className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg border border-border-strong hover:bg-orange-600 transition-opacity whitespace-nowrap">添加</button>
            <button onClick={() => setShowAddTag(false)} className="px-3 py-1.5 text-sm bg-bg-secondary rounded-lg border border-border-strong hover:bg-border-light transition-colors whitespace-nowrap">取消</button>
          </div>
        </div>
      )}

      {expanded && (
        <div className={`ml-2 ${dragOver ? 'ring-1 ring-accent-primary ring-dashed rounded-lg p-2' : ''}`}>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(category.tags ?? []).map((tag) => (
                <SortableTagCard
                  key={tag.id}
                  tag={tag}
                  onUpdate={(data) => onUpdateTag(tag.id, data)}
                  onDelete={() => onDeleteTag(tag.id)}
                  activeItemId={activeItemId}
                  overInfo={overInfo}
                />
              ))}
            </div>

          {(category.tags ?? []).length === 0 && (category.children ?? []).length === 0 && !showAddTag && (
            <button
              onClick={() => setShowAddTag(true)}
              className="w-full py-4 border-2 border-dashed border-border-light rounded-xl text-sm text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors mb-3"
            >
              + 添加标签
            </button>
          )}

          {(category.tags ?? []).length > 0 && (category.children ?? []).length > 0 && (
            <div className="mb-3" />
          )}

          {(category.children ?? []).map((child) => (
            <SortableCategoryNode
              key={child.id}
              category={child}
              depth={depth + 1}
              allCategories={allCategories}
              onUpdateTag={onUpdateTag}
              onDeleteTag={onDeleteTag}
              onAddTag={onAddTag}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
              onCreateCategory={onCreateCategory}
              onReorderTags={onReorderTags}
              onReorderCategories={onReorderCategories}
              onMoveTag={onMoveTag}
              onMoveCategory={onMoveCategory}
              activeItemId={activeItemId}
              overInfo={overInfo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  categories,
  allCategories,
  onUpdateTag,
  onDeleteTag,
  onAddTag,
  onUpdateCategory,
  onDeleteCategory,
  onCreateCategory,
  onReorderTags,
  onReorderCategories,
  onMoveTag,
  onMoveCategory,
}: CategoryTreeProps) {
  const [showAddRoot, setShowAddRoot] = useState(false);
  const [newRootName, setNewRootName] = useState('');
  const [activeItem, setActiveItem] = useState<{ id: string; type: 'tag' | 'category'; data: Tag | Category } | null>(null);
  const [overInfo, setOverInfo] = useState<{ id: string; side: 'left' | 'right' | 'top' | 'bottom' | 'child' } | null>(null);
  const pointerRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const handler = (e: PointerEvent) => { pointerRef.current = { x: e.clientX, y: e.clientY }; };
    document.addEventListener('pointermove', handler, { passive: true });
    return () => document.removeEventListener('pointermove', handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = String(active.id);
    if (id.startsWith('tag-')) {
      const tagId = Number(id.replace('tag-', ''));
      for (const cat of allCategories) {
        const tag = cat.tags?.find((t) => t.id === tagId);
        if (tag) { setActiveItem({ id, type: 'tag', data: tag }); return; }
      }
    } else if (id.startsWith('cat-')) {
      const catId = Number(id.replace('cat-', ''));
      const cat = allCategories.find((c) => c.id === catId);
      if (cat) setActiveItem({ id, type: 'category', data: cat });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!activeItem) { setOverInfo(null); return; }
    const { over } = event;
    if (!over) { setOverInfo(null); return; }

    const overId = String(over.id);
    if (!overId.startsWith('tag-') && !overId.startsWith('cat-')) {
      setOverInfo(null);
      return;
    }

    // Use elementFromPoint to get the element under cursor for left/right detection
    const clientX = pointerRef.current.x;
    const clientY = pointerRef.current.y;

    if (activeItem.type === 'tag' && overId.startsWith('tag-') && overId !== activeItem.id) {
      const tagId = Number(overId.replace('tag-', ''));
      const tag = allCategories.flatMap((c) => c.tags ?? []).find((t) => t.id === tagId);
      const card = document.querySelector(`[data-tag-card="${overId}"]`);
      if (card) {
        const rect = card.getBoundingClientRect();
        const side: 'left' | 'right' = clientX < rect.left + rect.width / 2 ? 'left' : 'right';
        setOverInfo({ id: overId, side });
        return;
      }
    }

    if (activeItem.type === 'tag' && overId.startsWith('cat-')) {
      const el = document.elementFromPoint(clientX, clientY);
      const bar = el?.closest('[data-cat-bar]');
      if (bar) {
        const rect = bar.getBoundingClientRect();
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;
        const w = rect.width;
        const h = rect.height;
        let side: 'left' | 'right';
        if (relX < w / 2) side = 'left';
        else side = 'right';
        setOverInfo({ id: overId, side });
        return;
      }
    }

    if (activeItem.type === 'category' && overId.startsWith('cat-') && overId !== activeItem.id) {
      const el = document.elementFromPoint(clientX, clientY);
      const bar = el?.closest('[data-cat-bar]');
      if (bar) {
        const rect = bar.getBoundingClientRect();
        const relY = clientY - rect.top;
        const h = rect.height;
        let side: 'top' | 'bottom' | 'child';
        if (relY < h / 3) side = 'top';
        else if (relY > (h * 2) / 3) side = 'bottom';
        else side = 'child';
        setOverInfo({ id: overId, side });
        return;
      }
    }

    setOverInfo(null);
  };

  const handleDragEnd = () => {
    if (activeItem && overInfo) {
      const { id: targetId, side } = overInfo;
      const draggedId = activeItem.id;

      if (activeItem.type === 'tag') {
        const tagId = Number(draggedId.replace('tag-', ''));
        if (side === 'child' && targetId.startsWith('cat-drop-')) {
          const targetCatId = Number(targetId.replace('cat-drop-', ''));
          onMoveTag(tagId, targetCatId);
        } else if (side === 'left' && targetId.startsWith('tag-')) {
          const refTagId = Number(targetId.replace('tag-', ''));
          const refTagCat = allCategories.find((c) => c.tags?.some((t) => t.id === refTagId));
          if (refTagCat) {
            const refTag = refTagCat.tags?.find((t) => t.id === refTagId);
            if (refTag) {
              onReorderTags([{ id: tagId, categoryId: refTagCat.id, sortOrder: refTag.sortOrder - 1 }]);
            }
          }
        } else if (side === 'right' && targetId.startsWith('tag-')) {
          const refTagId = Number(targetId.replace('tag-', ''));
          const refTagCat = allCategories.find((c) => c.tags?.some((t) => t.id === refTagId));
          if (refTagCat) {
            const refTag = refTagCat.tags?.find((t) => t.id === refTagId);
            if (refTag) {
              onReorderTags([{ id: tagId, categoryId: refTagCat.id, sortOrder: refTag.sortOrder + 1 }]);
            }
          }
        } else if (side === 'left' && targetId.startsWith('cat-')) {
          const targetCatId = Number(targetId.replace('cat-', ''));
          onReorderTags([{ id: tagId, categoryId: targetCatId, sortOrder: 0 }]);
        } else if (side === 'right' && targetId.startsWith('cat-')) {
          const targetCatId = Number(targetId.replace('cat-', ''));
          const targetCat = allCategories.find((c) => c.id === targetCatId);
          const sortOrder = (targetCat?.tags?.length ?? 0) + 1;
          onReorderTags([{ id: tagId, categoryId: targetCatId, sortOrder }]);
        }
      } else if (activeItem.type === 'category') {
        const draggedCatId = Number(draggedId.replace('cat-', ''));
        if (side === 'child' && targetId.startsWith('cat-drop-')) {
          const targetCatId = Number(targetId.replace('cat-drop-', ''));
          onMoveCategory(draggedCatId, targetCatId);
        } else if (side === 'top' && targetId.startsWith('cat-')) {
          const refCatId = Number(targetId.replace('cat-', ''));
          const refCat = allCategories.find((c) => c.id === refCatId);
          if (refCat) {
            onReorderCategories([{ id: draggedCatId, parentId: refCat.parentId, sortOrder: refCat.sortOrder - 1 }]);
          }
        } else if (side === 'bottom' && targetId.startsWith('cat-')) {
          const refCatId = Number(targetId.replace('cat-', ''));
          const refCat = allCategories.find((c) => c.id === refCatId);
          if (refCat) {
            onReorderCategories([{ id: draggedCatId, parentId: refCat.parentId, sortOrder: refCat.sortOrder + 1 }]);
          }
        }
      }
    }
    setActiveItem(null);
    setOverInfo(null);
  };

  const handleRootSubmit = () => {
    if (!newRootName.trim()) return;
    onCreateCategory(newRootName.trim(), null);
    setNewRootName('');
    setShowAddRoot(false);
  };

  const isDragging = activeItem !== null;
  const activeItemId = activeItem?.id ?? null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div>
      {categories.map((cat) => (
        <SortableCategoryNode
          key={cat.id}
          category={cat}
          depth={0}
          allCategories={allCategories}
          onUpdateTag={onUpdateTag}
          onDeleteTag={onDeleteTag}
          onAddTag={onAddTag}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
          onCreateCategory={onCreateCategory}
          onReorderTags={onReorderTags}
          onReorderCategories={onReorderCategories}
          onMoveTag={onMoveTag}
          onMoveCategory={onMoveCategory}
          activeItemId={activeItemId}
          overInfo={overInfo}
        />
      ))}

      <DragOverlay dropAnimation={null}>
        {activeItem?.type === 'tag' ? (
          <div className="opacity-90 shadow-2xl scale-105 rotate-1 cursor-grabbing">
            <TagCard tag={activeItem.data as Tag} onUpdate={() => {}} onDelete={() => {}} />
          </div>
        ) : activeItem?.type === 'category' ? (
          <div className="opacity-90 shadow-2xl scale-105 rotate-1 cursor-grabbing flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border-strong bg-bg-secondary/90 font-bold font-heading text-sm">
            {(activeItem.data as Category).name}
          </div>
        ) : null}
      </DragOverlay>

      {showAddRoot ? (
        <div className="flex gap-2 mt-2 ml-2 flex-wrap sm:flex-nowrap category-enter">
          <input
            type="text"
            value={newRootName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRootName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleRootSubmit(); if (e.key === 'Escape') setShowAddRoot(false); }}
            placeholder="分类名称..."
            className="min-w-0 flex-1 px-4 py-2 text-sm rounded-xl border-2 border-border-strong outline-none focus:border-accent-primary"
            autoFocus
          />
          <button onClick={handleRootSubmit} className="px-4 py-2 text-sm bg-accent-primary text-white rounded-xl border-2 border-border-strong hover:bg-orange-600 transition-colors shadow-[2px_2px_0_var(--color-border-strong)] whitespace-nowrap">添加</button>
          <button onClick={() => setShowAddRoot(false)} className="px-4 py-2 text-sm bg-bg-secondary rounded-xl border-2 border-border-strong hover:bg-border-light transition-colors whitespace-nowrap">取消</button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddRoot(true)}
          className="w-full mt-2 py-3 border-2 border-dashed border-border-light rounded-xl text-sm text-text-secondary hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/5 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          添加一级分类
        </button>
      )}

      {categories.length === 0 && !showAddRoot && (
        <div className="text-center py-12 text-text-secondary">
          <div className="mb-3 opacity-40">
            <FolderPlus size={40} className="mx-auto" />
          </div>
          还没有分类标签<br />
          <span className="text-sm">点击上方按钮创建第一个分类</span>
        </div>
      )}
    </div>
    </DndContext>
  );
}
