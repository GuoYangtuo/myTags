import { Layers, Plus, Share2 } from 'lucide-react';
import { usePageStore } from '../../stores/pageStore';
import { useAuthStore } from '../../stores/authStore';
import { useState } from 'react';

interface BottomNavProps {
  onAddPage?: () => void;
  onShare?: () => void;
}

export function BottomNav({ onAddPage, onShare }: BottomNavProps) {
  const { pages, currentPage, setCurrentPage } = usePageStore();
  const [showPageList, setShowPageList] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Page list overlay */}
      {showPageList && (
        <div className="fixed inset-0 bg-black/40" onClick={() => setShowPageList(false)} />
      )}
      <div
        className={`relative bg-bg-card border-t-2 border-border-strong rounded-t-3xl shadow-[-2px_-4px_0_var(--color-border-strong)] transition-all duration-300 ${
          showPageList ? 'max-h-[60vh] overflow-y-auto' : ''
        }`}
      >
        {showPageList && (
          <div className="px-4 py-4 space-y-1">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">选择页面</p>
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  setCurrentPage(page);
                  setShowPageList(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                  currentPage?.id === page.id
                    ? 'bg-accent-primary text-white border-border-strong shadow-[2px_2px_0_var(--color-border-strong)]'
                    : 'bg-bg-secondary border-transparent hover:border-border-light'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{page.name}</span>
                  {page._count && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${currentPage?.id === page.id ? 'bg-white/20' : 'bg-bg-card'}`}>
                      {page._count.tags} 标签
                    </span>
                  )}
                </div>
              </button>
            ))}
            {pages.length === 0 && (
              <p className="text-center py-6 text-sm text-text-secondary">还没有页面</p>
            )}
          </div>
        )}

        {/* Bottom tab bar */}
        <div className="flex items-center justify-around px-2 py-2">
          <button
            onClick={() => setShowPageList(!showPageList)}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
              showPageList ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Layers size={20} />
            <span className="text-[10px] font-medium whitespace-nowrap">
              {currentPage?.name ? (
                <span className="max-w-[80px] truncate">{currentPage.name}</span>
              ) : (
                '选择页面'
              )}
            </span>
          </button>

          <button
            onClick={onAddPage}
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-text-secondary hover:text-accent-primary transition-colors"
          >
            <Plus size={20} />
            <span className="text-[10px] font-medium">新建页面</span>
          </button>

          <button
            onClick={onShare}
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-text-secondary hover:text-accent-primary transition-colors"
          >
            <Share2 size={20} />
            <span className="text-[10px] font-medium">分享</span>
          </button>
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-bottom bg-bg-card" />
      </div>
    </div>
  );
}
