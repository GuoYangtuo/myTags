import { create } from 'zustand';
import type { Page, Category, Tag } from '../types';
import { pageApi } from '../api/pages';
import { categoryApi } from '../api/categories';
import { tagApi } from '../api/tags';

interface PageState {
  pages: Page[];
  currentPage: Page | null;
  loadedPages: Record<number, Page>;
  loading: boolean;
  fetchPages: () => Promise<void>;
  fetchPage: (id: number) => Promise<void>;
  createPage: (name: string, description?: string) => Promise<Page>;
  updatePage: (id: number, data: { name?: string; description?: string }) => Promise<void>;
  deletePage: (id: number) => Promise<void>;
  createCategory: (pageId: number, name: string, parentId?: number | null, description?: string, confidence?: number, confidenceLabel?: string) => Promise<Category>;
  updateCategory: (id: number, data: { name?: string; parentId?: number | null; description?: string; confidence?: number; confidenceLabel?: string }) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  reorderCategories: (items: { id: number; parentId: number | null; afterId: number | null }[]) => Promise<void>;
  createTag: (pageId: number, categoryId: number, name: string, confidence?: number, description?: string, confidenceLabel?: string) => Promise<Tag>;
  updateTag: (id: number, data: Partial<Pick<Tag, 'name' | 'description' | 'confidence' | 'confidenceLabel' | 'navUrl' | 'categoryId' | 'sortOrder'>>) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
  reorderTags: (items: { id: number; categoryId: number; afterId: number | null }[]) => Promise<void>;
  addTagToPage: (tag: Tag) => void;
  updateTagInPage: (tag: Tag) => void;
  removeTagFromPage: (tagId: number) => void;
  setCurrentPage: (page: Page | null) => void;
  isPageLoaded: (id: number) => boolean;
}

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  currentPage: null,
  loadedPages: {},
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
      set((state) => ({
        currentPage: page,
        loadedPages: { ...state.loadedPages, [id]: page },
        loading: false,
      }));
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
      loadedPages: state.currentPage?.id === id
        ? { ...state.loadedPages, [id]: { ...state.loadedPages[id], ...page } }
        : state.loadedPages,
    }));
  },

  deletePage: async (id) => {
    await pageApi.delete(id);
    set((state) => {
      const { [id]: _removed, ...rest } = state.loadedPages;
      return {
        pages: state.pages.filter((p) => p.id !== id),
        currentPage: state.currentPage?.id === id ? null : state.currentPage,
        loadedPages: rest,
      };
    });
  },

  createCategory: async (pageId, name, parentId, description, confidence, confidenceLabel) => {
    const category = await categoryApi.create({ pageId, name, parentId, description, confidence, confidenceLabel });
    const state = get();
    if (state.currentPage && state.currentPage.id === pageId) {
      const cats = state.currentPage.categories ?? [];
      const addToTree = (cats: Category[]): Category[] => {
        return cats.map((c) => {
          if (c.id === category.parentId) {
            return { ...c, children: [...(c.children ?? []), category] };
          }
          return { ...c, children: addToTree(c.children ?? []) };
        });
      };
      const newPage = category.parentId === null
        ? { ...state.currentPage, categories: [...cats, { ...category, children: [], tags: [] }] }
        : { ...state.currentPage, categories: addToTree(cats) };
      set({ currentPage: newPage, loadedPages: { ...state.loadedPages, [pageId]: newPage } });
    }
    return category;
  },

  updateCategory: async (id, data) => {
    const cat = await categoryApi.update(id, data);
    set((state) => {
      if (!state.currentPage) return state;
      const cats = state.currentPage.categories ?? [];
      const updateInTree = (cats: Category[]): Category[] => {
        return cats.map((c) => (c.id === id ? { ...c, ...cat } : { ...c, children: updateInTree(c.children ?? []) }));
      };
      const newPage = { ...state.currentPage, categories: updateInTree(cats) };
      return { currentPage: newPage, loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage } };
    });
  },

  deleteCategory: async (id) => {
    await categoryApi.delete(id);
    set((state) => {
      if (!state.currentPage) return state;
      const cats = state.currentPage.categories ?? [];
      const removeFromTree = (cats: Category[]): Category[] =>
        cats
          .filter((c) => c.id !== id)
          .map((c) => ({ ...c, children: removeFromTree(c.children ?? []) }));
      const newPage = { ...state.currentPage, categories: removeFromTree(cats) };
      return { currentPage: newPage, loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage } };
    });
  },

  reorderCategories: async (items) => {
    const result = await categoryApi.reorder(items);
    if (!result.categories) return;
    set((state) => {
      if (!state.currentPage) return state;
      const cats = state.currentPage.categories ?? [];

      const flatten = (list: Category[]): Category[] => {
        const flat: Category[] = [];
        for (const c of list) {
          flat.push(c);
          flat.push(...flatten(c.children ?? []));
        }
        return flat;
      };

      let flat = flatten(cats);
      flat = flat.map((c) => {
        const upd = result.categories.find((u) => u.id === c.id);
        return upd ? { ...c, parentId: upd.parentId, sortOrder: upd.sortOrder } : c;
      });

      const rootCats = flat.filter((c) => c.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder);
      const buildTree = (parentId: number | null): Category[] => {
        const children = flat
          .filter((c) => c.parentId === parentId)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((c) => ({ ...c, children: buildTree(c.id) }));
        return children;
      };

      const newPage = { ...state.currentPage, categories: buildTree(null) };
      return { currentPage: newPage, loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage } };
    });
  },

  createTag: async (pageId, categoryId, name, confidence = 50, description?, confidenceLabel?) => {
    const tag = await tagApi.create({ pageId, categoryId, name, confidence, description, confidenceLabel });
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
    const result = await tagApi.reorder(items);
    if (!result.tags) return;
    set((state) => {
      if (!state.currentPage) return state;
      const cats = state.currentPage.categories ?? [];

      const collectTags = (list: Category[]): Tag[] => {
        const tags: Tag[] = [];
        for (const c of list) {
          tags.push(...(c.tags ?? []));
          tags.push(...collectTags(c.children ?? []));
        }
        return tags;
      };

      let allTags = collectTags(cats);
      allTags = allTags.map((t) => {
        const upd = result.tags.find((u) => u.id === t.id);
        return upd ? { ...t, categoryId: upd.categoryId, sortOrder: upd.sortOrder } : t;
      });

      const addToTree = (list: Category[]): Category[] =>
        list.map((c) => {
          const catTags = allTags.filter((t) => t.categoryId === c.id);
          allTags = allTags.filter((t) => t.categoryId !== c.id);
          return {
            ...c,
            tags: catTags.sort((a, b) => a.sortOrder - b.sortOrder),
            children: addToTree(c.children ?? []),
          };
        });

      const newCats = addToTree(cats);
      const newPage = { ...state.currentPage, categories: newCats };
      return { currentPage: newPage, loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage } };
    });
  },

  addTagToPage: (tag) => {
    set((state) => {
      if (!state.currentPage) return state;
      const cats = state.currentPage.categories ?? [];
      const addToTree = (cats: Category[]): Category[] =>
        cats.map((c) => {
          if (c.id === tag.categoryId) return { ...c, tags: [...(c.tags ?? []), tag] };
          return { ...c, children: addToTree(c.children ?? []) };
        });
      const newPage = { ...state.currentPage, categories: addToTree(cats) };
      return { currentPage: newPage, loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage } };
    });
  },

  updateTagInPage: (tag) => {
    set((state) => {
      if (!state.currentPage) return state;
      const cats = state.currentPage.categories ?? [];
      const updateInTree = (cats: Category[]): Category[] =>
        cats.map((c) => ({
          ...c,
          tags: (c.tags ?? []).map((t) => (t.id === tag.id ? { ...t, ...tag } : t)),
          children: updateInTree(c.children ?? []),
        }));
      const newPage = { ...state.currentPage, categories: updateInTree(cats) };
      return { currentPage: newPage, loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage } };
    });
  },

  removeTagFromPage: (tagId) => {
    set((state) => {
      if (!state.currentPage) return state;
      const cats = state.currentPage.categories ?? [];
      const removeFromTree = (cats: Category[]): Category[] =>
        cats.map((c) => ({
          ...c,
          tags: (c.tags ?? []).filter((t) => t.id !== tagId),
          children: removeFromTree(c.children ?? []),
        }));
      const newPage = { ...state.currentPage, categories: removeFromTree(cats) };
      return { currentPage: newPage, loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage } };
    });
  },

  setCurrentPage: (page) => {
    if (!page) {
      set({ currentPage: null });
      return;
    }
    const state = get();
    const fullPage = state.loadedPages[page.id];
    set({ currentPage: fullPage ?? page });
  },

  isPageLoaded: (id: number) => {
    return !!get().loadedPages[id];
  },
}));
