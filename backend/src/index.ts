import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import pageRoutes from './routes/pages.js';
import shareRoutes from './routes/shares.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

export const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

async function ensureAdminUser() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!existing) {
    const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password,
        nickname: '管理员',
        avatarSeed: 'admin-seed',
      },
    });
    console.log(`Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    const isMatch = await bcrypt.compare(ADMIN_PASSWORD, existing.password);
    if (!isMatch) {
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: { password: await bcrypt.hash(ADMIN_PASSWORD, 10) },
      });
      console.log(`Admin password updated: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, async () => {
  await ensureAdminUser();
  console.log(`Server running on http://localhost:${PORT}`);
});
