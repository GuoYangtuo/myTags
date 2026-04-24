import React, { useState } from 'react';
import type { Category, Tag } from '../../types';
import { TagCard } from '../tag/TagCard';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

interface CategoryTreeProps {
  categories: Category[];
  allCategories: Category[];
  onUpdateTag: (tagId: number, data: Partial<Tag>) => void;
  onDeleteTag: (tagId: number) => void;
  onAddTag: (name: string, categoryId: number) => void;
  onUpdateCategory: (id: number, data: { name?: string; parentId?: number | null }) => void;
  onDeleteCategory: (id: number) => void;
  onCreateCategory: (name: string, parentId?: number | null) => void;
  onReorderTags: (items: { id: number; categoryId: number; sortOrder: number }[]) => void;
  onReorderCategories: (items: { id: number; parentId: number | null; sortOrder: number }[]) => void;
  onMoveTag: (tagId: number, targetCategoryId: number) => void;
  onMoveCategory: (categoryId: number, newParentId: number | null) => void;
}

function SortableTagCard({ tag, onUpdate, onDelete }: { tag: Tag; onUpdate: (d: Partial<Tag>) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `tag-${tag.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TagCard tag={tag} onUpdate={onUpdate} onDelete={onDelete} />
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
}: {
  category: Category;
  depth: number;
  allCategories: Category[];
  onUpdateTag: (tagId: number, data: Partial<Tag>) => void;
  onDeleteTag: (tagId: number) => void;
  onAddTag: (name: string, categoryId: number) => void;
  onUpdateCategory: (id: number, data: { name?: string; parentId?: number | null }) => void;
  onDeleteCategory: (id: number) => void;
  onCreateCategory: (name: string, parentId?: number | null) => void;
  onReorderTags: (items: { id: number; categoryId: number; sortOrder: number }[]) => void;
  onReorderCategories: (items: { id: number; parentId: number | null; sortOrder: number }[]) => void;
  onMoveTag: (tagId: number, targetCategoryId: number) => void;
  onMoveCategory: (categoryId: number, newParentId: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const { setNodeRef: setDropRef } = useDroppable({ id: `cat-drop-${category.id}` });
  const { attributes, listeners, setNodeRef: setDragRef, transform, transition, isDragging } = useSortable({ id: `cat-${category.id}` });

  const dragStyle = { transform: CSS.Transform.toString(transform), transition };
  const allTagIds = (category.tags ?? []).map((t) => `tag-${t.id}`);

  const handleChildSubmit = () => {
    if (!newChildName.trim()) return;
    onCreateCategory(newChildName.trim(), category.id);
    setNewChildName('');
    setShowAddChild(false);
    setExpanded(true);
  };

  const handleTagSubmit = () => {
    if (!newTagName.trim()) return;
    onAddTag(newTagName.trim(), category.id);
    setNewTagName('');
    setShowAddTag(false);
  };

  return (
    <div
      ref={setDropRef}
      className={`${category.parentId === null ? '' : 'ml-2 sm:ml-4 pl-2 sm:pl-4 border-l-2 border-border-light'} mb-3`}
    >
      <div
        ref={setDragRef}
        style={dragStyle}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border-strong bg-bg-secondary/70 group transition-all duration-150 mb-2 ${
          isDragging ? 'opacity-40' : ''
        } ${dragOver ? 'ring-2 ring-accent-primary ring-offset-2 bg-accent-primary/5' : ''}`}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 rounded hover:bg-bg-secondary transition-colors"
        >
          {(category.children ?? []).length > 0 || category.tags.length > 0 ? (
            expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <span className="w-4 h-4 inline-block" />
          )}
        </button>

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
            onBlur={() => { if (editName.trim()) onUpdateCategory(category.id, { name: editName.trim() }); setIsEditing(false); }}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') { if (editName.trim()) onUpdateCategory(category.id, { name: editName.trim() }); setIsEditing(false); }
              if (e.key === 'Escape') { setEditName(category.name); setIsEditing(false); }
            }}
            className="flex-1 px-2 py-1 text-sm font-bold rounded border border-accent-primary outline-none bg-white min-w-0"
            autoFocus
            {...attributes}
            {...listeners}
          />
        ) : (
          <button
            className="flex-1 text-left font-bold font-heading text-sm md:text-base hover:text-accent-primary transition-colors cursor-grab active:cursor-grabbing truncate"
            onDoubleClick={() => { setIsEditing(true); }}
            {...attributes}
            {...listeners}
          >
            {category.name}
            <span className="ml-1 md:ml-2 text-xs font-normal text-text-secondary whitespace-nowrap">
              ({(category.children ?? []).reduce((s, c) => s + c.tags.length, 0)} 项)
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

      {showAddChild && (
        <div className="ml-6 mb-2 flex gap-2 category-enter">
          <input
            type="text"
            value={newChildName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChildName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleChildSubmit(); if (e.key === 'Escape') setShowAddChild(false); }}
            placeholder="子分类名称..."
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border-2 border-border-strong outline-none focus:border-accent-secondary"
            autoFocus
          />
          <button onClick={handleChildSubmit} className="px-3 py-1.5 text-sm bg-accent-secondary text-white rounded-lg border border-border-strong hover:opacity-90 transition-opacity">添加</button>
          <button onClick={() => setShowAddChild(false)} className="px-3 py-1.5 text-sm bg-bg-secondary rounded-lg border border-border-strong hover:bg-border-light transition-colors">取消</button>
        </div>
      )}

      {showAddTag && (
        <div className="ml-6 mb-2 flex gap-2 category-enter">
          <input
            type="text"
            value={newTagName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleTagSubmit(); if (e.key === 'Escape') setShowAddTag(false); }}
            placeholder="标签名称..."
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border-2 border-border-strong outline-none focus:border-accent-primary"
            autoFocus
          />
          <button onClick={handleTagSubmit} className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg border border-border-strong hover:bg-orange-600 transition-opacity">添加</button>
          <button onClick={() => setShowAddTag(false)} className="px-3 py-1.5 text-sm bg-bg-secondary rounded-lg border border-border-strong hover:bg-border-light transition-colors">取消</button>
        </div>
      )}

      {expanded && (
        <div className={`ml-2 ${dragOver ? 'ring-1 ring-accent-primary ring-dashed rounded-lg p-2' : ''}`}>
          <SortableContext items={allTagIds} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(category.tags ?? []).map((tag) => (
                <SortableTagCard
                  key={tag.id}
                  tag={tag}
                  onUpdate={(data) => onUpdateTag(tag.id, data)}
                  onDelete={() => onDeleteTag(tag.id)}
                />
              ))}
            </div>
          </SortableContext>

          {(category.tags ?? []).length === 0 && !showAddTag && (
            <button
              onClick={() => setShowAddTag(true)}
              className="w-full py-4 border-2 border-dashed border-border-light rounded-xl text-sm text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors"
            >
              + 添加标签
            </button>
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

  const handleRootSubmit = () => {
    if (!newRootName.trim()) return;
    onCreateCategory(newRootName.trim(), null);
    setNewRootName('');
    setShowAddRoot(false);
  };

  return (
    <div>
      <SortableContext items={[]} strategy={verticalListSortingStrategy}>
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
          />
        ))}
      </SortableContext>

      {showAddRoot ? (
        <div className="flex gap-2 mt-2 ml-2 category-enter">
          <input
            type="text"
            value={newRootName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRootName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleRootSubmit(); if (e.key === 'Escape') setShowAddRoot(false); }}
            placeholder="分类名称..."
            className="flex-1 px-4 py-2 text-sm rounded-xl border-2 border-border-strong outline-none focus:border-accent-primary"
            autoFocus
          />
          <button onClick={handleRootSubmit} className="px-4 py-2 text-sm bg-accent-primary text-white rounded-xl border-2 border-border-strong hover:bg-orange-600 transition-colors shadow-[2px_2px_0_var(--color-border-strong)]">添加</button>
          <button onClick={() => setShowAddRoot(false)} className="px-4 py-2 text-sm bg-bg-secondary rounded-xl border-2 border-border-strong hover:bg-border-light transition-colors">取消</button>
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
  );
}
