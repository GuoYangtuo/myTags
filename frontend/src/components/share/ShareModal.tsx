import { useState, useEffect } from 'react';
import type { Page } from '../../types';
import { Modal, Button } from '../ui';
import { Share, Copy, Check, Clock, Trash2 } from 'lucide-react';
import { shareApi } from '../../api/shares';
import type { Share as ShareType } from '../../types';
import { formatDate } from '../../utils/helpers';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  page: Page;
}

export function ShareModal({ open, onClose, page }: ShareModalProps) {
  const [expiry, setExpiry] = useState<string>('permanent');
  const [customDate, setCustomDate] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState<ShareType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadShares();
    }
  }, [open, page]);

  const loadShares = async () => {
    try {
      const data = await shareApi.list();
      setShares(data.filter((s) => s.pageId === page.id));
    } catch { /* ignore */ }
  };

  const getExpiryDate = (): string | null => {
    if (expiry === 'permanent') return null;
    if (expiry === '24h') {
      const d = new Date(); d.setHours(d.getHours() + 24); return d.toISOString();
    }
    if (expiry === '7d') {
      const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString();
    }
    if (expiry === '30d') {
      const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString();
    }
    if (expiry === 'custom' && customDate) return new Date(customDate).toISOString();
    return null;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await shareApi.create({
        pageId: page.id,
        expiresAt: getExpiryDate(),
      });
      const url = `${window.location.origin}/share/${data.shareCode}`;
      setGeneratedLink(url);
      loadShares();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteShare = async (id: number) => {
    await shareApi.delete(id);
    loadShares();
  };

  return (
    <Modal open={open} onClose={onClose} title="分享页面" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          分享 <strong className="text-text-primary">{page.name}</strong> 页面给朋友
        </p>

        {generatedLink ? (
          <div className="space-y-4 category-enter">
            <div className="p-4 bg-accent-primary/10 rounded-xl border-2 border-accent-primary">
              <p className="text-sm font-medium text-accent-primary mb-2">分享链接已生成！</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedLink || ''}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-strong bg-bg-card font-mono"
                />
                <Button onClick={handleCopy} size="sm" variant="secondary">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            {shares.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2">已创建的分享链接：</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {shares.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 p-2 bg-bg-secondary rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate">{window.location.origin}/share/{s.shareCode}</p>
                        <p className="text-xs text-text-secondary">{formatDate(s.expiresAt)}</p>
                      </div>
                      <button onClick={() => handleDeleteShare(s.id)} className="p-1 rounded hover:bg-red-500/10 text-red-500 flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => setGeneratedLink(null)} variant="ghost" className="w-full">
              再创建一个
            </Button>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                <Clock size={16} />
                链接时效
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'permanent', label: '永久有效' },
                  { value: '24h', label: '24小时' },
                  { value: '7d', label: '7天' },
                  { value: '30d', label: '30天' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiry(opt.value)}
                    className={`px-3 py-2 text-sm rounded-lg border-2 border-border-strong transition-all ${
                      expiry === opt.value
                        ? 'bg-accent-primary text-white shadow-[2px_2px_0_var(--color-border-strong)]'
                        : 'bg-bg-card hover:bg-bg-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setExpiry('custom')}
                className={`mt-2 px-3 py-2 text-sm rounded-lg border-2 border-border-strong transition-all w-full ${
                  expiry === 'custom' ? 'bg-accent-primary text-white' : 'bg-bg-card hover:bg-bg-secondary'
                }`}
              >
                {expiry === 'custom' ? (
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-transparent outline-none w-full text-center"
                  />
                ) : (
                  '自定义时间'
                )}
              </button>
            </div>

            <Button onClick={handleGenerate} loading={loading} className="w-full">
              <Share size={16} className="mr-2" />
              生成分享链接
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
