import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createTagSchema = z.object({
  pageId: z.number(),
  categoryId: z.number(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  confidence: z.number().min(-20).max(120).optional(),
  confidenceLabel: z.string().max(50).optional(),
  navUrl: z.string().max(500).nullable().optional(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createTagSchema.parse(req.body);

    const page = await prisma.page.findFirst({ where: { id: data.pageId, userId: req.userId } });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const category = await prisma.category.findFirst({ where: { id: data.categoryId, pageId: data.pageId } });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const maxOrder = await prisma.tag.aggregate({
      where: { categoryId: data.categoryId },
      _max: { sortOrder: true },
    });

    const tag = await prisma.tag.create({
      data: {
        pageId: data.pageId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description ?? "",
        confidence: data.confidence ?? 50,
        confidenceLabel: data.confidenceLabel ?? "置信度",
        navUrl: data.navUrl ?? null,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
    res.json(tag);
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
    const tagId = parseInt(req.params.id as string);
    const tag = await prisma.tag.findFirst({
      where: { id: tagId },
      include: { page: true },
    });
    if (!tag || tag.page.userId !== req.userId) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    const updated = await prisma.tag.update({
      where: { id: tagId },
      data: {
        name: req.body.name ?? tag.name,
        description: req.body.description !== undefined ? req.body.description : tag.description,
        confidence: req.body.confidence !== undefined ? req.body.confidence : tag.confidence,
        confidenceLabel: req.body.confidenceLabel !== undefined ? req.body.confidenceLabel : tag.confidenceLabel,
        navUrl: req.body.navUrl !== undefined ? req.body.navUrl : tag.navUrl,
        categoryId: req.body.categoryId ?? tag.categoryId,
        sortOrder: req.body.sortOrder ?? tag.sortOrder,
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
    const tagId = parseInt(req.params.id as string);
    const tag = await prisma.tag.findFirst({
      where: { id: tagId },
      include: { page: true },
    });
    if (!tag || tag.page.userId !== req.userId) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    await prisma.tag.delete({ where: { id: tagId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body as {
      items: { id: number; categoryId: number; sortOrder: number }[];
    };

    for (const item of items) {
      await prisma.tag.update({
        where: { id: item.id },
        data: { categoryId: item.categoryId, sortOrder: item.sortOrder },
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
