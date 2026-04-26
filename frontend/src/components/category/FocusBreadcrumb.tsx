import React from 'react';
import { ChevronRight, ArrowLeft, FolderOpen } from 'lucide-react';
import { usePageStore } from '../../stores/pageStore';

export function FocusBreadcrumb() {
  const { focusedCategoryPath, currentPage, navigateFocusUp, unfocusCategory } = usePageStore();

  if (focusedCategoryPath.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
      <button
        onClick={() => unfocusCategory()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all border-2 border-border-light hover:border-border-strong"
      >
        <ArrowLeft size={14} />
        <span className="hidden sm:inline">返回页面</span>
        <span className="sm:hidden">返回</span>
      </button>

      <div className="flex items-center gap-1 text-sm min-w-0 flex-1 overflow-hidden">
        <button
          onClick={() => navigateFocusUp(-1)}
          className="px-2 py-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all font-medium truncate"
          title={currentPage?.name ?? ''}
        >
          {currentPage?.name ?? ''}
        </button>

        {focusedCategoryPath.map((item, index) => {
          const isLast = index === focusedCategoryPath.length - 1;
          return (
            <React.Fragment key={item.id}>
              <ChevronRight size={14} className="text-text-secondary/50 flex-shrink-0" />
              <button
                onClick={() => navigateFocusUp(item.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium truncate ${
                  isLast
                    ? 'text-accent-primary font-bold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}
                title={item.name}
              >
                {isLast && <FolderOpen size={13} className="flex-shrink-0" />}
                {item.name}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-primary/10 border-2 border-accent-primary/30">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
        <span className="text-xs font-medium text-accent-primary hidden sm:inline">下潜模式</span>
      </div>
    </div>
  );
}
