import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createCategorySchema = z.object({
  pageId: z.number(),
  parentId: z.number().nullable().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  confidence: z.number().min(-20).max(120).optional(),
  confidenceLabel: z.string().max(50).optional(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createCategorySchema.parse(req.body);

    const page = await prisma.page.findFirst({ where: { id: data.pageId, userId: req.userId } });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    if (data.parentId) {
      const parent = await prisma.category.findFirst({ where: { id: data.parentId, pageId: data.pageId } });
      if (!parent) {
        res.status(400).json({ error: 'Parent category not found' });
        return;
      }
    }

    const maxOrder = await prisma.category.aggregate({
      where: { pageId: data.pageId, parentId: data.parentId ?? null },
      _max: { sortOrder: true },
    });

    const category = await prisma.category.create({
      data: {
        pageId: data.pageId,
        parentId: data.parentId ?? null,
        name: data.name,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        description: data.description ?? "",
        confidence: data.confidence ?? 50,
        confidenceLabel: data.confidenceLabel ?? "置信度",
      },
    });
    res.json(category);
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
    const catId = parseInt(req.params.id as string);
    const category = await prisma.category.findFirst({
      where: { id: catId },
      include: { page: true },
    });
    if (!category || category.page.userId !== req.userId) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const updated = await prisma.category.update({
      where: { id: catId },
      data: {
        name: req.body.name ?? category.name,
        parentId: req.body.parentId !== undefined ? (req.body.parentId ?? null) : category.parentId,
        description: req.body.description !== undefined ? req.body.description : category.description,
        confidence: req.body.confidence !== undefined ? req.body.confidence : category.confidence,
        confidenceLabel: req.body.confidenceLabel !== undefined ? req.body.confidenceLabel : category.confidenceLabel,
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
    const catId = parseInt(req.params.id as string);
    const category = await prisma.category.findFirst({
      where: { id: catId },
      include: { page: true },
    });
    if (!category || category.page.userId !== req.userId) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await prisma.category.delete({ where: { id: catId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body as { items: { id: number; parentId: number | null; sortOrder: number }[] };

    for (const item of items) {
      await prisma.category.update({
        where: { id: item.id },
        data: { parentId: item.parentId, sortOrder: item.sortOrder },
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
