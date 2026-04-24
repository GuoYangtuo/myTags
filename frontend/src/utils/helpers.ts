export const NO_CONFIDENCE_VALUE = 121;

export function isNoConfidence(value: number): boolean {
  return value === NO_CONFIDENCE_VALUE;
}

export function getConfidenceColor(value: number): string {
  if (value >= 80) return '#22C55E';
  if (value >= 40) return '#EAB308';
  return '#94A3B8';
}

export function getConfidenceLabel(value: number): string {
  if (value >= 100) return '极度符合';
  if (value >= 80) return '非常符合';
  if (value >= 60) return '比较符合';
  if (value >= 40) return '一般';
  if (value >= 20) return '不太符合';
  if (value >= 0) return '不符合';
  return '反向标签';
}

export function generateAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=ff6b35,4ecdc4,9b5de5,f7a072`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '永久有效';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function isExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date() > new Date(dateStr);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
