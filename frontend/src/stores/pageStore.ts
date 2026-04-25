import { create } from 'zustand';
import type { Page, Category, Tag } from '../types';
import { pageApi } from '../api/pages';

interface PageState {
  pages: Page[];
  currentPage: Page | null;
  loadedPages: Record<number, Page>;
  loading: boolean;
  saving: boolean;
  isDirty: boolean;  // 是否有未保存的更改
  nextId: number;    // 为新创建的分类/标签生成唯一 ID

  fetchPages: () => Promise<void>;
  fetchPage: (id: number) => Promise<void>;
  createPage: (name: string, description?: string) => Promise<Page>;
  updatePage: (id: number, data: { name?: string; description?: string }) => Promise<void>;
  deletePage: (id: number) => Promise<void>;
  setCurrentPage: (page: Page | null) => void;
  isPageLoaded: (id: number) => boolean;

  // 保存页面内容（手动保存）
  saveContent: () => Promise<void>;
  markDirty: () => void;

  // 分类操作
  createCategory: (parentId: number | null, name: string, description?: string, confidence?: number, confidenceLabel?: string) => void;
  updateCategory: (id: number, data: { name?: string; description?: string; confidence?: number; confidenceLabel?: string }) => void;
  deleteCategory: (id: number) => void;
  moveCategory: (categoryId: number, newParentId: number | null) => void;

  // 标签操作
  createTag: (categoryId: number, name: string, confidence?: number, description?: string, confidenceLabel?: string) => void;
  updateTag: (id: number, data: { name?: string; description?: string; confidence?: number; confidenceLabel?: string; navUrl?: string | null }) => void;
  deleteTag: (id: number) => void;
  moveTag: (tagId: number, targetCategoryId: number) => void;

  // 拖拽排序
  reorderTags: (categoryId: number, tagIds: number[]) => void;
  reorderCategories: (parentId: number | null, categoryIds: number[]) => void;
}

