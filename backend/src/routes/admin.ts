import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { generateToken } from '../utils/jwt.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

router.use(async (req: AuthRequest, res: Response, next) => {
  if (!req.userId || !isAdmin(req.userId)) {
    res.status(403).json({ error: 'Forbidden: admin only' });
    return;
  }
  next();
});

router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, nickname: true, avatarSeed: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const updateUserSchema = z.object({
  nickname: z.string().min(1).max(30).optional(),
  password: z.string().min(1).max(20).optional(),
});

router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }
    if (userId === 1) {
      res.status(400).json({ error: 'Cannot modify admin user' });
      return;
    }

    const data = updateUserSchema.parse(req.body);
    const updateData: { nickname?: string; password?: string } = {};
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.password !== undefined) updateData.password = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, nickname: true, avatarSeed: true, createdAt: true },
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

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }
    if (userId === 1) {
      res.status(400).json({ error: 'Cannot delete admin user' });
      return;
    }

    await prisma.share.deleteMany({ where: { userId } });
    await prisma.page.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users/:id/impersonate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nickname: true, avatarSeed: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const token = generateToken(user.id);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
