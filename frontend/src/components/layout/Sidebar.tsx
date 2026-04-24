import { useState } from 'react';
import { usePageStore } from '../../stores/pageStore';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';

export function Sidebar() {
  const { pages, currentPage, setCurrentPage, createPage, deletePage, updatePage } = usePageStore();
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    if (!newPageName.trim()) return;
    const page = await createPage(newPageName.trim());
    setNewPageName('');
    setShowNewPage(false);
    setCurrentPage(page);
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;
    await updatePage(id, { name: editName.trim() });
    setEditingId(null);
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r-2 border-border-strong bg-bg-secondary/50 min-h-[calc(100vh-57px)]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold font-heading text-sm uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <Layers size={14} />
            我的页面
          </h2>
          <button
            onClick={() => setShowNewPage(true)}
            className="w-7 h-7 rounded-lg bg-accent-primary text-white border-2 border-border-strong flex items-center justify-center hover:bg-orange-600 transition-colors shadow-[2px_2px_0_var(--color-border-strong)]"
          >
            <Plus size={16} />
          </button>
        </div>

        {showNewPage && (
          <div className="mb-3 p-3 bg-bg-card rounded-xl border-2 border-border-strong category-enter">
            <p className="text-xs text-text-secondary mb-2">向不同的朋友展示我不同的一面...</p>
            <input
              type="text"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNewPage(false); }}
              placeholder="页面名称..."
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border-strong outline-none focus:border-accent-primary"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowNewPage(false)} className="px-3 py-1 text-sm bg-bg-secondary rounded-lg border border-border-strong hover:bg-border-light transition-colors">取消</button>
              <button onClick={handleCreate} className="flex-1 px-3 py-1 text-sm bg-accent-primary text-white rounded-lg border border-border-strong hover:bg-orange-600 transition-colors">创建</button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                currentPage?.id === page.id
                  ? 'bg-accent-primary text-white border-2 border-border-strong shadow-[2px_2px_0_var(--color-border-strong)]'
                  : 'bg-bg-card border-2 border-transparent hover:border-border-light'
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {editingId === page.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(page.id); if (e.key === 'Escape') setEditingId(null); }}
                  onBlur={() => handleEdit(page.id)}
                  className="flex-1 px-2 py-0.5 text-sm rounded border border-border-strong outline-none bg-white"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="flex-1 font-medium text-sm truncate">{page.name}</span>
                  {page._count && (
                    <span className={`group-hover:hidden text-xs px-1.5 py-0.5 rounded-full ${currentPage?.id === page.id ? 'bg-white/20' : 'bg-bg-secondary'}`}>
                      {page._count.tags}
                    </span>
                  )}
                </>
              )}

              <div className={`absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${editingId === page.id ? 'hidden' : ''}`}>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(page.id); setEditName(page.name); }}
                  className="p-1 rounded hover:bg-black/10"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('确定删除这个页面?')) deletePage(page.id); }}
                  className="p-1 rounded hover:bg-red-500/20 text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {pages.length === 0 && !showNewPage && (
            <div className="text-center py-8 text-text-secondary text-sm">
              <div className="mb-3">
                <Layers size={32} className="mx-auto opacity-30" />
              </div>
              还没有页面<br />
              <button onClick={() => setShowNewPage(true)} className="text-accent-primary underline mt-1">创建一个吧</button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