// 生成唯一 ID（用于本地新建的分类和标签）
let idCounter = 100000;
const generateId = () => {
  idCounter -= 1;
  return idCounter;
};

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  currentPage: null,
  loadedPages: {},
  loading: false,
  saving: false,
  isDirty: false,
  nextId: generateId(),

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
        isDirty: false,
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

  setCurrentPage: (page) => {
    if (!page) {
      set({ currentPage: null, isDirty: false });
      return;
    }
    const state = get();
    const fullPage = state.loadedPages[page.id];
    set({ currentPage: fullPage ?? page, isDirty: false });
  },

  isPageLoaded: (id: number) => {
    return !!get().loadedPages[id];
  },

  saveContent: async () => {
    const { currentPage } = get();
    if (!currentPage) return;

    set({ saving: true });
    try {
      const content = { categories: currentPage.categories };
      const updated = await pageApi.saveContent(currentPage.id, content);
      set((state) => ({
        currentPage: updated,
        loadedPages: { ...state.loadedPages, [currentPage.id]: updated },
        saving: false,
        isDirty: false,
      }));
    } catch {
      set({ saving: false });
      throw new Error('保存失败');
    }
  },

  markDirty: () => {
    set({ isDirty: true });
  },

  // ==================== 分类操作 ====================

  createCategory: (parentId, name, description = '', confidence = 50, confidenceLabel = '置信度') => {
    const newCategory: Category = {
      id: generateId(),
      name,
      description,
      confidence,
      confidenceLabel,
      children: [],
      tags: [],
    };

    set((state) => {
      if (!state.currentPage) return state;

      const addToTree = (cats: Category[]): Category[] => {
        return cats.map((c) => {
          if (c.id === parentId) {
            return { ...c, children: [...c.children, newCategory] };
          }
          return { ...c, children: addToTree(c.children) };
        });
      };

      const newCategories = parentId === null
        ? [...state.currentPage.categories, newCategory]
        : addToTree(state.currentPage.categories);

      const newPage = { ...state.currentPage, categories: newCategories };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },

  updateCategory: (id, data) => {
    set((state) => {
      if (!state.currentPage) return state;

      const updateInTree = (cats: Category[]): Category[] => {
        return cats.map((c) => {
          if (c.id === id) {
            return { ...c, ...data };
          }
          return { ...c, children: updateInTree(c.children) };
        });
      };

      const newPage = { ...state.currentPage, categories: updateInTree(state.currentPage.categories) };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },

  deleteCategory: (id) => {
    set((state) => {
      if (!state.currentPage) return state;

      const removeFromTree = (cats: Category[]): Category[] =>
        cats
          .filter((c) => c.id !== id)
          .map((c) => ({ ...c, children: removeFromTree(c.children) }));

      const newPage = { ...state.currentPage, categories: removeFromTree(state.currentPage.categories) };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },

  moveCategory: (categoryId, newParentId) => {
    set((state) => {
      if (!state.currentPage) return state;

      // 找到要移动的分类
      let movedCategory: Category | null = null;
      const findAndRemove = (cats: Category[]): Category[] => {
        return cats.filter((c) => {
          if (c.id === categoryId) {
            movedCategory = c;
            return false;
          }
          c.children = findAndRemove(c.children);
          return true;
        });
      };

      let cats = findAndRemove([...state.currentPage.categories]);
      if (!movedCategory) return state;

      // 添加到新位置
      if (newParentId === null) {
        cats.push(movedCategory);
      } else {
        const addToParent = (cats: Category[]): Category[] => {
          return cats.map((c) => {
            if (c.id === newParentId) {
              return { ...c, children: [...c.children, movedCategory!] };
            }
            return { ...c, children: addToParent(c.children) };
          });
        };
        cats = addToParent(cats);
      }

      const newPage = { ...state.currentPage, categories: cats };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },

  // ==================== 标签操作 ====================

  createTag: (categoryId, name, confidence = 50, description = '', confidenceLabel = '置信度') => {
    const newTag: Tag = {
      id: generateId(),
      name,
      description,
      confidence,
      confidenceLabel,
      navUrl: null,
    };

    set((state) => {
      if (!state.currentPage) return state;

      const addToTree = (cats: Category[]): Category[] => {
        return cats.map((c) => {
          if (c.id === categoryId) {
            return { ...c, tags: [...c.tags, newTag] };
          }
          return { ...c, children: addToTree(c.children) };
        });
      };

      const newPage = { ...state.currentPage, categories: addToTree(state.currentPage.categories) };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },

  updateTag: (id, data) => {
    set((state) => {
      if (!state.currentPage) return state;

      const updateInTree = (cats: Category[]): Category[] => {
        return cats.map((c) => ({
          ...c,
          tags: c.tags.map((t) => (t.id === id ? { ...t, ...data } : t)),
          children: updateInTree(c.children),
        }));
      };

      const newPage = { ...state.currentPage, categories: updateInTree(state.currentPage.categories) };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },

  deleteTag: (id) => {
    set((state) => {
      if (!state.currentPage) return state;

      const removeFromTree = (cats: Category[]): Category[] => {
        return cats.map((c) => ({
          ...c,
          tags: c.tags.filter((t) => t.id !== id),
          children: removeFromTree(c.children),
        }));
      };

      const newPage = { ...state.currentPage, categories: removeFromTree(state.currentPage.categories) };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },

  moveTag: (tagId, targetCategoryId) => {
    set((state) => {
      if (!state.currentPage) return state;

      let movedTag: Tag | null = null;
      const cats = state.currentPage.categories;

      // 从树中移除标签
      const removeTag = (categories: Category[]): Category[] => {
        return categories.map((c) => ({
          ...c,
          tags: c.tags.filter((t) => {
            if (t.id === tagId) {
              movedTag = t;
              return false;
            }
            return true;
          }),
          children: removeTag(c.children),
        }));
      };

      // 添加标签到目标分类
      const addTag = (categories: Category[]): Category[] => {
        return categories.map((c) => {
          if (c.id === targetCategoryId && movedTag) {
            return { ...c, tags: [...c.tags, movedTag] };
          }
          return { ...c, children: addTag(c.children) };
        });
      };

      let newCats = removeTag(cats);
      if (movedTag) {
        newCats = addTag(newCats);
      }

      const newPage = { ...state.currentPage, categories: newCats };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },

  // ==================== 拖拽排序 ====================

  reorderTags: (categoryId, tagIds) => {
    set((state) => {
      if (!state.currentPage) return state;

      const reorderInTree = (cats: Category[]): Category[] => {
        return cats.map((c) => {
          if (c.id === categoryId) {
            const tagMap = new Map(c.tags.map((t) => [t.id, t]));
            const reorderedTags = tagIds.map((id) => tagMap.get(id)!).filter(Boolean);
            return { ...c, tags: reorderedTags };
          }
          return { ...c, children: reorderInTree(c.children) };
        });
      };

      const newPage = { ...state.currentPage, categories: reorderInTree(state.currentPage.categories) };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },

  reorderCategories: (parentId, categoryIds) => {
    set((state) => {
      if (!state.currentPage) return state;

      const reorderInTree = (cats: Category[]): Category[] => {
        return cats.map((c) => ({
          ...c,
          children: reorderInTree(c.children),
        }));
      };

      const reorderAtLevel = (cats: Category[], targetParentId: number | null): Category[] => {
        if (targetParentId === null) {
          const catMap = new Map(cats.map((c) => [c.id, c]));
          const reordered = categoryIds.map((id) => catMap.get(id)!).filter(Boolean);
          return reordered.map((c) => ({ ...c, children: reorderInTree(c.children) }));
        }

        return cats.map((c) => {
          if (c.id === targetParentId) {
            const catMap = new Map(c.children.map((child) => [child.id, child]));
            const reorderedChildren = categoryIds.map((id) => catMap.get(id)!).filter(Boolean);
            return {
              ...c,
              children: reorderedChildren.map((child) => ({ ...child, children: reorderInTree(child.children) })),
            };
          }
          return { ...c, children: reorderAtLevel(c.children, targetParentId) };
        });
      };

      const newPage = { ...state.currentPage, categories: reorderAtLevel(state.currentPage.categories, parentId) };
      return {
        currentPage: newPage,
        loadedPages: { ...state.loadedPages, [state.currentPage.id]: newPage },
        isDirty: true,
      };
    });
  },
}));
