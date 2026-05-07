import React, { useState, useRef, useMemo, memo } from 'react';
import type { Category, Tag } from '../../types';
import { TagCard } from '../tag/TagCard';
import { ConfidenceSlider } from '../tag/ConfidenceSlider';
import { usePageStore } from '../../stores/pageStore';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, FolderPlus, GripVertical, ArrowDownRight, TagIcon } from 'lucide-react';
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
  type DragEndEvent,
} from '@dnd-kit/core';

const ENABLE_DRAG = false;

interface CategoryTreeProps {
  categories: Category[];
  allCategories: Category[];
  onUpdateTag: (tagId: number, data: Partial<Tag>) => void;
  onDeleteTag: (tagId: number) => void;
  onAddTag: (name: string, categoryId: number, confidence?: number, confidenceLabel?: string) => void;
  onUpdateCategory: (id: number, data: { name?: string; description?: string; confidence?: number; confidenceLabel?: string }) => void;
  onDeleteCategory: (id: number) => void;
  onCreateCategory: (name: string, parentId: number | null) => void;
  onReorderTags: (categoryId: number, tagIds: number[]) => void;
  onReorderCategories: (parentId: number | null, categoryIds: number[]) => void;
  onMoveTag: (tagId: number, targetCategoryId: number) => void;
  onMoveCategory: (categoryId: number, newParentId: number | null) => void;
  onFocusCategory?: (categoryId: number) => void;
}

function SortableTagCardInner({ tag, onUpdate, onDelete, activeItemId }: {
  tag: Tag;
  onUpdate: (d: Partial<Tag>) => void;
  onDelete: () => void;
  activeItemId: string | null;
}) {
  const { attributes, listeners, setNodeRef } = useSortable({ id: `tag-${tag.id}` });
  const isThisDragging = activeItemId === `tag-${tag.id}`;
  const dragHandleRef = useRef<HTMLDivElement | null>(null);

  const isMobile = window.matchMedia?.('(max-width: 767px)').matches ?? false;

  if (isThisDragging) {
    return (
      <div ref={setNodeRef} className="tag-card rounded-xl border-2 border-dashed border-accent-primary/40 bg-accent-primary/5 opacity-50" style={{ minHeight: 72 }} />
    );
  }

  const wrapperListeners = ENABLE_DRAG ? (isMobile ? {} : listeners) : {};
  const cardListeners = ENABLE_DRAG ? (isMobile ? listeners : {}) : {};

  const wrapperAttributes = { ...attributes, 'data-tag-card': `tag-${tag.id}` };

  return (
    <div
      ref={setNodeRef}
      {...wrapperAttributes}
      {...wrapperListeners}
      className="md:cursor-grab"
    >
      <TagCard
        tag={tag}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleRef={dragHandleRef}
        dragListeners={cardListeners}
      />
    </div>
  );
}

const SortableTagCard = memo(SortableTagCardInner);

