import React from 'react';
import { ChevronRight, FolderOpen } from 'lucide-react';
import { usePageStore } from '../../stores/pageStore';

export function FocusBreadcrumb() {
  const { focusedCategoryPath, currentPage, navigateFocusUp, unfocusCategory } = usePageStore();

  if (focusedCategoryPath.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
      <button
        onClick={() => unfocusCategory()}
        className="text-text-secondary font-medium truncate hover:text-text-primary transition-colors shrink-0 max-w-[120px]"
        title="返回页面"
      >
        {currentPage?.name ?? ''}
      </button>

      {focusedCategoryPath.map((item, index) => {
        const isLast = index === focusedCategoryPath.length - 1;
        return (
          <React.Fragment key={item.id}>
            <ChevronRight size={14} className="text-text-secondary/40 flex-shrink-0 select-none pointer-events-none" />
            {isLast ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent-primary/10 text-accent-primary font-bold truncate shrink-0 max-w-[160px]">
                <FolderOpen size={13} className="flex-shrink-0" />
                {item.name}
              </span>
            ) : (
              <button
                onClick={() => navigateFocusUp(item.id)}
                className="px-2 py-0.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all font-medium truncate shrink-0 max-w-[140px]"
                title={item.name}
              >
                {item.name}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
