export interface User {
  id: number;
  email: string;
  nickname: string;
  avatarSeed: string;
}

export interface Page {
  id: number;
  userId: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  _count?: { tags: number };
  user?: { nickname: string; avatarSeed: string };
}

export interface Category {
  id: number;
  pageId: number;
  parentId: number | null;
  name: string;
  description: string;
  confidence: number;
  confidenceLabel: string;
  sortOrder: number;
  children: Category[];
  tags: Tag[];
}

export interface Tag {
  id: number;
  pageId: number;
  categoryId: number;
  name: string;
  description: string;
  confidence: number;
  confidenceLabel: string;
  navUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: number;
  userId: number;
  pageId: number;
  shareCode: string;
  expiresAt: string | null;
  createdAt: string;
  page?: { id: number; name: string };
}

export interface ShareData {
  page: Page;
  expiresAt: string | null;
}

export interface CreateSharePayload {
  pageId: number;
  expiresAt?: string | null;
  visibleItems?: number[];
}

export interface PublicUser {
  id: number;
  nickname: string;
  avatarSeed: string;
  pages: { id: number; name: string; description: string }[];
}
