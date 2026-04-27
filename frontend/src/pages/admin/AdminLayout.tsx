import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ShieldCheck, Users, ChevronLeft } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'users', label: '用户管理', icon: Users, path: '/admin/users' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-40 bg-bg-primary border-b-2 border-border-strong">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-primary border-2 border-border-strong flex items-center justify-center shadow-[2px_2px_0_var(--color-border-strong)]">
              <ShieldCheck size={18} color="white" />
            </div>
            <span className="text-xl font-bold font-heading tracking-tight">管理后台</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border-light rounded-lg hover:bg-bg-secondary transition-colors"
            >
              <ChevronLeft size={16} />
              返回主页
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-strong bg-bg-card">
              <img
                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user?.avatarSeed}&backgroundColor=ff6b35`}
                alt="avatar"
                className="w-6 h-6 rounded-full border border-border-strong"
              />
              <span className="text-sm font-medium">{user?.nickname}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1400px] mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r-2 border-border-strong min-h-[calc(100vh-57px)] bg-bg-secondary/30">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-primary text-white shadow-[2px_2px_0_var(--color-border-strong)]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
