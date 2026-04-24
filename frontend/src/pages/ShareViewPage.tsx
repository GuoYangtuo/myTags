import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../api/public';
import type { ShareData, Category } from '../types';
import { ChevronDown, ChevronRight, ExternalLink, Clock, User } from 'lucide-react';
import { formatDate, getConfidenceColor } from '../utils/helpers';

function PublicCategory({ category, depth = 0 }: { category: Category; depth?: number }) {
  const [expanded, setExpanded] = useState(true);

  const totalTags = category.tags.length + (category.children ?? []).reduce((s, c) => {
    let count = (c.tags ?? []).length;
    const countDeep = (cats: Category[] | undefined) => {
      if (!cats) return;
      for (const cc of cats) { count += (cc.tags ?? []).length; countDeep(cc.children); }
    };
    countDeep(c.children);
    return s + count;
  }, 0);

  return (
    <div className={`${depth > 0 ? 'ml-3 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-border-light' : ''} mb-4`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 border-border-strong bg-bg-secondary/50 hover:bg-bg-secondary transition-colors text-left mb-2"
      >
        {(category.children ?? []).length > 0 || category.tags.length > 0 ? (
          expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
        ) : (
          <span className="w-4 h-4 inline-block" />
        )}
        <span className="font-bold font-heading text-base">{category.name}</span>
        <span className="text-xs text-text-secondary ml-auto pr-2">{totalTags} 项</span>
      </button>

      {expanded && (
        <div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(category.tags ?? []).map((tag) => (
              <div key={tag.id} className="bg-bg-card rounded-xl border-2 border-border-strong p-4 group">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold font-heading text-base">{tag.name}</span>
                  {tag.navUrl && (
                    <a
                      href={tag.navUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-accent-tertiary hover:bg-accent-tertiary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`打开链接: ${tag.navUrl}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="h-2 bg-border-light rounded-full border border-border-strong overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(0, Math.min(100, ((tag.confidence + 20) / 140) * 100))}%`,
                          backgroundColor: getConfidenceColor(tag.confidence),
                        }}
                      />
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm" style={{ color: getConfidenceColor(tag.confidence) }}>
                    {tag.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          {category.tags.length === 0 && (category.children ?? []).length === 0 && (
            <p className="text-sm text-text-secondary/50 italic px-4 py-2">暂无标签</p>
          )}
          {(category.children ?? []).map((child) => (
            <PublicCategory key={child.id} category={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ShareViewPage() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    publicApi.getShare(code)
      .then(setData)
      .catch((err: any) => {
        if (err?.response?.status === 410) setError('此分享链接已过期');
        else if (err?.response?.status === 404) setError('分享链接不存在');
        else setError('加载失败');
      })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">加载中...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold font-heading opacity-20 mb-4">404</div>
          <p className="text-lg text-text-secondary">{error || '页面不存在'}</p>
        </div>
      </div>
    );
  }

  const { page, expiresAt } = data;

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b-2 border-border-strong bg-bg-primary/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4">
          <img
            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${page.user!.avatarSeed}&backgroundColor=ff6b35`}
            alt="avatar"
            className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-border-strong flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold font-heading text-base md:text-lg truncate">
              {page.user!.nickname} 的成分页面
            </h1>
            {page.description && (
              <p className="text-xs md:text-sm text-text-secondary truncate">{page.description}</p>
            )}
          </div>
          {expiresAt && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary flex-shrink-0">
              <Clock size={12} />
              <span className="hidden sm:inline">{formatDate(expiresAt)}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold font-heading mb-1">{page.name}</h2>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <User size={14} />
            <span>由 {page.user!.nickname} 创建</span>
          </div>
        </div>

        {page.categories.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <p>这个页面还没有标签</p>
          </div>
        ) : (
          <div className="space-y-4">
            {page.categories.map((cat) => (
              <PublicCategory key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-text-secondary/40">
        由 myTags 生成
      </footer>
    </div>
  );
}
