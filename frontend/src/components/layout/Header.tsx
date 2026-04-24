import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui';

export function Header() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-bg-primary border-b-2 border-border-strong">
      <div className="flex items-center justify-between px-6 py-3 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-primary border-2 border-border-strong flex items-center justify-center shadow-[2px_2px_0_var(--color-border-strong)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">myTags</span>
        </div>

        {user && (
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
        )}
      </div>
    </header>
  );
}
