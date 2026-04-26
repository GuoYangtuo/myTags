import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createShareSchema = z.object({
  pageId: z.number(),
  expiresAt: z.string().datetime().nullable().optional(),
  visibleItems: z.array(z.number()).optional(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createShareSchema.parse(req.body);

    const page = await prisma.page.findFirst({ where: { id: data.pageId, userId: req.userId } });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const shareCode = nanoid(10);

    const share = await prisma.share.create({
      data: {
        userId: req.userId!,
        pageId: data.pageId,
        shareCode,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        visibleItems: data.visibleItems ? JSON.stringify(data.visibleItems) : null,
      },
    });

    res.json({
      id: share.id,
      shareCode: share.shareCode,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const shares = await prisma.share.findMany({
      where: { userId: req.userId },
      include: {
        page: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(shares);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const shareId = parseInt(req.params.id as string);
    const share = await prisma.share.findFirst({ where: { id: shareId, userId: req.userId } });
    if (!share) {
      res.status(404).json({ error: 'Share not found' });
      return;
    }

    await prisma.share.delete({ where: { id: shareId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
