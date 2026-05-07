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
  identifier: z.string().min(1),
  password: z.string().min(1),
});

// 初始页面内容模板
const createInitialContent = () => ({
  categories: [
    {
      id: 1,
      name: '关键成分',
      description: '',
      confidence: 50,
      confidenceLabel: '置信度',
      children: [],
      tags: [],
    },
    {
      id: 2,
      name: '性格特点',
      description: '',
      confidence: 50,
      confidenceLabel: '置信度',
      children: [
        {
          id: 3,
          name: '性格优点',
          description: '',
          confidence: 50,
          confidenceLabel: '置信度',
          children: [],
          tags: [],
        },
        {
          id: 4,
          name: '性格缺点',
          description: '',
          confidence: 50,
          confidenceLabel: '置信度',
          children: [],
          tags: [],
        },
      ],
      tags: [],
    },
    {
      id: 5,
      name: '兴趣爱好',
      description: '',
      confidence: 50,
      confidenceLabel: '置信度',
      children: [
        {
          id: 6,
          name: '游戏',
          description: '',
          confidence: 50,
          confidenceLabel: '置信度',
          children: [],
          tags: [],
        },
        {
          id: 7,
          name: '动漫',
          description: '',
          confidence: 50,
          confidenceLabel: '置信度',
          children: [],
          tags: [],
        },
        {
          id: 8,
          name: '音乐',
          description: '',
          confidence: 50,
          confidenceLabel: '置信度',
          children: [],
          tags: [],
        },
      ],
      tags: [],
    },
    {
      id: 9,
      name: '特长之处',
      description: '',
      confidence: 50,
      confidenceLabel: '置信度',
      children: [],
      tags: [],
    },
    {
      id: 10,
      name: '联系方式',
      description: '',
      confidence: 50,
      confidenceLabel: '置信度',
      children: [],
      tags: [],
    },
  ],
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

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password,
        nickname: data.nickname || data.email.split('@')[0],
        avatarSeed,
        pages: {
          create: {
            name: '个人主页',
            content: JSON.stringify(createInitialContent()),
          },
        },
      },
    });

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, nickname: user.nickname, avatarSeed: user.avatarSeed, isVip: user.isVip, vipExpireAt: user.vipExpireAt ? user.vipExpireAt.toISOString() : null } });
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

    if (data.identifier !== 'admin' && !data.identifier.includes('@')) {
      res.status(400).json({ error: 'Please use email to log in' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: data.identifier === 'admin'
        ? undefined
        : { email: data.identifier },
    });
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
    res.json({ token, user: { id: user.id, email: user.email, nickname: user.nickname, avatarSeed: user.avatarSeed, isVip: user.isVip, vipExpireAt: user.vipExpireAt ? user.vipExpireAt.toISOString() : null } });
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
      select: { id: true, email: true, nickname: true, avatarSeed: true, isVip: true, vipExpireAt: true },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const updateProfileSchema = z.object({
  nickname: z.string().min(1).max(30),
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { nickname: data.nickname },
      select: { id: true, email: true, nickname: true, avatarSeed: true },
    });
    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
