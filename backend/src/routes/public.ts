import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

const router = Router();

interface PageContent {
  categories: CategoryData[];
}

interface CategoryData {
  id: number;
  name: string;
  description: string;
  confidence: number;
  confidenceLabel: string;
  children: CategoryData[];
  tags: TagData[];
}

interface TagData {
  id: number;
  name: string;
  description: string;
  confidence: number;
  confidenceLabel: string;
  navUrl: string | null;
}

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

    // 解析 content JSON
    let pageContent: PageContent = { categories: [] };
    try {
      pageContent = JSON.parse(share.page.content);
    } catch {
      pageContent = { categories: [] };
    }

    res.json({
      page: {
        id: share.page.id,
        name: share.page.name,
        description: share.page.description,
        categories: pageContent.categories,
        user: share.page.user,
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
      },
    });

    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    // 解析 content JSON
    let pageContent: PageContent = { categories: [] };
    try {
      pageContent = JSON.parse(page.content);
    } catch {
      pageContent = { categories: [] };
    }

    res.json({
      id: page.id,
      name: page.name,
      description: page.description,
      categories: pageContent.categories,
      user: page.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
