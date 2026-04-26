import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import { Button } from '../ui';
import { Check, Loader2 } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuthStore();
  const { saving, isDirty, saveContent, currentPage } = usePageStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSave = async () => {
    if (saving || !isDirty) return;
    try {
      await saveContent();
    } catch {
      // error handled in store
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-bg-primary border-b-2 border-border-strong">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-[1400px] mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-accent-primary border-2 border-border-strong flex items-center justify-center shadow-[2px_2px_0_var(--color-border-strong)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">myTags</span>
        </div>

        {/* Right: Save status + User menu */}
        {user && (
          <div className="flex items-center gap-3">
            {/* Save status — only shown when a page is loaded */}
            {currentPage && (
              <>
                {saving ? (
                  <span className="flex items-center gap-1.5 text-sm text-text-secondary/60">
                    <Loader2 size={14} className="animate-spin" />
                    保存中...
                  </span>
                ) : isDirty ? (
                  <>
                    <span className="flex items-center gap-1.5 text-sm text-amber-500">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      未保存
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !isDirty}
                      className="text-xs px-2.5 py-1"
                    >
                      保存
                    </Button>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-green-500">
                    <Check size={14} />
                    已保存
                  </span>
                )}
              </>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-border-strong bg-bg-card hover:bg-bg-secondary transition-colors"
              >
                <img
                  src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user.avatarSeed}&backgroundColor=ff6b35`}
                  alt="avatar"
                  className="w-7 h-7 rounded-full border border-border-strong"
                />
                <span className="font-medium text-sm">{user.nickname}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-bg-card rounded-xl border-2 border-border-strong shadow-[4px_4px_0_var(--color-border-strong)] overflow-hidden fade-in">
                  <div className="px-4 py-2 border-b border-border-light text-sm text-text-secondary">
                    {user.email}
                  </div>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-bg-secondary transition-colors text-left"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
