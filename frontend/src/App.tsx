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
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { ShareModal } from './components/share/ShareModal';

function AppLayout() {
  const { user } = useAuthStore();
  const { currentPage, fetchPages, fetchPage, setCurrentPage, confirmState } = usePageStore();
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchPages().then(() => {
      const state = usePageStore.getState();
      if (!state.currentPage && state.pages.length > 0) {
        const page = state.pages[0];
        setCurrentPage(page);
        if (!state.loadedPages[page.id]) {
          fetchPage(page.id);
        }
      }
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <PageEditor shareOpen={shareOpen} onShareOpen={() => setShareOpen(true)} onShareClose={() => setShareOpen(false)} />

        {/* Mobile bottom navigation */}
        <BottomNav onShare={() => setShareOpen(true)} />
      </div>

      {currentPage && (
        <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} page={currentPage} />
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
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
                    创建你的个人标签页面<br />
                    让新朋友快速了解你的成分
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
