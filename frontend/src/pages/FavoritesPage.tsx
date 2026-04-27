import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFavoritesStore } from '../stores/favoritesStore';
import { ExternalLink, Trash2, Clock, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { Header } from '../components/layout/Header';

export function FavoritesPage() {
  const { favorites, loading, fetchFavorites, removeFavorite } = useFavoritesStore();

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading mb-1">我的收藏</h1>
        <p className="text-sm text-text-secondary">收藏的分享页面</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-text-secondary" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-20">❤️</div>
          <p className="text-text-secondary">还没有收藏任何页面</p>
          <p className="text-xs text-text-secondary/60 mt-1">在别人分享的页面点击收藏按钮即可添加</p>
          <Link
            to="/"
            className="inline-block mt-4 text-sm text-accent-primary hover:underline"
          >
            回到我的页面
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((item) => (
            <div
              key={item.shareCode}
              className="bg-bg-card rounded-xl border-2 border-border-strong p-4 group hover:border-accent-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <img
                  src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.page.user?.avatarSeed ?? item.shareUser.avatarSeed}&backgroundColor=ff6b35`}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border border-border-strong flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/share/${item.shareCode}`}
                    className="font-bold font-heading text-base hover:text-accent-primary transition-colors block truncate"
                  >
                    {item.page.name}
                  </Link>
                  {item.page.description && (
                    <p className="text-sm text-text-secondary truncate mt-0.5">{item.page.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-text-secondary">
                      {item.page.user?.nickname ?? item.shareUser.nickname}
                    </span>
                    {item.expiresAt && (
                      <span className="flex items-center gap-1 text-xs text-text-secondary/60">
                        <Clock size={10} />
                        {formatDate(item.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    to={`/share/${item.shareCode}`}
                    className="p-2 rounded-lg text-text-secondary hover:text-accent-primary hover:bg-bg-secondary transition-colors"
                    title="查看页面"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => removeFavorite(item.shareCode)}
                    className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="取消收藏"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
