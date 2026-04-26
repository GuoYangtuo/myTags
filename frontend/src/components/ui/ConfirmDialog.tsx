import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmText = '确定', cancelText = '取消', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-bg-card rounded-2xl border-2 border-border-strong shadow-[6px_6px_0_var(--color-border-strong)]">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-bold font-heading mb-2">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 text-sm font-medium bg-bg-secondary rounded-lg border-2 border-border-strong hover:bg-border-light transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg border-2 border-border-strong hover:bg-red-600 transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
