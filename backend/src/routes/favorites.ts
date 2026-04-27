import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const addFavoriteSchema = z.object({
  shareCode: z.string().min(1),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = addFavoriteSchema.parse(req.body);

    const share = await prisma.share.findUnique({ where: { shareCode: data.shareCode } });
    if (!share) {
      res.status(404).json({ error: '分享链接不存在' });
      return;
    }

    const existing = await prisma.favorite.findFirst({
      where: { userId: req.userId, shareCode: data.shareCode },
    });
    if (existing) {
      res.json({ success: true, favorited: true });
      return;
    }

    await prisma.favorite.create({
      data: { userId: req.userId!, shareCode: data.shareCode },
    });

    res.json({ success: true, favorited: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:shareCode', async (req: AuthRequest, res: Response) => {
  try {
    const shareCode = req.params.shareCode as string;
    await prisma.favorite.deleteMany({
      where: { userId: req.userId, shareCode },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    const shareCodes = favorites.map((f) => f.shareCode);
    if (shareCodes.length === 0) {
      res.json([]);
      return;
    }

    const shares = await prisma.share.findMany({
      where: { shareCode: { in: shareCodes } },
      include: {
        page: {
          select: { id: true, name: true, description: true, user: { select: { nickname: true, avatarSeed: true } } },
        },
        user: { select: { nickname: true, avatarSeed: true } },
      },
    });

    const shareMap = new Map(shares.map((s) => [s.shareCode, s]));

    const result = favorites.map((fav) => {
      const share = shareMap.get(fav.shareCode);
      if (!share) return null;
      return {
        shareCode: fav.shareCode,
        createdAt: fav.createdAt,
        page: {
          id: share.page.id,
          name: share.page.name,
          description: share.page.description,
          user: share.page.user,
        },
        shareUser: share.user,
        expiresAt: share.expiresAt,
      };
    }).filter(Boolean);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/check/:shareCode', async (req: AuthRequest, res: Response) => {
  try {
    const shareCode = req.params.shareCode as string;
    const favorite = await prisma.favorite.findFirst({
      where: { userId: req.userId, shareCode },
    });
    res.json({ favorited: !!favorite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
