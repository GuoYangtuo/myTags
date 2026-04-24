import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit3, Eye } from 'lucide-react';

interface TagDescriptionTooltipProps {
  tagName: string;
  description: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  delay?: number;
  editable?: boolean;
  onSave?: (description: string) => void;
}

export function TagDescriptionTooltip({
  tagName,
  description,
  children,
  side = 'bottom',
  delay = 150,
  editable = false,
  onSave,
}: TagDescriptionTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const isHoveringRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [descMode, setDescMode] = useState<'write' | 'preview'>('write');
  const [editDesc, setEditDesc] = useState(description);

  useEffect(() => {
    setEditDesc(description);
  }, [description]);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setVisible(false);
      }
    }, delay);
  }, [delay, clearHideTimer]);

  const measure = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverWidth = 360;
    const popoverHeight = editable ? 480 : 400;

    let left = rect.left + rect.width / 2;
    if (left - popoverWidth / 2 < 8) {
      left = 8 + popoverWidth / 2;
    } else if (left + popoverWidth / 2 > viewportWidth - 8) {
      left = viewportWidth - 8 - popoverWidth / 2;
    }

    let top: number;
    if (side === 'top') {
      top = rect.top - 10;
      if (top - popoverHeight < 8) {
        top = rect.bottom + 10;
      }
    } else {
      top = rect.bottom + 10;
      if (top + popoverHeight > viewportHeight - 8) {
        top = rect.top - 10;
      }
    }

    setPosition({ top, left });
  }, [side, editable]);

  const show = useCallback(() => {
    if (!description && !editable) return;
    isHoveringRef.current = true;
    clearHideTimer();
    clearShowTimer();
    showTimerRef.current = setTimeout(() => {
      if (isHoveringRef.current) {
        measure();
        setVisible(true);
      }
    }, 500);
  }, [description, editable, clearHideTimer, clearShowTimer, measure]);

  const hide = useCallback(() => {
    isHoveringRef.current = false;
    clearShowTimer();
    scheduleHide();
  }, [scheduleHide, clearShowTimer]);

  const onPopoverEnter = useCallback(() => {
    isHoveringRef.current = true;
    clearHideTimer();
  }, [clearHideTimer]);

  const onPopoverLeave = useCallback(() => {
    isHoveringRef.current = false;
    scheduleHide();
  }, [scheduleHide]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(editDesc);
    }
    isHoveringRef.current = false;
    scheduleHide();
    setVisible(false);
  }, [onSave, editDesc, scheduleHide]);

  useEffect(() => {
    return () => {
      clearShowTimer();
      clearHideTimer();
    };
  }, [clearShowTimer, clearHideTimer]);

  if (!description && !editable) return <>{children}</>;

  const panelContent = editable ? (
    <div
      className="bg-bg-card rounded-xl border-2 border-border-strong shadow-[4px_4px_0_var(--color-border-strong)] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 pt-4 pb-2">
        <div className="font-bold font-heading text-base text-accent-primary leading-snug">
          {tagName}
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="h-px bg-border-light mb-3" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary/60">描述</span>
          <div className="flex rounded-lg border border-border-strong overflow-hidden text-xs font-medium">
            <button
              onClick={() => setDescMode('write')}
              className={`flex items-center gap-1 px-2 py-1 transition-colors ${descMode === 'write' ? 'bg-accent-primary text-white' : 'bg-bg-card text-text-secondary hover:bg-bg-secondary'}`}
            >
              <Edit3 size={10} /> 编写
            </button>
            <button
              onClick={() => setDescMode('preview')}
              className={`flex items-center gap-1 px-2 py-1 transition-colors ${descMode === 'preview' ? 'bg-accent-primary text-white' : 'bg-bg-card text-text-secondary hover:bg-bg-secondary'}`}
            >
              <Eye size={10} /> 预览
            </button>
          </div>
        </div>
        {descMode === 'write' ? (
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-border-strong bg-bg-card text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-accent-primary resize-none font-mono text-xs leading-relaxed"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="用 Markdown 记录描述..."
            rows={6}
            autoFocus
          />
        ) : (
          <div className="px-3 py-2 rounded-lg border border-border-strong bg-bg-secondary text-text-secondary markdown-body text-xs leading-relaxed min-h-[144px]">
            {editDesc ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{editDesc}</ReactMarkdown>
            ) : (
              <span className="text-text-secondary/40 italic">暂无内容</span>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-accent-primary text-white rounded-lg border border-border-strong hover:bg-orange-600 transition-colors"
          >
            保存
          </button>
          <button
            onClick={() => {
              setEditDesc(description);
              isHoveringRef.current = false;
              scheduleHide();
              setVisible(false);
            }}
            className="px-3 py-1.5 text-xs font-medium bg-bg-card text-text-secondary rounded-lg border border-border-strong hover:bg-bg-secondary transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div
      className="bg-bg-card rounded-xl border-2 border-border-strong shadow-[4px_4px_0_var(--color-border-strong)] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 pt-4 pb-2">
        <div className="font-bold font-heading text-base text-accent-primary leading-snug">
          {tagName}
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="h-px bg-border-light mb-3" />
        <div
          className="text-xs text-text-secondary markdown-body overflow-y-auto"
          style={{ maxHeight: 'min(420px, 60vh - 90px)' }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
        </div>
      </div>
    </div>
  );

  const popoverHeight = editable ? 480 : 400;

  const popover = (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, 0)',
        width: 'min(360px, calc(100vw - 16px))',
        maxHeight: `${popoverHeight}px`,
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
      onMouseEnter={onPopoverEnter}
      onMouseLeave={onPopoverLeave}
    >
      {panelContent}
    </div>
  );

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && createPortal(popover, document.body)}
    </div>
  );
}
