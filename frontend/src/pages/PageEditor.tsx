import { useState, useMemo } from 'react';
import { usePageStore } from '../stores/pageStore';
import { useAuthStore } from '../stores/authStore';
import { CategoryTree } from '../components/category/CategoryTree';
import { QuickAddInput } from '../components/tag/QuickAddInput';
import { ShareModal } from '../components/share/ShareModal';
import { Button, Modal, Input } from '../components/ui';
import { Share2, Settings, Globe, Save, Check, Loader2 } from 'lucide-react';

export function PageEditor() {
  const {
    currentPage,
    updatePage,
    createTag,
    updateTag,
    deleteTag,
    reorderTags,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    saveContent,
    saving,
    isDirty,
    markDirty,
    moveTag,
    moveCategory,
  } = usePageStore();
  const { user } = useAuthStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [editDescOpen, setEditDescOpen] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editName, setEditName] = useState('');

  const allCategories = useMemo(() => {
    const flat: any[] = [];
    if (currentPage?.categories) {
      const flatten = (cats: any[]) => {
        for (const cat of cats) {
          flat.push(cat);
          if (cat.children) flatten(cat.children);
        }
      };
      flatten(currentPage?.categories ?? []);
    }
    return flat;
  }, [currentPage?.categories]);

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        <div className="text-center px-4">
          <Globe size={48} className="mx-auto mb-4 opacity-20 md:size-16" />
          <p className="text-base md:text-lg font-medium">选择一个页面开始</p>
          <p className="text-sm mt-1 hidden md:block">或从左侧创建一个新页面</p>
          <p className="text-sm mt-1 md:hidden">点击顶部菜单创建新页面</p>
        </div>
      </div>
    );
  }

  const handleAddTag = (name: string, categoryId: number, confidence?: number, confidenceLabel?: string) => {
    createTag(categoryId, name, confidence, undefined, confidenceLabel);
  };

  const handleSave = async () => {
    try {
      await saveContent();
    } catch {
      // 错误已在 store 中处理
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => { setEditName(currentPage.name); setEditNameOpen(true); }}
                className="text-2xl md:text-3xl font-bold font-heading truncate hover:text-accent-primary transition-colors"
              >
                {currentPage.name}
              </button>
            </div>
            {currentPage.description && (
              <p className="text-text-secondary text-sm">{currentPage.description}</p>
            )}
            <p className="text-xs text-text-secondary/60 mt-1">
              @{user?.nickname} 的标签页面
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            {/* 保存状态和按钮 */}
            <div className="flex items-center gap-2">
              {saving ? (
                <span className="flex items-center gap-1 text-sm text-text-secondary/60">
                  <Loader2 size={14} className="animate-spin" />
                  保存中...
                </span>
              ) : isDirty ? (
                <span className="flex items-center gap-1 text-sm text-amber-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  未保存
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Check size={14} />
                  已保存
                </span>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving || !isDirty}
              >
                <Save size={14} className="mr-1" />
                <span className="hidden sm:inline">保存</span>
              </Button>
            </div>

            <Button variant="secondary" size="sm" onClick={() => { setEditDesc(currentPage.description); setEditName(currentPage.name); setEditDescOpen(true); }}>
              <Settings size={14} className="mr-1" />
              <span className="hidden sm:inline">编辑页面</span>
              <span className="sm:hidden">编辑</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 size={14} className="mr-1" />
              分享
            </Button>
          </div>
        </div>

        <QuickAddInput
          categories={currentPage.categories ?? []}
          onAdd={handleAddTag}
        />

        <CategoryTree
          categories={currentPage.categories ?? []}
          allCategories={allCategories}
          onUpdateTag={(tagId, data) => { updateTag(tagId, data); markDirty(); }}
          onDeleteTag={(tagId) => { deleteTag(tagId); markDirty(); }}
          onAddTag={handleAddTag}
          onUpdateCategory={(id, data) => { updateCategory(id, data); markDirty(); }}
          onDeleteCategory={(id) => { deleteCategory(id); markDirty(); }}
          onCreateCategory={(name, parentId) => createCategory(parentId, name)}
          onReorderTags={(categoryId, tagIds) => { reorderTags(categoryId, tagIds); markDirty(); }}
          onReorderCategories={(parentId, categoryIds) => { reorderCategories(parentId, categoryIds); markDirty(); }}
          onMoveTag={(tagId, targetCategoryId) => { moveTag(tagId, targetCategoryId); markDirty(); }}
          onMoveCategory={(catId, newParentId) => { moveCategory(catId, newParentId); markDirty(); }}
        />
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} page={currentPage} />

      <Modal open={editDescOpen} onClose={() => setEditDescOpen(false)} title="编辑页面信息" size="sm">
        <div className="space-y-4">
          <Input
            label="页面名称"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="页面名称"
          />
          <Input
            label="页面描述（可选）"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="一句话介绍这个页面..."
          />
          <Button onClick={() => { updatePage(currentPage.id, { name: editName, description: editDesc }); setEditDescOpen(false); }} className="w-full">
            保存
          </Button>
        </div>
      </Modal>
    </div>
  );
}
