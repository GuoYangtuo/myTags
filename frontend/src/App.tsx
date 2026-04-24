import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { usePageStore } from './stores/pageStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { PageEditor } from './pages/PageEditor';
import { ShareViewPage } from './pages/ShareViewPage';
import { AuthModal } from './components/auth/AuthModal';
import { Plus, X } from 'lucide-react';

function AppLayout() {
  const { user } = useAuthStore();
  const { currentPage, fetchPages, fetchPage, isPageLoaded, createPage, setCurrentPage } = usePageStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [showNewPage, setShowNewPage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !currentPage) return;

    if (!isPageLoaded(currentPage.id)) {
      fetchPage(currentPage.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage?.id, user]);

  const handleCreatePage = async () => {
    if (!newPageName.trim()) return;
    const page = await createPage(newPageName.trim());
    setNewPageName('');
    setShowNewPage(false);
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 md:hidden modal-backdrop"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-72 bg-bg-primary z-50 md:hidden overflow-y-auto shadow-[4px_0_12px_rgba(0,0,0,0.15)]">
              <div className="flex items-center justify-between p-4 border-b-2 border-border-strong">
                <h2 className="font-bold font-heading text-sm uppercase tracking-wider text-text-secondary">我的页面</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                {showNewPage && (
                  <div className="mb-3 p-3 bg-bg-card rounded-xl border-2 border-border-strong category-enter">
                    <input
                      type="text"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreatePage();
                        if (e.key === 'Escape') setShowNewPage(false);
                      }}
                      placeholder="页面名称..."
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-border-strong outline-none focus:border-accent-primary"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleCreatePage}
                        className="flex-1 px-3 py-1 text-sm bg-accent-primary text-white rounded-lg border border-border-strong hover:bg-orange-600 transition-colors"
                      >
                        创建
                      </button>
                      <button
                        onClick={() => setShowNewPage(false)}
                        className="flex-1 px-3 py-1 text-sm bg-bg-secondary rounded-lg border border-border-strong hover:bg-border-light transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
                <Sidebar onAddPage={() => setShowNewPage(true)} />
              </div>
            </div>
          </>
        )}

        <PageEditor onMenuClick={() => setSidebarOpen(true)} />

        {/* Mobile bottom navigation */}
        <BottomNav
          onAddPage={() => {
            setShowNewPage(true);
            setSidebarOpen(true);
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const { checkAuth, user } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/:code" element={<ShareViewPage />} />
        <Route
          path="/*"
          element={
            !user ? (
              <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                  <div className="w-20 h-20 rounded-2xl bg-accent-primary border-2 border-border-strong shadow-[6px_6px_0_var(--color-border-strong)] flex items-center justify-center mx-auto mb-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold font-heading mb-3">myTags</h1>
                  <p className="text-text-secondary mb-8 leading-relaxed">
                    轻松创建你的个人标签页面<br />
                    让新朋友快速了解你是什么成分
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setAuthOpen(true)}
                      className="w-full px-8 py-3 bg-accent-primary text-white text-lg font-bold rounded-xl border-2 border-border-strong shadow-[4px_4px_0_var(--color-border-strong)] hover:bg-orange-600 hover:shadow-[6px_6px_0_var(--color-border-strong)] transition-all active:scale-95"
                    >
                      开始使用
                    </button>
                    <p className="text-xs text-text-secondary/60">
                      登录后可创建、管理和分享你的标签页面
                    </p>
                  </div>
                </div>
                <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
              </div>
            ) : (
              <AppLayout />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
