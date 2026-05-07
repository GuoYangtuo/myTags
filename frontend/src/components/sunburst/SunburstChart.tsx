import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Category } from '../../types';
import { usePageStore } from '../../stores/pageStore';
import { ChevronUp } from 'lucide-react';

interface SunburstNode {
  name: string;
  value: number;
  rawValue: number;
  id?: number;
  type: 'category' | 'tag';
  children?: SunburstNode[];
  confidenceLabel?: string;
}

interface RenderArc {
  node: SunburstNode;
  depth: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  color: string;
}

function categoryToNode(cat: Category): SunburstNode {
  const tagNodes: SunburstNode[] = (cat.tags ?? []).map((tag) => ({
    name: tag.name,
    value: tag.confidence + 21,
    rawValue: tag.confidence,
    id: tag.id,
    type: 'tag' as const,
    confidenceLabel: tag.confidenceLabel,
  }));
  const childNodes: SunburstNode[] = (cat.children ?? []).map((child) => categoryToNode(child));
  const allChildren = [...tagNodes, ...childNodes];
  return {
    name: cat.name,
    value: allChildren.reduce((sum, n) => sum + n.value, 0),
    rawValue: cat.confidence,
    id: cat.id,
    type: 'category',
    confidenceLabel: cat.confidenceLabel,
    children: allChildren.length > 0 ? allChildren : undefined,
  };
}

const BASE_COLORS = [
  '#FF6B35', '#4ECDC4', '#9B5DE5', '#F7A072',
  '#00C9A7', '#845EC2', '#FF9671', '#60C5A7',
  '#D65DB1', '#4DFFD2', '#FF6F91', '#C9D65B',
];

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return '#22C55E';
  if (confidence >= 50) return '#EAB308';
  if (confidence >= 20) return '#F97316';
  if (confidence >= 0) return '#94A3B8';
  return '#6B7280';
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(
  cx: number, cy: number,
  innerR: number, outerR: number,
  startAngle: number, endAngle: number
): string {
  if (Math.abs(endAngle - startAngle) < 0.1) return '';
  const start = polarToCartesian(cx, cy, outerR, endAngle);
  const end = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    'M', start.x, start.y,
    'A', outerR, outerR, 0, largeArc, 0, end.x, end.y,
    'L', innerEnd.x, innerEnd.y,
    'A', innerR, innerR, 0, largeArc, 1, innerStart.x, innerStart.y,
    'Z',
  ].join(' ');
}

function computeArcsAtDepth(
  nodes: SunburstNode[],
  depth: number,
  startAngle: number,
  endAngle: number,
  colorOffset: number,
  maxDepth: number
): RenderArc[] {
  if (depth > maxDepth || nodes.length === 0) return [];
  const total = nodes.reduce((s, n) => s + n.value, 0);
  if (total === 0) return [];

  const arcs: RenderArc[] = [];
  let angle = startAngle;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const fraction = node.value / total;
    const nodeStart = angle;
    const nodeEnd = angle + fraction * (endAngle - startAngle);
    const mid = (nodeStart + nodeEnd) / 2;
    const colorIdx = (i + colorOffset) % BASE_COLORS.length;
    const fill = node.type === 'tag' ? getConfidenceColor(node.rawValue) : BASE_COLORS[colorIdx];

    arcs.push({ node, depth, startAngle: nodeStart, endAngle: nodeEnd, midAngle: mid, color: fill });

    if (node.children && node.children.length > 0 && depth < maxDepth) {
      arcs.push(...computeArcsAtDepth(node.children, depth + 1, nodeStart, nodeEnd, colorIdx * 3, maxDepth));
    }

    angle = nodeEnd;
  }
  return arcs;
}

