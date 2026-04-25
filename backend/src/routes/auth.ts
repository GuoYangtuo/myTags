import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { generateToken } from '../utils/jwt.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nickname: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const password = await bcrypt.hash(data.password, 10);
    const avatarSeed = Math.random().toString(36).substring(2, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password,
          nickname: data.nickname || data.email.split('@')[0],
          avatarSeed,
          pages: {
            create: {
              name: '个人主页',
            },
          },
        },
      });

      const page = await tx.page.findFirst({ where: { userId: newUser.id } });

      const 关键成分 = await tx.category.create({
        data: { pageId: page!.id, name: '关键成分', sortOrder: 0 },
      });

      const 性格特点 = await tx.category.create({
        data: { pageId: page!.id, name: '性格特点', sortOrder: 1 },
      });
      await tx.category.createMany({
        data: [
          { pageId: page!.id, parentId: 性格特点.id, name: '性格优点', sortOrder: 0 },
          { pageId: page!.id, parentId: 性格特点.id, name: '性格缺点', sortOrder: 1 },
        ],
      });

      const 兴趣爱好 = await tx.category.create({
        data: { pageId: page!.id, name: '兴趣爱好', sortOrder: 2 },
      });
      await tx.category.createMany({
        data: [
          { pageId: page!.id, parentId: 兴趣爱好.id, name: '游戏', sortOrder: 0 },
          { pageId: page!.id, parentId: 兴趣爱好.id, name: '动漫', sortOrder: 1 },
          { pageId: page!.id, parentId: 兴趣爱好.id, name: '音乐', sortOrder: 2 },
        ],
      });

      await tx.category.createMany({
        data: [
          { pageId: page!.id, name: '特长之处', sortOrder: 3 },
          { pageId: page!.id, name: '联系方式', sortOrder: 4 },
        ],
      });

      return newUser;
    });

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, nickname: user.nickname, avatarSeed: user.avatarSeed } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, nickname: user.nickname, avatarSeed: user.avatarSeed } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, nickname: true, avatarSeed: true },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
