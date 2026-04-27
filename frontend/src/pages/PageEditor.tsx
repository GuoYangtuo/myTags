import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { usePageStore } from '../stores/pageStore';
import { CategoryTree } from '../components/category/CategoryTree';
import { FocusBreadcrumb } from '../components/category/FocusBreadcrumb';
import { QuickAddInput } from '../components/tag/QuickAddInput';
import { TagCard } from '../components/tag/TagCard';
import { ShareModal } from '../components/share/ShareModal';
import { SunburstChart } from '../components/sunburst/SunburstChart';
import { Button, Modal, Input } from '../components/ui';
import { Settings, Share2, Globe, ArrowLeft, CircleDot } from 'lucide-react';

interface PageEditorProps {
  shareOpen: boolean;
  onShareOpen: () => void;
  onShareClose: () => void;
  sunburstOpen: boolean;
  onToggleSunburst: () => void;
  /** "full" = full-area sunburst panel (desktop), "none" = editor-only, undefined = mobile split */
  sunburstSquareSize?: 'full' | 'none';
}

export function PageEditor({ shareOpen, onShareOpen, onShareClose, sunburstOpen, onToggleSunburst, sunburstSquareSize }: PageEditorProps) {
  const {
    currentPage,
    loading,
    updatePage,
    createTag,
    createRootTag,
    updateTag,
    deleteTag,
    reorderTags,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    isDirty,
    markDirty,
    moveTag,
    moveCategory,
    focusedCategory,
    focusedCategoryPath,
    focusedCategoryId,
    unfocusCategory,
    focusCategory,
    navigateFocusUp,
  } = usePageStore();
  const [editDescOpen, setEditDescOpen] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editName, setEditName] = useState('');

  // Mobile sunburst container: height equals its own width (square) via ResizeObserver
  const [mobileSunburstHeight, setMobileSunburstHeight] = useState(0);
  const mobileSunburstRefCallback = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setMobileSunburstHeight(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    setMobileSunburstHeight(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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

  const isFocusMode = focusedCategoryId !== null;

  const focusDisplayCategories = useMemo(() => {
    if (!focusedCategory) return [];
    return focusedCategory.children ?? [];
  }, [focusedCategory]);

  const focusDisplayTags = useMemo(() => {
    if (!focusedCategory) return [];
    return focusedCategory.tags ?? [];
  }, [focusedCategory]);

  const focusAllCategories = useMemo(() => {
    const flat: any[] = [];
    const flatten = (cats: any[]) => {
      for (const cat of cats) {
        flat.push(cat);
        if (cat.children) flatten(cat.children);
      }
    };
    flatten(focusedCategory?.children ?? []);
    return flat;
  }, [focusedCategory]);

  const displayPageName = focusedCategoryPath.length > 0
    ? focusedCategoryPath[focusedCategoryPath.length - 1].name
    : currentPage?.name ?? '';

  const displayDescription = focusedCategory?.description ?? currentPage?.description ?? '';

  if (loading && currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        <div className="text-center px-4">
          <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-base md:text-lg font-medium">加载中...</p>
        </div>
      </div>
    );
  }

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

  const handleSunburstUnfocus = () => {
    unfocusCategory();
  };

  const handleSunburstUnfocusToParent = () => {
    if (focusedCategoryPath.length > 1) {
      const parentId = focusedCategoryPath[focusedCategoryPath.length - 2].id;
      navigateFocusUp(parentId);
    } else {
      unfocusCategory();
    }
  };

  const renderEditorContent = () => (
    <>
      {isFocusMode && <FocusBreadcrumb />}

      <div className="flex items-start justify-between mb-2 gap-3 mt-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold font-heading truncate text-text-primary">
              {displayPageName}
            </h1>
          </div>
          {displayDescription && (
            <p className="text-text-secondary text-sm">{displayDescription}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
          {isFocusMode ? (
            <Button variant="secondary" size="sm" onClick={unfocusCategory}>
              <ArrowLeft size={14} className="mr-1" />
              <span className="hidden sm:inline">返回根页面</span>
              <span className="sm:hidden">返回</span>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => { setEditDesc(currentPage.description); setEditName(currentPage.name); setEditDescOpen(true); }}>
              <Settings size={14} className="mr-1" />
              <span className="hidden sm:inline">页面信息</span>
              <span className="sm:hidden">编辑</span>
            </Button>
          )}
        </div>
      </div>

      {isFocusMode ? (
        <>
          <QuickAddInput
            categories={focusDisplayCategories}
            onAdd={(name, categoryId, confidence, confidenceLabel) => createTag(categoryId, name, confidence, undefined, confidenceLabel)}
            onAddRoot={(name, confidence, confidenceLabel) => createRootTag(name, confidence, undefined, confidenceLabel)}
          />

          {focusDisplayTags.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {focusDisplayTags.map((tag) => (
                  <TagCard
                    key={tag.id}
                    tag={tag}
                    onUpdate={(data) => { updateTag(tag.id, data); markDirty(); }}
                    onDelete={() => { deleteTag(tag.id); markDirty(); }}
                  />
                ))}
              </div>
            </div>
          )}

          <CategoryTree
            categories={focusDisplayCategories}
            allCategories={focusAllCategories}
            onUpdateTag={(tagId, data) => { updateTag(tagId, data); markDirty(); }}
            onDeleteTag={(tagId) => { deleteTag(tagId); markDirty(); }}
            onAddTag={(name, categoryId, confidence, confidenceLabel) => createTag(categoryId, name, confidence, undefined, confidenceLabel)}
            onUpdateCategory={(id, data) => { updateCategory(id, data); markDirty(); }}
            onDeleteCategory={(id) => { deleteCategory(id); markDirty(); }}
            onCreateCategory={(name, parentId) => createCategory(parentId, name)}
            onReorderTags={(categoryId, tagIds) => { reorderTags(categoryId, tagIds); markDirty(); }}
            onReorderCategories={(parentId, categoryIds) => { reorderCategories(parentId, categoryIds); markDirty(); }}
            onMoveTag={(tagId, targetCategoryId) => { moveTag(tagId, targetCategoryId); markDirty(); }}
            onMoveCategory={(catId, newParentId) => { moveCategory(catId, newParentId); markDirty(); }}
            onFocusCategory={(categoryId) => focusCategory(categoryId)}
          />
        </>
      ) : (
        <>
          <QuickAddInput
            categories={currentPage.categories ?? []}
            onAdd={handleAddTag}
            onAddRoot={(name, confidence, confidenceLabel) => createRootTag(name, confidence, undefined, confidenceLabel)}
          />

          {(currentPage.rootTags ?? []).length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(currentPage.rootTags ?? []).map((tag) => (
                  <TagCard
                    key={tag.id}
                    tag={tag}
                    onUpdate={(data) => { updateTag(tag.id, data); markDirty(); }}
                    onDelete={() => { deleteTag(tag.id); markDirty(); }}
                  />
                ))}
              </div>
            </div>
          )}

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
            onFocusCategory={(categoryId) => usePageStore.getState().focusCategory(categoryId)}
          />
        </>
      )}
    </>
  );
  
  return (
    <>
      {/* Normal full-width layout */}
      {!sunburstOpen && (
        <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
            {isFocusMode && <FocusBreadcrumb />}

            <div className="flex items-start justify-between mb-2 gap-3 mt-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold font-heading truncate text-text-primary">
                    {displayPageName}
                  </h1>
                </div>
                {displayDescription && (
                  <p className="text-text-secondary text-sm">{displayDescription}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                {isFocusMode ? (
                  <Button variant="secondary" size="sm" onClick={unfocusCategory}>
                    <ArrowLeft size={14} className="mr-1" />
                    <span className="hidden sm:inline">返回根页面</span>
                    <span className="sm:hidden">返回</span>
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => { setEditDesc(currentPage.description); setEditName(currentPage.name); setEditDescOpen(true); }}>
                    <Settings size={14} className="mr-1" />
                    <span className="hidden sm:inline">页面信息</span>
                    <span className="sm:hidden">编辑</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onToggleSunburst}
                  className="hidden md:flex"
                >
                  <CircleDot size={14} className="mr-1" />
                  旭日图
                </Button>
                {currentPage && (
                  <Button variant="primary" size="sm" onClick={onShareOpen} className="hidden md:flex">
                    <Share2 size={14} className="mr-1" />
                    分享
                  </Button>
                )}
              </div>
            </div>

            {isFocusMode ? (
              <>
                <QuickAddInput
                  categories={focusDisplayCategories}
                  onAdd={(name, categoryId, confidence, confidenceLabel) => createTag(categoryId, name, confidence, undefined, confidenceLabel)}
                  onAddRoot={(name, confidence, confidenceLabel) => createRootTag(name, confidence, undefined, confidenceLabel)}
                />

                {focusDisplayTags.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
                      {focusDisplayTags.map((tag) => (
                        <TagCard
                          key={tag.id}
                          tag={tag}
                          onUpdate={(data) => { updateTag(tag.id, data); markDirty(); }}
                          onDelete={() => { deleteTag(tag.id); markDirty(); }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <CategoryTree
                  categories={focusDisplayCategories}
                  allCategories={focusAllCategories}
                  onUpdateTag={(tagId, data) => { updateTag(tagId, data); markDirty(); }}
                  onDeleteTag={(tagId) => { deleteTag(tagId); markDirty(); }}
                  onAddTag={(name, categoryId, confidence, confidenceLabel) => createTag(categoryId, name, confidence, undefined, confidenceLabel)}
                  onUpdateCategory={(id, data) => { updateCategory(id, data); markDirty(); }}
                  onDeleteCategory={(id) => { deleteCategory(id); markDirty(); }}
                  onCreateCategory={(name, parentId) => createCategory(parentId, name)}
                  onReorderTags={(categoryId, tagIds) => { reorderTags(categoryId, tagIds); markDirty(); }}
                  onReorderCategories={(parentId, categoryIds) => { reorderCategories(parentId, categoryIds); markDirty(); }}
                  onMoveTag={(tagId, targetCategoryId) => { moveTag(tagId, targetCategoryId); markDirty(); }}
                  onMoveCategory={(catId, newParentId) => { moveCategory(catId, newParentId); markDirty(); }}
                  onFocusCategory={(categoryId) => focusCategory(categoryId)}
                />
              </>
            ) : (
              <>
                <QuickAddInput
                  categories={currentPage.categories ?? []}
                  onAdd={handleAddTag}
                  onAddRoot={(name, confidence, confidenceLabel) => createRootTag(name, confidence, undefined, confidenceLabel)}
                />

                {(currentPage.rootTags ?? []).length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
                      {(currentPage.rootTags ?? []).map((tag) => (
                        <TagCard
                          key={tag.id}
                          tag={tag}
                          onUpdate={(data) => { updateTag(tag.id, data); markDirty(); }}
                          onDelete={() => { deleteTag(tag.id); markDirty(); }}
                        />
                      ))}
                    </div>
                  </div>
                )}

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
                  onFocusCategory={(categoryId) => usePageStore.getState().focusCategory(categoryId)}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Full-area sunburst (desktop square panel) */}
      {sunburstOpen && sunburstSquareSize === 'full' && (
        <SunburstChart />
      )}

      {/* Mobile split: sunburst top + editor bottom */}
      {sunburstOpen && sunburstSquareSize === 'none' && (
        <div className="flex flex-col">
          {/* Mobile sunburst top — scrolls into view as user scrolls the page */}
          <div
            className="block md:hidden w-full flex-shrink-0 border-b-2 border-border-strong bg-bg-secondary/30"
            ref={mobileSunburstRefCallback}
            style={{ height: mobileSunburstHeight > 0 ? `${mobileSunburstHeight}px` : '50vw' }}
          >
            <SunburstChart />
          </div>

          {/* Editor panel */}
          <div className="flex-1">
            {/* Editor header */}
            <div className="sticky top-0 z-10 bg-bg-primary border-b-2 border-border-light px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold font-heading text-sm text-text-primary truncate max-w-[200px]">
                  {displayPageName}
                </h2>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={onToggleSunburst} title="关闭旭日图">
                  <CircleDot size={14} className="mr-1" />
                  <span>旭日图</span>
                </Button>
                <Button variant="primary" size="sm" onClick={onShareOpen} className="hidden md:flex">
                  <Share2 size={14} className="mr-1" />
                  分享
                </Button>
              </div>
            </div>

            <div className="px-4 py-4 pb-24">
              {renderEditorContent()}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {!isFocusMode && currentPage && (
        <ShareModal open={shareOpen} onClose={onShareClose} page={currentPage} />
      )}

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
    </>
  );
}
