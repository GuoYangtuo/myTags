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
  rootTags?: Tag[];       // 与一级分类同级的标签
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
  rootCategoryId: number | null;
  createdAt: string;
  page?: { id: number; name: string };
}

export interface ShareData {
  page: Page & { user?: { nickname: string; avatarSeed: string } };
  expiresAt: string | null;
  rootCategoryId?: number | null;
  rootCategoryName?: string | null;
}

export interface CreateSharePayload {
  pageId: number;
  expiresAt?: string | null;
  visibleItems?: number[];
  rootCategoryId?: number;
}

export interface PublicUser {
  id: number;
  nickname: string;
  avatarSeed: string;
  pages: { id: number; name: string; description: string }[];
}

export interface FavoriteItem {
  shareCode: string;
  createdAt: string;
  page: {
    id: number;
    name: string;
    description: string;
    user?: { nickname: string; avatarSeed: string };
  };
  shareUser: { nickname: string; avatarSeed: string };
  expiresAt: string | null;
}
