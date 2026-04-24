import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TagDescriptionTooltipProps {
  tagName: string;
  description: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  delay?: number;
}

export function TagDescriptionTooltip({
  tagName,
  description,
  children,
  side = 'bottom',
  delay = 300,
}: TagDescriptionTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const scheduleHide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), delay);
  }, [delay]);

  const cancelHide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const measure = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverWidth = 360;
    const popoverHeight = 400;

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
  }, [side]);

  const show = useCallback(() => {
    if (!description) return;
    cancelHide();
    measure();
    setVisible(true);
  }, [description, cancelHide, measure]);

  const hide = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!description) return <>{children}</>;

  const popover = (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, 0)',
        width: 'min(360px, calc(100vw - 16px))',
        maxHeight: 'min(420px, 60vh)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      onMouseEnter={cancelHide}
      onMouseLeave={hide}
    >
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
