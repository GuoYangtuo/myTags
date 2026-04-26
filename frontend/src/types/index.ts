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
  categories?: Category[];
}

export interface Category {
  id: number;
  name: string;
  description: string;
  confidence: number;
  confidenceLabel: string;
  children: Category[];
  tags: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  description: string;
  confidence: number;
  confidenceLabel: string;
  navUrl: string | null;
}

export interface Share {
  id: number;
  userId: number;
  pageId: number;
  shareCode: string;
  expiresAt: string | null;
  visibleItems: number[] | null;
  createdAt: string;
  page?: { id: number; name: string };
}

export interface ShareData {
  page: Page & { user?: { nickname: string; avatarSeed: string } };
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
