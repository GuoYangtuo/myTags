import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  nickname: string;
  onSave: (nickname: string) => Promise<void>;
  onCancel: () => void;
}

export function ProfileModal({ open, nickname, onSave, onCancel }: ProfileModalProps) {
  const [value, setValue] = useState(nickname);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(nickname);
  }, [open, nickname]);

  const handleSave = async () => {
    if (!value.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(value.trim());
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-bg-card rounded-2xl border-2 border-border-strong shadow-[6px_6px_0_var(--color-border-strong)]">
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-base font-bold font-heading mb-3">编辑资料</h3>
          <label className="block text-sm font-medium mb-1.5">昵称（别人将以此名看到你）</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            maxLength={30}
            placeholder="输入昵称"
            className="w-full px-3 py-2 bg-bg-secondary rounded-lg border-2 border-border-strong text-sm outline-none focus:border-accent-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 px-3 py-1.5 text-sm font-medium bg-bg-secondary rounded-lg border-2 border-border-strong hover:bg-border-light transition-colors cursor-pointer disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!value.trim() || saving}
            className="flex-1 px-3 py-1.5 text-sm font-medium bg-accent-primary text-white rounded-lg border-2 border-border-strong hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
