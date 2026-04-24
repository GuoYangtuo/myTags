import { create } from 'zustand';
import type { Page, Category, Tag } from '../types';
import { pageApi } from '../api/pages';
import { categoryApi } from '../api/categories';
import { tagApi } from '../api/tags';

interface PageState {
  pages: Page[];
  currentPage: Page | null;
  loading: boolean;
  fetchPages: () => Promise<void>;
  fetchPage: (id: number) => Promise<void>;
  createPage: (name: string, description?: string) => Promise<Page>;
  updatePage: (id: number, data: { name?: string; description?: string }) => Promise<void>;
  deletePage: (id: number) => Promise<void>;
  createCategory: (pageId: number, name: string, parentId?: number | null) => Promise<Category>;
  updateCategory: (id: number, data: { name?: string; parentId?: number | null }) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  reorderCategories: (items: { id: number; parentId: number | null; sortOrder: number }[]) => Promise<void>;
  createTag: (pageId: number, categoryId: number, name: string, confidence?: number) => Promise<Tag>;
  updateTag: (id: number, data: Partial<Pick<Tag, 'name' | 'confidence' | 'navUrl' | 'categoryId' | 'sortOrder'>>) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
  reorderTags: (items: { id: number; categoryId: number; sortOrder: number }[]) => Promise<void>;
  addTagToPage: (tag: Tag) => void;
  updateTagInPage: (tag: Tag) => void;
  removeTagFromPage: (tagId: number) => void;
  setCurrentPage: (page: Page | null) => void;
}

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  currentPage: null,
  loading: false,

  fetchPages: async () => {
    set({ loading: true });
    try {
      const pages = await pageApi.list();
      set({ pages, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchPage: async (id: number) => {
    set({ loading: true });
    try {
      const page = await pageApi.get(id);
      set({ currentPage: page, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createPage: async (name, description) => {
    const page = await pageApi.create({ name, description });
    set((state) => ({ pages: [...state.pages, page] }));
    return page;
  },

  updatePage: async (id, data) => {
    const page = await pageApi.update(id, data);
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, ...page } : p)),
      currentPage: state.currentPage?.id === id ? { ...state.currentPage, ...page } : state.currentPage,
    }));
  },

  deletePage: async (id) => {
    await pageApi.delete(id);
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      currentPage: state.currentPage?.id === id ? null : state.currentPage,
    }));
  },

  createCategory: async (pageId, name, parentId) => {
    const category = await categoryApi.create({ pageId, name, parentId });
    const state = get();
    if (state.currentPage && state.currentPage.id === pageId) {
      const addToTree = (cats: Category[]): Category[] => {
        return cats.map((c) => {
          if (c.id === category.parentId) {
            return { ...c, children: [...c.children, category] };
          }
          return { ...c, children: addToTree(c.children) };
        });
      };
      if (category.parentId === null) {
        set({ currentPage: { ...state.currentPage, categories: [...state.currentPage.categories, { ...category, children: [], tags: [] }] } });
      } else {
        set({ currentPage: { ...state.currentPage, categories: addToTree(state.currentPage.categories) } });
      }
    }
    return category;
  },

  updateCategory: async (id, data) => {
    const cat = await categoryApi.update(id, data);
    set((state) => {
      if (!state.currentPage) return state;
      const updateInTree = (cats: Category[]): Category[] => {
        return cats.map((c) => (c.id === id ? { ...c, ...cat } : { ...c, children: updateInTree(c.children) }));
      };
      return { currentPage: { ...state.currentPage, categories: updateInTree(state.currentPage.categories) } };
    });
  },

  deleteCategory: async (id) => {
    await categoryApi.delete(id);
    set((state) => {
      if (!state.currentPage) return state;
      const removeFromTree = (cats: Category[]): Category[] =>
        cats
          .filter((c) => c.id !== id)
          .map((c) => ({ ...c, children: removeFromTree(c.children) }));
      return { currentPage: { ...state.currentPage, categories: removeFromTree(state.currentPage.categories) } };
    });
  },

  reorderCategories: async (items) => {
    await categoryApi.reorder(items);
  },

  createTag: async (pageId, categoryId, name, confidence = 50) => {
    const tag = await tagApi.create({ pageId, categoryId, name, confidence });
    get().addTagToPage(tag);
    return tag;
  },

  updateTag: async (id, data) => {
    const tag = await tagApi.update(id, data);
    get().updateTagInPage(tag);
  },

  deleteTag: async (id) => {
    await tagApi.delete(id);
    get().removeTagFromPage(id);
  },

  reorderTags: async (items) => {
    await tagApi.reorder(items);
  },

  addTagToPage: (tag) => {
    set((state) => {
      if (!state.currentPage) return state;
      const addToTree = (cats: Category[]): Category[] =>
        cats.map((c) => {
          if (c.id === tag.categoryId) return { ...c, tags: [...c.tags, tag] };
          return { ...c, children: addToTree(c.children) };
        });
      return { currentPage: { ...state.currentPage, categories: addToTree(state.currentPage.categories) } };
    });
  },

  updateTagInPage: (tag) => {
    set((state) => {
      if (!state.currentPage) return state;
      const updateInTree = (cats: Category[]): Category[] =>
        cats.map((c) => ({
          ...c,
          tags: c.tags.map((t) => (t.id === tag.id ? { ...t, ...tag } : t)),
          children: updateInTree(c.children),
        }));
      return { currentPage: { ...state.currentPage, categories: updateInTree(state.currentPage.categories) } };
    });
  },

  removeTagFromPage: (tagId) => {
    set((state) => {
      if (!state.currentPage) return state;
      const removeFromTree = (cats: Category[]): Category[] =>
        cats.map((c) => ({
          ...c,
          tags: c.tags.filter((t) => t.id !== tagId),
          children: removeFromTree(c.children),
        }));
      return { currentPage: { ...state.currentPage, categories: removeFromTree(state.currentPage.categories) } };
    });
  },

  setCurrentPage: (page) => set({ currentPage: page }),
}));
