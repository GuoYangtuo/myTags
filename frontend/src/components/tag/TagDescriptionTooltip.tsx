import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
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
  const popoverRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 360;
    const popoverHeight = 400;

    let left = rect.left + rect.width / 2;
    let top: number;

    if (side === 'top') {
      top = rect.top;
    } else {
      top = rect.bottom;
    }

    const viewportWidth = window.innerWidth;
    if (left - popoverWidth / 2 < 8) {
      left = 8 + popoverWidth / 2;
    } else if (left + popoverWidth / 2 > viewportWidth - 8) {
      left = viewportWidth - 8 - popoverWidth / 2;
    }

    setPosition({ top, left });
  }, [side]);

  const show = useCallback(() => {
    if (!description) return;
    timeoutRef.current = setTimeout(() => {
      measure();
      setVisible(true);
    }, delay);
  }, [description, delay, measure]);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!description) return <>{children}</>;

  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    transform: side === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
    width: 'min(360px, calc(100vw - 16px))',
    maxHeight: 'min(420px, 60vh)',
    zIndex: 9999,
  };

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
      {visible && (
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="absolute z-[9999] category-enter"
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setVisible(true);
          }}
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
              <div className="text-xs text-text-secondary markdown-body overflow-y-auto" style={{ maxHeight: 'calc(60vh - 100px)' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
              </div>
            </div>
          </div>
          <div
            className={`absolute w-0 h-0 border-[10px] border-l-transparent border-r-transparent ${
              side === 'top'
                ? 'bottom-[-10px] left-1/2 -translate-x-1/2 border-t-bg-card border-b-transparent'
                : 'top-[-10px] left-1/2 -translate-x-1/2 border-b-bg-card border-t-transparent'
            }`}
          />
        </div>
      )}
    </div>
  );
}