export function SunburstChart() {
  const { currentPage, focusedCategoryId, focusedCategoryPath, focusCategory, unfocusCategory, navigateFocusUp } = usePageStore();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Measure square container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const size = Math.min(w, h);
      setContainerSize({ width: size, height: size });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const categories = currentPage?.categories ?? [];

  const rootData = useMemo(() => categories.map((cat) => categoryToNode(cat)), [categories]);

  const arcs = useMemo(() => {
    const totalDepth = (nodes: SunburstNode[]): number => {
      let max = 0;
      for (const n of nodes) {
        const childDepth = n.children && n.children.length > 0 ? 1 + totalDepth(n.children) : 1;
        if (childDepth > max) max = childDepth;
      }
      return max;
    };

    let raw: ReturnType<typeof computeArcsAtDepth>;

    if (!focusedCategoryId) {
      const depth = Math.max(1, totalDepth(rootData));
      raw = computeArcsAtDepth(rootData, 0, 0, 360, 0, depth - 1);
    } else {
      let nodes = rootData;
      for (const pathItem of focusedCategoryPath) {
        const foundNode = nodes.find((n) => n.id === pathItem.id);
        if (!foundNode || !foundNode.children) {
          const d = Math.max(1, totalDepth(rootData));
          raw = computeArcsAtDepth(rootData, 0, 0, 360, 0, d - 1);
          return raw.sort((a, b) => b.depth - a.depth);
        }
        nodes = foundNode.children;
      }

      if (nodes.length === 0) {
        const d = Math.max(1, totalDepth(rootData));
        raw = computeArcsAtDepth(rootData, 0, 0, 360, 0, d - 1);
      } else {
        const depth = Math.max(1, totalDepth(nodes));
        raw = computeArcsAtDepth(nodes, 0, 0, 360, 0, depth - 1);
      }
    }

    return raw.sort((a, b) => b.depth - a.depth);
  }, [rootData, focusedCategoryId, focusedCategoryPath]);

  const maxDepth = arcs.length > 0 ? Math.max(...arcs.map((a) => a.depth)) : 0;
  const numRings = maxDepth + 1;
  const size = Math.min(containerSize.width, containerSize.height);
  console.log(numRings);
  const cx = size / 2;
  const cy = size / 2;
  const padding = 64;
  const maxRadius = (size / 2) - padding;
  const ringWidth = numRings > 0 ? maxRadius / (numRings + 0.5) : maxRadius;
  const centerR = ringWidth * 0.5;

  const getRingBounds = useCallback((depth: number) => ({
    inner: centerR + depth * ringWidth,
    outer: centerR + (depth + 1) * ringWidth,
  }), [centerR, ringWidth]);

  const handleArcClick = useCallback((arc: RenderArc) => {
    if (arc.node.type === 'category' && arc.node.id !== undefined && arc.node.children && arc.node.children.length > 0) {
      focusCategory(arc.node.id);
    }
  }, [focusCategory]);

  const handleCenterClick = useCallback(() => {
    if (focusedCategoryPath.length > 1) {
      navigateFocusUp(focusedCategoryPath[focusedCategoryPath.length - 2].id);
    } else if (focusedCategoryPath.length === 1) {
      unfocusCategory();
    }
  }, [focusedCategoryPath, navigateFocusUp, unfocusCategory]);

  // Track mouse position relative to container (handles SVG centering offset)
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const isAtRoot = focusedCategoryPath.length === 0;
  const hoveredArc = hoveredIdx !== null ? arcs[hoveredIdx] : null;
  const centerButtonSize = Math.max(48, Math.min(72, maxRadius * 0.26));

  if (arcs.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center text-text-secondary">
        <div className="text-center">
          <div className="mb-3 opacity-40">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <p className="text-sm">暂无分类数据</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <svg width={size} height={size} onMouseMove={handleMouseMove}>
        {/* Breadcrumb above SVG on small charts */}
        {focusedCategoryPath.length > 0 && (
          <foreignObject x={0} y={0} width={size} height={24} className="overflow-visible">
            <div className="flex items-center gap-0.5 text-[9px] text-text-secondary whitespace-nowrap px-1">
              <button onClick={unfocusCategory} className="hover:text-accent-primary font-medium">根</button>
              {focusedCategoryPath.map((item, idx) => (
                <span key={item.id} className="flex items-center gap-0.5">
                  <span className="text-border-light">/</span>
                  {idx < focusedCategoryPath.length - 1 ? (
                    <button
                      onClick={() => { for (let i = idx + 1; i < focusedCategoryPath.length; i++) navigateFocusUp(focusedCategoryPath[i - 1].id); }}
                      className="hover:text-accent-primary"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <span className="text-text-primary font-medium">{item.name}</span>
                  )}
                </span>
              ))}
            </div>
          </foreignObject>
        )}

        <g>
          {/* Non-hovered arcs: outer rings first (depth-sorted), hovered arc always last (on top) */}
          {arcs.map((arc, idx) => {
            if (hoveredIdx === idx) return null;
            const { inner, outer } = getRingBounds(arc.depth);
            const pathD = describeArc(cx, cy, inner, outer, arc.startAngle, arc.endAngle);
            if (!pathD) return null;
            const midR = (inner + outer) / 2;
            const arcSweep = arc.endAngle - arc.startAngle;
            const showLabel = arcSweep > 15;
            const fontSize = Math.max(9, Math.min(13, ringWidth * 0.22));
            const subFontSize = Math.max(8, Math.min(11, ringWidth * 0.17));

            return (
              <g key={`arc-${arc.depth}-${idx}`}>
                <path
                  d={pathD}
                  fill={arc.color}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  style={{ pointerEvents: 'all' }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => handleArcClick(arc)}
                />
                {showLabel && (
                  <>
                    <text
                      x={polarToCartesian(cx, cy, midR, arc.midAngle).x}
                      y={polarToCartesian(cx, cy, midR, arc.midAngle).y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.95)"
                      fontSize={fontSize}
                      fontFamily="Space Grotesk, system-ui, sans-serif"
                      fontWeight="700"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {arc.node.name.length > 6 ? arc.node.name.slice(0, 6) + '…' : arc.node.name}
                    </text>
                    {arc.node.type === 'tag' && (
                      <text
                        x={polarToCartesian(cx, cy, midR, arc.midAngle).x}
                        y={polarToCartesian(cx, cy, midR, arc.midAngle).y + 13}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(255,255,255,0.80)"
                        fontSize={subFontSize}
                        fontFamily="Noto Sans SC, system-ui, sans-serif"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {`${arc.node.confidenceLabel ?? '置信度'}: ${arc.node.rawValue}`}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}

          {/* Hovered arc: rendered last so it sits on top of everything */}
          {hoveredArc && (() => {
            const { inner, outer } = getRingBounds(hoveredArc.depth);
            const pathD = describeArc(cx, cy, inner, outer, hoveredArc.startAngle, hoveredArc.endAngle);
            if (!pathD) return null;
            const midR = (inner + outer) / 2;
            const arcSweep = hoveredArc.endAngle - hoveredArc.startAngle;
            const showLabel = arcSweep > 15;
            const fontSize = Math.max(9, Math.min(13, ringWidth * 0.22));
            const subFontSize = Math.max(8, Math.min(11, ringWidth * 0.17));

            return (
              <g>
                <path
                  d={pathD}
                  fill={hoveredArc.color}
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  style={{
                    cursor: hoveredArc.node.type === 'category' && hoveredArc.node.children && hoveredArc.node.children.length > 0 ? 'pointer' : 'default',
                    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.40)) brightness(1.12)',
                    transform: 'scale(1.025)',
                    transformOrigin: `${cx}px ${cy}px`,
                    pointerEvents: 'all',
                  }}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => handleArcClick(hoveredArc)}
                />
                {showLabel && (
                  <>
                    <text
                      x={polarToCartesian(cx, cy, midR, hoveredArc.midAngle).x}
                      y={polarToCartesian(cx, cy, midR, hoveredArc.midAngle).y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.95)"
                      fontSize={fontSize}
                      fontFamily="Space Grotesk, system-ui, sans-serif"
                      fontWeight="700"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {hoveredArc.node.name.length > 6 ? hoveredArc.node.name.slice(0, 6) + '…' : hoveredArc.node.name}
                    </text>
                    {hoveredArc.node.type === 'tag' && (
                      <text
                        x={polarToCartesian(cx, cy, midR, hoveredArc.midAngle).x}
                        y={polarToCartesian(cx, cy, midR, hoveredArc.midAngle).y + 13}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(255,255,255,0.80)"
                        fontSize={subFontSize}
                        fontFamily="Noto Sans SC, system-ui, sans-serif"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {`${hoveredArc.node.confidenceLabel ?? '置信度'}: ${hoveredArc.node.rawValue}`}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })()}

          {/* Center circle */}
          <circle
            cx={cx} cy={cy}
            r={centerR - 2}
            fill="#FFFFFF"
            stroke="#D4CEC6"
            strokeWidth={2}
            pointerEvents="none"
          />
        </g>

        {/* Center button — rendered as SVG overlay */}
        <foreignObject x={cx - centerButtonSize / 2} y={cy - centerButtonSize / 2} width={centerButtonSize} height={centerButtonSize}>
          <button
            onClick={handleCenterClick}
            className="w-full h-full rounded-full bg-bg-card border-0 border-border-strong shadow-[2px_2px_0_var(--color-border-strong)] hover:shadow-[3px_3px_0_var(--color-border-strong)] active:shadow-[1px_1px_0_var(--color-border-strong)] transition-all flex flex-col items-center justify-center gap-0.5"
            title={isAtRoot ? '旭日图根视图' : '返回上级'}
          >
            {isAtRoot ? (
              <>
                <span className="text-[18px] text-text-secondary font-medium">{currentPage?.name ?? ''}</span>
              </>
            ) : (
              <>
                <ChevronUp size={Math.round(centerButtonSize * 2.8)} className="text-text-secondary" />
                <span className="text-[18px] text-text-secondary font-medium">{focusedCategoryPath.find((item) => item.id === focusedCategoryId)?.name ?? ''}</span>
              </>
            )}
          </button>
        </foreignObject>

        {/* Tooltip — follows mouse, only for small arcs */}
        {hoveredArc && (hoveredArc.endAngle - hoveredArc.startAngle) <= 15 && (
          <foreignObject
            x={0} y={0} width={size} height={size}
            style={{ pointerEvents: 'none', overflow: 'visible' }}
          >
            <div
              className="bg-bg-card border-2 border-border-strong rounded-xl shadow-[3px_3px_0_#1A1614] px-3 py-2 min-w-[120px] max-w-[180px]"
              style={{
                position: 'absolute',
                top: mousePos.y + 12,
                left: Math.min(mousePos.x + 12, size - 160),
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: hoveredArc.color }} />
                <span className="font-bold font-heading text-[11px] text-text-primary truncate">{hoveredArc.node.name}</span>
              </div>
              {hoveredArc.node.type === 'tag' && (
                <p className="text-[10px] text-text-secondary pl-3.5">
                  {`${hoveredArc.node.confidenceLabel ?? '置信度'}: ${hoveredArc.node.rawValue}`}
                </p>
              )}
              {hoveredArc.node.type === 'category' && hoveredArc.node.children && hoveredArc.node.children.length > 0 && (
                <p className="text-[10px] text-text-secondary pl-3.5">点击进入</p>
              )}
            </div>
          </foreignObject>
        )}

        {/* Legend */}
        <foreignObject x={0} y={size - 28} width={size} height={28} className="overflow-visible">
          <div className="flex items-center justify-center gap-1.5 px-2 py-1 bg-bg-card/90 border border-border-light rounded-full w-fit mx-auto">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
              <span className="text-[9px] text-text-secondary">高</span>
            </div>
            <div className="w-px h-3 bg-border-light" />
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EAB308' }} />
              <span className="text-[9px] text-text-secondary">中</span>
            </div>
            <div className="w-px h-3 bg-border-light" />
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F97316' }} />
              <span className="text-[9px] text-text-secondary">低</span>
            </div>
            <div className="w-px h-3 bg-border-light" />
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#94A3B8' }} />
              <span className="text-[9px] text-text-secondary">很低</span>
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