function SortableCategoryNodeInner({
  category,
  depth,
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
  onFocusCategory,
  activeItemId,
}: {
  category: Category;
  depth: number;
  allCategories: Category[];
  onUpdateTag: (tagId: number, data: Partial<Tag>) => void;
  onDeleteTag: (tagId: number) => void;
  onAddTag: (name: string, categoryId: number, confidence?: number, confidenceLabel?: string) => void;
  onUpdateCategory: (id: number, data: { name?: string; description?: string; confidence?: number; confidenceLabel?: string }) => void;
  onDeleteCategory: (id: number) => void;
  onCreateCategory: (name: string, parentId: number | null) => void;
  onReorderTags: (categoryId: number, tagIds: number[]) => void;
  onReorderCategories: (parentId: number | null, categoryIds: number[]) => void;
  onMoveTag: (tagId: number, targetCategoryId: number) => void;
  onMoveCategory: (categoryId: number, newParentId: number | null) => void;
  onFocusCategory?: (categoryId: number) => void;
  activeItemId: string | null;
}) {
  const { showConfirm } = usePageStore();
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

  const { setNodeRef: setDropRef } = useDroppable({ id: `cat-drop-${category.id}` });
  const { attributes, listeners, setNodeRef: setDragRef } = useSortable({ id: `cat-${category.id}` });
  const catDragHandleRef = useRef<HTMLButtonElement | null>(null);

  const isMobile = window.matchMedia?.('(max-width: 767px)').matches ?? false;

  const isThisDragging = activeItemId === `cat-${category.id}`;

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
      className={`${depth === 0 ? '' : 'ml-2 sm:ml-4 pl-2 sm:pl-4 border-l-2 border-border-light'} mb-3`}
    >
      {isThisDragging ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-accent-primary/40 bg-accent-primary/5 mb-2 opacity-50" style={{ minHeight: 52 }} />
      ) : (
        <div
          ref={setDragRef}
          data-cat-bar={`cat-bar-${category.id}`}
          className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border-strong bg-bg-secondary/70 group transition-all duration-150 mb-2`}
        >
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
          {ENABLE_DRAG && isMobile && (
            <button
              ref={catDragHandleRef}
              {...listeners}
              className="p-0.5 rounded cursor-grab active:cursor-grabbing text-text-secondary/40 hover:text-text-secondary flex-shrink-0"
              style={{ touchAction: 'none' }}
              title="拖动分类"
            >
              <GripVertical size={16} />
            </button>
          )}

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
              className="flex-1 text-left font-bold font-heading text-sm md:text-base hover:text-accent-primary transition-colors truncate"
              onDoubleClick={() => { setIsEditing(true); }}
              title={category.description || category.name}
              {...attributes}
              {...(ENABLE_DRAG ? (isMobile ? {} : listeners) : {})}
            >
              {category.name}
              <span className="ml-1 md:ml-2 text-xs font-normal text-text-secondary whitespace-nowrap">
                ({(category.tags ?? []).length + (category.children ?? []).reduce((s, c) => s + (c.tags ?? []).length, 0)} 项)
              </span>
            </button>
          )}

          <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onFocusCategory && onFocusCategory(category.id)}
              className="p-1.5 rounded-lg hover:bg-accent-secondary/20 transition-colors"
              title="下潜到该分类"
            >
              <ArrowDownRight size={14} className="text-accent-secondary" />
            </button>
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
              onClick={() => showConfirm({ title: '删除分类', message: `确定删除分类「${category.name}」及所有子分类和标签吗？`, onConfirm: () => onDeleteCategory(category.id) })}
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
        <div className="ml-2">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(category.tags ?? []).map((tag) => (
                <SortableTagCard
                  key={tag.id}
                  tag={tag}
                  onUpdate={(data) => onUpdateTag(tag.id, data)}
                  onDelete={() => onDeleteTag(tag.id)}
                  activeItemId={activeItemId}
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
              allCategories={[]}
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
              onFocusCategory={onFocusCategory}
              activeItemId={activeItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const SortableCategoryNode = memo(SortableCategoryNodeInner);

// 辅助函数：查找标签所在的分类ID
function findTagCategory(categories: Category[], tagId: number): number | null {
  for (const cat of categories) {
    if (cat.tags?.some(t => t.id === tagId)) {
      return cat.id;
    }
    const found = findTagCategory(cat.children ?? [], tagId);
    if (found !== null) return found;
  }
  return null;
}

// 辅助函数：获取某分类下所有标签ID
function getTagIds(category: Category): number[] {
  return (category.tags ?? []).map(t => t.id);
}

// 辅助函数：查找分类的父分类ID
function findCategoryParent(categories: Category[], catId: number): number | null {
  for (const cat of categories) {
    if (cat.children?.some(c => c.id === catId)) {
      return cat.id;
    }
    const found = findCategoryParent(cat.children ?? [], catId);
    if (found !== null) return found;
  }
  return null;
}

// 辅助函数：获取同级分类的ID列表
function getSiblingCategoryIds(categories: Category[], parentId: number | null): number[] {
  if (parentId === null) {
    return categories.map(c => c.id);
  }
  const parent = categories.find(c => c.id === parentId);
  return (parent?.children ?? []).map(c => c.id);
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
  onFocusCategory,
}: CategoryTreeProps) {
  const { showConfirm } = usePageStore();
  const [showAddRoot, setShowAddRoot] = useState(false);
  const [newRootName, setNewRootName] = useState('');
  const [activeItem, setActiveItem] = useState<{ id: string; type: 'tag' | 'category'; data: Tag | Category } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = String(active.id);

    if (id.startsWith('tag-')) {
      const tagId = Number(id.replace('tag-', ''));
      const catId = findTagCategory(categories, tagId);
      if (catId !== null) {
        const tag = categories.reduce<Tag | null>((found, cat) => {
          if (found) return found;
          const t = cat.tags?.find(t => t.id === tagId);
          return t ?? null;
        }, null);
        if (tag) {
          setActiveItem({ id, type: 'tag', data: { ...tag, categoryId: catId } as any });
        }
      }
    } else if (id.startsWith('cat-')) {
      const catId = Number(id.replace('cat-', ''));
      const cat = categories.reduce<Category | null>((found, c) => {
        if (found) return found;
        if (c.id === catId) return c;
        const search = (cats: Category[]): Category | null => {
          for (const child of cats) {
            if (child.id === catId) return child;
            const inChild = search(child.children ?? []);
            if (inChild) return inChild;
          }
          return null;
        };
        return search(c.children ?? []);
      }, null);
      if (cat) {
        setActiveItem({ id, type: 'category', data: cat });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) {
      setActiveItem(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeItem?.type === 'tag' && activeId.startsWith('tag-')) {
      const tagId = Number(activeId.replace('tag-', ''));
      const sourceCatId = findTagCategory(categories, tagId);

      // 标签放入分类
      if (overId.startsWith('cat-drop-')) {
        const targetCatId = Number(overId.replace('cat-drop-', ''));
        if (sourceCatId !== null && sourceCatId !== targetCatId) {
          onMoveTag(tagId, targetCatId);
        }
      }
      // 标签排序
      else if (overId.startsWith('tag-') && overId !== activeId) {
        const refTagId = Number(overId.replace('tag-', ''));
        const refCatId = findTagCategory(categories, refTagId);
        if (sourceCatId !== null && refCatId !== null) {
          // 找到源分类和目标分类
          const findCat = (cats: Category[]): Category | null => {
            for (const cat of cats) {
              if (cat.id === sourceCatId) return cat;
              const found = findCat(cat.children ?? []);
              if (found) return found;
            }
            return null;
          };
          const sourceCat = findCat(categories);
          if (sourceCat) {
            const tagIds = getTagIds(sourceCat);
            const oldIdx = tagIds.indexOf(tagId);
            const refIdx = tagIds.indexOf(refTagId);

            if (oldIdx !== -1 && refIdx !== -1) {
              tagIds.splice(oldIdx, 1);
              const newRefIdx = tagIds.indexOf(refTagId);
              if (newRefIdx !== -1) {
                tagIds.splice(newRefIdx + 1, 0, tagId);
              } else {
                tagIds.push(tagId);
              }
              onReorderTags(sourceCatId, tagIds);
            }
          }
        }
      }
    } else if (activeItem?.type === 'category' && activeId.startsWith('cat-')) {
      const draggedCatId = Number(activeId.replace('cat-', ''));

      // 分类变为另一分类的子分类
      if (overId.startsWith('cat-drop-')) {
        const targetCatId = Number(overId.replace('cat-drop-', ''));
        const currentParentId = findCategoryParent(categories, draggedCatId);
        if (currentParentId !== targetCatId) {
          onMoveCategory(draggedCatId, targetCatId);
        }
      }
      // 分类排序
      else if (overId.startsWith('cat-') && overId !== activeId) {
        const refCatId = Number(overId.replace('cat-', ''));
        const parentId = findCategoryParent(categories, refCatId);
        const currentParentId = findCategoryParent(categories, draggedCatId);

        if (parentId === currentParentId) {
          const siblingIds = getSiblingCategoryIds(categories, parentId);
          const oldIdx = siblingIds.indexOf(draggedCatId);
          const refIdx = siblingIds.indexOf(refCatId);

          if (oldIdx !== -1 && refIdx !== -1) {
            siblingIds.splice(oldIdx, 1);
            const newRefIdx = siblingIds.indexOf(refCatId);
            if (newRefIdx !== -1) {
              siblingIds.splice(newRefIdx + 1, 0, draggedCatId);
            } else {
              siblingIds.push(draggedCatId);
            }
            onReorderCategories(parentId, siblingIds);
          }
        }
      }
    }

    setActiveItem(null);
  };

  const handleRootSubmit = () => {
    if (!newRootName.trim()) return;
    onCreateCategory(newRootName.trim(), null);
    setNewRootName('');
    setShowAddRoot(false);
  };

  const activeItemId = activeItem?.id ?? null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
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
          onFocusCategory={onFocusCategory}
          activeItemId={activeItemId}
        />
      ))}

      <div data-dnd-overlay-wrapper>
        <DragOverlay dropAnimation={null}>
          {activeItem?.type === 'tag' ? (
          <div className="relative shadow-2xl rotate-3 cursor-grabbing">
            <div className="[&_*]:!blur-[0.2px]">
              <TagCard tag={activeItem.data as Tag} onUpdate={() => {}} onDelete={() => {}} />
            </div>
          </div>
        ) : activeItem?.type === 'category' ? (
          <div className="opacity-60 shadow-2xl rotate-3 cursor-grabbing flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border-strong bg-bg-secondary/90 font-bold font-heading text-sm">
            {(activeItem.data as Category).name}
          </div>
        ) : null}
        </DragOverlay>
      </div>

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
            <TagIcon size={40} className="mx-auto" />
          </div>
          暂无分类或标签<br />
          <span className="text-sm">快创建你的第一个标签吧</span>
        </div>
      )}
    </div>
    </DndContext>
  );
}
