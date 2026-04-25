import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createPageSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      where: { userId: req.userId },
      include: {
        _count: { select: { tags: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createPageSchema.parse(req.body);
    const page = await prisma.page.create({
      data: {
        userId: req.userId!,
        name: data.name,
        description: data.description || '',
      },
    });
    res.json(page);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const pageId = parseInt(req.params.id as string);
    const page = await prisma.page.findFirst({ where: { id: pageId, userId: req.userId } });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const updated = await prisma.page.update({
      where: { id: pageId },
      data: {
        name: req.body.name ?? page.name,
        description: req.body.description ?? page.description,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const pageId = parseInt(req.params.id as string);
    const page = await prisma.page.findFirst({ where: { id: pageId, userId: req.userId } });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    await prisma.page.delete({ where: { id: pageId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const pageId = parseInt(req.params.id as string);
    const page = await prisma.page.findFirst({
      where: { id: pageId, userId: req.userId },
      include: {
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
