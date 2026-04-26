import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Category } from '../../types';
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
    const fill = node.type === 'tag'
      ? getConfidenceColor(node.rawValue)
      : BASE_COLORS[colorIdx];

    arcs.push({
      node,
      depth,
      startAngle: nodeStart,
      endAngle: nodeEnd,
      midAngle: mid,
      color: fill,
    });

    if (node.children && node.children.length > 0 && depth < maxDepth) {
      const childArcs = computeArcsAtDepth(
        node.children, depth + 1, nodeStart, nodeEnd,
        colorIdx * 3, maxDepth
      );
      arcs.push(...childArcs);
    }

    angle = nodeEnd;
  }
  return arcs;
}

interface SunburstChartProps {
  categories: Category[];
  focusedCategoryId: number | null;
  onFocusCategory: (categoryId: number) => void;
  onUnfocusCategory: () => void;
  onUnfocusToParent: () => void;
  focusedCategoryPath: Array<{ id: number; name: string }>;
}

export function SunburstChart({
  categories,
  focusedCategoryId,
  onFocusCategory,
  onUnfocusCategory,
  onUnfocusToParent,
  focusedCategoryPath,
}: SunburstChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDims({ width: rect.width || 800, height: rect.height || 600 });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const rootData = useMemo(() => categories.map((cat) => categoryToNode(cat)), [categories]);

  const arcs = useMemo(() => {
    const totalDepth = (nodes: SunburstNode[]): number => {
      let max = 0;
      for (const n of nodes) {
        const childDepth = n.children && n.children.length > 0
          ? 1 + totalDepth(n.children)
          : 1;
        if (childDepth > max) max = childDepth;
      }
      return max;
    };

    if (!focusedCategoryId) {
      const depth = Math.max(1, totalDepth(rootData));
      return computeArcsAtDepth(rootData, 0, 0, 360, 0, depth - 1);
    }

    let nodes = rootData;
    for (const pathItem of focusedCategoryPath) {
      const foundNode = nodes.find((n) => n.id === pathItem.id);
      if (!foundNode || !foundNode.children) {
        const d = Math.max(1, totalDepth(rootData));
        return computeArcsAtDepth(rootData, 0, 0, 360, 0, d - 1);
      }
      nodes = foundNode.children;
    }

    if (nodes.length === 0) {
      const d = Math.max(1, totalDepth(rootData));
      return computeArcsAtDepth(rootData, 0, 0, 360, 0, d - 1);
    }

    const depth = Math.max(1, totalDepth(nodes));
    return computeArcsAtDepth(nodes, 0, 0, 360, 0, depth - 1);
  }, [rootData, focusedCategoryId, focusedCategoryPath]);

  const { cx, cy, maxRadius } = useMemo(() => {
    const padding = 20;
    const size = Math.min(dims.width, dims.height);
    return {
      cx: dims.width / 2,
      cy: dims.height / 2,
      maxRadius: (size / 2) - padding,
    };
  }, [dims]);

  const maxDepth = useMemo(() => {
    if (arcs.length === 0) return 0;
    return Math.max(...arcs.map((a) => a.depth));
  }, [arcs]);

  const numRings = maxDepth + 1;
  const ringWidth = numRings > 0 ? maxRadius / numRings : maxRadius;
  const centerR = ringWidth * 0.5;

  const getRingBounds = useCallback((depth: number) => {
    const inner = centerR + depth * ringWidth;
    const outer = inner + ringWidth;
    return { inner, outer };
  }, [centerR, ringWidth]);

  const handleArcClick = useCallback(
    (arc: RenderArc) => {
      if (arc.node.type === 'category' && arc.node.id !== undefined && arc.node.children && arc.node.children.length > 0) {
        onFocusCategory(arc.node.id);
      }
    },
    [onFocusCategory]
  );

  const handleCenterClick = useCallback(() => {
    if (focusedCategoryPath.length > 1) {
      onUnfocusToParent();
    } else if (focusedCategoryPath.length === 1) {
      onUnfocusCategory();
    }
  }, [focusedCategoryPath, onUnfocusToParent, onUnfocusCategory]);

  const isAtRoot = focusedCategoryPath.length === 0;

  if (arcs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
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

  const centerButtonSize = Math.max(52, Math.min(72, maxRadius * 0.26));

  const hoveredArc = hoveredIdx !== null ? arcs[hoveredIdx] : null;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" ref={containerRef}>
      {/* Breadcrumb */}
      {focusedCategoryPath.length > 0 && (
        <div className="flex items-center gap-1 px-4 py-2 text-xs text-text-secondary border-b border-border-light bg-bg-secondary/30 flex-shrink-0 overflow-x-auto whitespace-nowrap">
          <button onClick={onUnfocusCategory} className="hover:text-accent-primary transition-colors font-medium flex-shrink-0">
            根目录
          </button>
          {focusedCategoryPath.map((item, idx) => (
            <span key={item.id} className="flex items-center gap-1 flex-shrink-0">
              <span className="text-border-light">/</span>
              {idx < focusedCategoryPath.length - 1 ? (
                <button
                  onClick={() => { for (let i = idx + 1; i < focusedCategoryPath.length; i++) onUnfocusToParent(); }}
                  className="hover:text-accent-primary transition-colors"
                >
                  {item.name}
                </button>
              ) : (
                <span className="text-text-primary font-medium">{item.name}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* SVG Chart */}
      <div className="flex-1 relative min-h-0">
        <svg width={dims.width} height={dims.height} className="block">
          <g>
            {arcs.map((arc, idx) => {
              const { inner, outer } = getRingBounds(arc.depth);
              const pathD = describeArc(cx, cy, inner, outer, arc.startAngle, arc.endAngle);
              if (!pathD) return null;

              const isHovered = hoveredIdx === idx;
              const midR = (inner + outer) / 2;
              const arcSweep = arc.endAngle - arc.startAngle;
              const showLabel = arcSweep > 15;

              return (
                <g key={`arc-${arc.depth}-${idx}`}>
                  <path
                    d={pathD}
                    fill={arc.color}
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 4 : 1.5}
                    style={{
                      cursor: arc.node.type === 'category' && arc.node.children && arc.node.children.length > 0 ? 'pointer' : 'default',
                      filter: isHovered
                        ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.40)) brightness(1.12)'
                        : undefined,
                      transform: isHovered ? 'scale(1.025)' : undefined,
                      transformOrigin: `${cx}px ${cy}px`,
                      transition: 'filter 150ms, stroke-width 150ms, transform 150ms',
                    }}
                    onMouseEnter={(e) => { setHoveredIdx(idx); setMousePos({ x: e.clientX, y: e.clientY }); }}
                    onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
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
                        fontSize={Math.max(9, Math.min(13, ringWidth * 0.22))}
                        fontFamily="var(--font-heading), Space Grotesk, system-ui, sans-serif"
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
                          fontSize={Math.max(8, Math.min(11, ringWidth * 0.17))}
                          fontFamily="var(--font-body), Noto Sans SC, system-ui, sans-serif"
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
        </svg>

        {/* Center button */}
        <div
          className="absolute pointer-events-auto"
          style={{
            top: cy - centerButtonSize / 2,
            left: cx - centerButtonSize / 2,
            width: centerButtonSize,
            height: centerButtonSize,
          }}
        >
          <button
            onClick={handleCenterClick}
            className="w-full h-full rounded-full bg-bg-card border-2 border-border-strong shadow-[2px_2px_0_var(--color-border-strong)] hover:shadow-[3px_3px_0_var(--color-border-strong)] active:shadow-[1px_1px_0_var(--color-border-strong)] transition-all flex flex-col items-center justify-center gap-0.5"
            title={isAtRoot ? '旭日图根视图' : '返回上级'}
          >
            {isAtRoot ? (
              <>
                <svg width={Math.round(centerButtonSize * 0.35)} height={Math.round(centerButtonSize * 0.35)} viewBox="0 0 24 24" fill="none" stroke="#6B635A" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <span className="text-[9px] text-text-secondary font-medium">旭日图</span>
              </>
            ) : (
              <>
                <ChevronUp size={Math.round(centerButtonSize * 0.28)} className="text-text-secondary" />
                <span className="text-[9px] text-text-secondary font-medium">返回上级</span>
              </>
            )}
          </button>
        </div>

        {/* Tooltip — follows mouse near the arc */}
        {hoveredArc && (hoveredArc.endAngle - hoveredArc.startAngle) <= 15 && (
          <div
            className="absolute bg-bg-card border-2 border-border-strong rounded-xl shadow-[3px_3px_0_var(--color-border-strong)] px-3 py-2.5 min-w-[140px] max-w-[220px] pointer-events-none z-10"
            style={{
              top: mousePos.y - containerRef.current!.getBoundingClientRect().top + 12,
              left: mousePos.x - containerRef.current!.getBoundingClientRect().left + 12,
            }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: hoveredArc.color }} />
              <span className="font-bold font-heading text-xs text-text-primary truncate">{hoveredArc.node.name}</span>
            </div>
            {hoveredArc.node.type === 'tag' && (
              <p className="text-[10px] text-text-secondary pl-4.5">
                {`${hoveredArc.node.confidenceLabel ?? '置信度'}: ${hoveredArc.node.rawValue}`}
              </p>
            )}
            {hoveredArc.node.type === 'category' && hoveredArc.node.children && hoveredArc.node.children.length > 0 && (
              <p className="text-[10px] text-text-secondary pl-4.5">点击进入</p>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-bg-card/90 border border-border-light rounded-full">
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
      </div>
    </div>
  );
}
