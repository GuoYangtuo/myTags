import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

const router = Router();

router.get('/user/:username', async (req: Request, res: Response) => {
  try {
    const nickname = decodeURIComponent(req.params.username as string);
    const user = await prisma.user.findFirst({
      where: { nickname },
      select: { id: true, nickname: true, avatarSeed: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const pages = await prisma.page.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, description: true },
    });

    res.json({ ...user, pages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/share/:code', async (req: Request, res: Response) => {
  try {
    const shareCode = req.params.code as string;
    const share = await prisma.share.findUnique({
      where: { shareCode },
      include: {
        page: {
          include: {
            user: { select: { nickname: true, avatarSeed: true } },
            categories: {
              orderBy: { sortOrder: 'asc' },
              where: { parentId: null },
              include: {
                tags: { orderBy: { sortOrder: 'asc' } },
                children: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    tags: { orderBy: { sortOrder: 'asc' } },
                    children: {
                      orderBy: { sortOrder: 'asc' },
                      include: {
                        tags: { orderBy: { sortOrder: 'asc' } },
                        children: {
                          orderBy: { sortOrder: 'asc' },
                          include: {
                            tags: { orderBy: { sortOrder: 'asc' } },
                            children: {
                              orderBy: { sortOrder: 'asc' },
                              include: {
                                tags: { orderBy: { sortOrder: 'asc' } },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!share) {
      res.status(404).json({ error: 'Share not found' });
      return;
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      res.status(410).json({ error: 'Share link has expired' });
      return;
    }

    let visibleCategoryIds: number[] | null = null;
    if (share.visibleItems) {
      visibleCategoryIds = JSON.parse(share.visibleItems) as number[];
    }

    const filterCategories = (cats: any[]): any[] => {
      return cats
        .filter((cat) => visibleCategoryIds === null || visibleCategoryIds.includes(cat.id))
        .map((cat) => ({
          ...cat,
          children: filterCategories(cat.children || []),
        }));
    };

    const filteredCategories = filterCategories(share.page.categories);

    res.json({
      page: {
        ...share.page,
        categories: filteredCategories,
      },
      expiresAt: share.expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/page/:pageId', async (req: Request, res: Response) => {
  try {
    const pageId = parseInt(req.params.pageId as string);
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        user: { select: { nickname: true, avatarSeed: true } },
        categories: {
          orderBy: { sortOrder: 'asc' },
          where: { parentId: null },
          include: {
            tags: { orderBy: { sortOrder: 'asc' } },
            children: {
              orderBy: { sortOrder: 'asc' },
              include: {
                tags: { orderBy: { sortOrder: 'asc' } },
                children: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    tags: { orderBy: { sortOrder: 'asc' } },
                    children: {
                      orderBy: { sortOrder: 'asc' },
                      include: {
                        tags: { orderBy: { sortOrder: 'asc' } },
                        children: {
                          orderBy: { sortOrder: 'asc' },
                          include: {
                            tags: { orderBy: { sortOrder: 'asc' } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    res.json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
