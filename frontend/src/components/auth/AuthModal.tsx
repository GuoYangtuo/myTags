import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, Modal } from '../ui';
import { LogIn, UserPlus } from 'lucide-react';

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(identifier, password);
      } else {
        await register(identifier, password, nickname || undefined);
      }
      onClose();
      setIdentifier('');
      setPassword('');
      setNickname('');
    } catch (err: any) {
      const raw = err?.response?.data?.error;
      const msg = typeof raw === 'string'
        ? raw
        : raw?.message || '操作失败，请重试';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'login' ? '登录' : '注册'} size="sm">
      <div className="space-y-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 border-border-strong transition-all ${mode === 'login' ? 'bg-accent-primary text-white' : 'bg-bg-card hover:bg-bg-secondary'}`}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 border-border-strong transition-all ${mode === 'register' ? 'bg-accent-primary text-white' : 'bg-bg-card hover:bg-bg-secondary'}`}
          >
            注册
          </button>
        </div>

        <Input
          label="用户名 / 邮箱"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="your@email.com"
        />
        <Input
          label="密码"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="至少6位"
        />
        {mode === 'register' && (
          <Input
            label="昵称（可选）"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="别人将以此名看到你"
          />
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500">
            {error}
          </div>
        )}

        <Button onClick={handleSubmit} loading={loading} className="w-full">
          {mode === 'login' ? (
            <><LogIn size={16} className="mr-2" />登录</>
          ) : (
            <><UserPlus size={16} className="mr-2" />注册</>
          )}
        </Button>
      </div>
    </Modal>
  );
}
