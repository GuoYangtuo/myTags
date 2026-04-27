import { useEffect, useState } from 'react';
import { adminApi, AdminUser } from '../../api/admin';
import { Button, Input, Modal } from '../../components/ui';
import { Trash2, Edit2, LogIn, Loader2 } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.response?.data?.error || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleImpersonate = async (user: AdminUser) => {
    setImpersonating(user.id);
    setError('');
    try {
      const data = await adminApi.impersonate(user.id);
      localStorage.setItem('mytags_token', data.token);
      window.location.href = '/';
    } catch (e: any) {
      setError(e.response?.data?.error || '登录失败');
      setImpersonating(null);
    }
  };

  const openEdit = (user: AdminUser) => {
    setEditTarget(user);
    setEditNickname(user.nickname);
    setEditPassword('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    setError('');
    try {
      const updateData: { nickname?: string; password?: string } = {};
      if (editNickname.trim() && editNickname.trim() !== editTarget.nickname) {
        updateData.nickname = editNickname.trim();
      }
      if (editPassword.trim()) {
        updateData.password = editPassword.trim();
      }
      const updated = await adminApi.updateUser(editTarget.id, updateData);
      setUsers(users.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      setEditModalOpen(false);
    } catch (e: any) {
      setError(e.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (user: AdminUser) => {
    setDeleteTarget(user);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await adminApi.deleteUser(deleteTarget.id);
      setUsers(users.filter(u => u.id !== deleteTarget.id));
      setDeleteModalOpen(false);
    } catch (e: any) {
      setError(e.response?.data?.error || '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">用户管理</h1>
        <span className="text-sm text-text-secondary">共 {users.length} 位用户</span>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-text-secondary" />
        </div>
      ) : (
        <div className="bg-bg-card rounded-xl border-2 border-border-strong overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-secondary/50 border-b-2 border-border-strong">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">用户</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">邮箱</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">注册时间</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-bg-secondary/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user.avatarSeed}&backgroundColor=ff6b35`}
                        alt={user.nickname}
                        className="w-9 h-9 rounded-full border border-border-strong"
                      />
                      <div>
                        <div className="font-medium">{user.nickname}</div>
                        {user.id === 1 && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs bg-accent-primary/10 text-accent-primary font-medium">
                            管理员
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3.5 text-sm text-text-secondary">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleImpersonate(user)}
                        disabled={impersonating === user.id}
                        title="以该用户身份登录"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {impersonating === user.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <LogIn size={13} />
                        )}
                        登录
                      </button>
                      {user.id !== 1 && (
                        <>
                          <button
                            onClick={() => openEdit(user)}
                            title="编辑用户"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => openDelete(user)}
                            title="删除用户"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-text-secondary text-sm">
                    暂无用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`编辑用户 — ${editTarget?.nickname}`}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">昵称</label>
            <Input
              value={editNickname}
              onChange={e => setEditNickname(e.target.value)}
              placeholder="输入新昵称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">新密码 <span className="text-text-secondary font-normal">(留空则不修改)</span></label>
            <Input
              type="password"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              placeholder="输入新密码"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>取消</Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : '保存'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除用户"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-text-secondary">
            确定要删除用户 <strong>{deleteTarget?.nickname}</strong> 吗？此操作不可逆，该用户的所有页面和分享链接都将被永久删除。
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>取消</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 size={16} className="animate-spin" /> : '确认删除'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
