import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
  userId?: number;
}

const tokenCache = new Map<string, { userId: number; exp: number }>();

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const now = Math.floor(Date.now() / 1000);

    let payload: { userId: number; exp: number } | undefined = tokenCache.get(token);
    if (!payload) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; exp: number };
        payload = { userId: decoded.userId, exp: decoded.exp ?? 0 };
        if (payload.exp > now) {
          tokenCache.set(token, payload);
        }
      } catch {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
    }

    if (payload.exp > 0 && payload.exp < now) {
      tokenCache.delete(token);
      res.status(401).json({ error: 'Token expired' });
      return;
    }

    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
