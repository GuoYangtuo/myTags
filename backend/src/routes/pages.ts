import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

// 内容数据结构
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

const createPageSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
    });
    // 列表不返回 content，减少数据量
    const result = pages.map(p => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
    res.json(result);
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
        content: JSON.stringify({ categories: [] }),
      },
    });
    res.json({
      id: page.id,
      userId: page.userId,
      name: page.name,
      description: page.description,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      categories: [],
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

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const pageId = parseInt(req.params.id as string);
    const page = await prisma.page.findFirst({ where: { id: pageId, userId: req.userId } });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const updateData: { name?: string; description?: string; content?: string } = {};

    if (req.body.name !== undefined) {
      updateData.name = req.body.name;
    }
    if (req.body.description !== undefined) {
      updateData.description = req.body.description;
    }
    if (req.body.content !== undefined) {
      // 验证 JSON 格式
      if (typeof req.body.content === 'string') {
        JSON.parse(req.body.content); // 验证是否是有效 JSON
        updateData.content = req.body.content;
      } else if (typeof req.body.content === 'object') {
        updateData.content = JSON.stringify(req.body.content);
      }
    }

    const updated = await prisma.page.update({
      where: { id: pageId },
      data: updateData,
    });

    // 返回完整数据
    let pageContent: PageContent = { categories: [] };
    try {
      pageContent = JSON.parse(updated.content);
    } catch {}

    res.json({
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      description: updated.description,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      categories: pageContent.categories,
    });
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
      userId: page.userId,
      name: page.name,
      description: page.description,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      categories: pageContent.categories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
