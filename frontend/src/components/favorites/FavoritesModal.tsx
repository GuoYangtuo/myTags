import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { ExternalLink, Trash2, Clock, Loader2 } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface FavoritesModalProps {
  open: boolean;
  onClose: () => void;
}

export function FavoritesModal({ open, onClose }: FavoritesModalProps) {
  const { favorites, loading, fetchFavorites, removeFavorite } = useFavoritesStore();

  useEffect(() => {
    if (open) {
      fetchFavorites();
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="我的收藏" size="md">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-text-secondary" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3 opacity-20">❤️</div>
          <p className="text-text-secondary text-sm">还没有收藏任何页面</p>
          <p className="text-xs text-text-secondary/60 mt-1">在别人分享的页面点击收藏按钮即可添加</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {favorites.map((item) => (
            <div
              key={item.shareCode}
              className="flex items-center gap-3 p-3 rounded-xl border-2 border-border-strong hover:border-accent-primary/40 transition-colors group"
            >
              <img
                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.page.user?.avatarSeed ?? item.shareUser?.avatarSeed ?? ''}&backgroundColor=ff6b35`}
                alt="avatar"
                className="w-9 h-9 rounded-full border border-border-strong flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Link
                  to={`/share/${item.shareCode}`}
                  onClick={onClose}
                  className="font-bold font-heading text-sm hover:text-accent-primary transition-colors truncate block"
                >
                  {item.page.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-secondary truncate">
                    {item.page.user?.nickname ?? item.shareUser?.nickname ?? ''}
                  </span>
                  {item.expiresAt && (
                    <span className="flex items-center gap-0.5 text-xs text-text-secondary/60 flex-shrink-0">
                      <Clock size={10} />
                      {formatDate(item.expiresAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  to={`/share/${item.shareCode}`}
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-accent-primary hover:bg-bg-secondary transition-colors"
                  title="查看"
                >
                  <ExternalLink size={15} />
                </Link>
                <button
                  onClick={() => removeFavorite(item.shareCode)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="取消收藏"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
