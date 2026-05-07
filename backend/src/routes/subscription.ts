import { Router, Response } from 'express';
import axios from 'axios';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { rsaSign, rsaVerify } from '../utils/zblPay.js';
import { z } from 'zod';

const router = Router();

// VIP 定价（元）
const VIP_PRICE = '6.90';

// 获取支付配置（从环境变量）
function getPayConfig() {
  return {
    apiUrl: process.env.ZBL_PAY_API_URL || 'https://pay.80z.top',
    pid: process.env.ZBL_PAY_PID,
    privateKey: process.env.ZBL_PAY_PRIVATE_KEY,
    publicKey: process.env.ZBL_PAY_PUBLIC_KEY,
    notifyUrl: process.env.ZBL_PAY_NOTIFY_URL,
    returnUrl: process.env.ZBL_PAY_RETURN_URL,
  };
}

// 判断用户是否为 VIP（未过期）
async function isUserVip(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (!user.isVip) return false;
  if (!user.vipExpireAt) return true; // null = 永久 VIP
  return new Date(user.vipExpireAt) > new Date();
}

// 计算续费/新购 VIP 过期时间
function addVipMonth(from: Date | null): Date {
  const base = from && from > new Date() ? from : new Date();
  return new Date(base.getFullYear(), base.getMonth() + 1, base.getDate());
}

// -------------------------------------------
// GET /api/subscription/status  — 获取当前 VIP 状态（需登录）
// -------------------------------------------
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isVip: true, vipExpireAt: true },
    });
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const vip = user.isVip && (!user.vipExpireAt || new Date(user.vipExpireAt) > new Date());
    res.json({
      isVip: vip,
      isVipForever: user.isVip && !user.vipExpireAt,
      vipExpireAt: user.vipExpireAt ? user.vipExpireAt.toISOString() : null,
      price: VIP_PRICE,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// -------------------------------------------
// POST /api/subscription/create  — 创建 VIP 订阅支付订单（需登录）
// -------------------------------------------
const createSchema = z.object({
  payType: z.enum(['alipay', 'wxpay']),
  device: z.enum(['pc', 'h5']).optional().default('pc'),
});

router.post('/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const cfg = getConfig();

    if (!cfg.pid || !cfg.privateKey || !cfg.publicKey || !cfg.notifyUrl || !cfg.returnUrl) {
      res.status(500).json({ error: '支付配置未完成，请联系管理员配置 ZBL_PAY 环境变量' });
      return;
    }

    // 生成本地订单号
    const outTradeNo = `vip_${req.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const requestParams: Record<string, unknown> = {
      pid: cfg.pid,
      method: data.device === 'h5' ? 'wap' : 'web',
      device: data.device,
      type: data.payType,
      out_trade_no: outTradeNo,
      notify_url: cfg.notifyUrl,
      return_url: cfg.returnUrl,
      name: 'myTags VIP 会员（1个月）',
      money: VIP_PRICE,
      clientip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || (req.socket.remoteAddress ?? ''),
      param: String(req.userId),
      timestamp,
      sign_type: 'RSA',
    };

    const sign = rsaSign(requestParams, cfg.privateKey);
    requestParams['sign'] = sign;

    // 调试模式：跳过真实支付，直接开通 VIP（仅本地开发使用）
const DEBUG_VIP = process.env.DEBUG_VIP === 'true';

// 在本地记录订阅订单
await prisma.subscription.create({
  data: {
    userId: req.userId!,
    orderNo: outTradeNo,
    money: parseFloat(VIP_PRICE),
    status: 'pending',
    payType: data.payType,
  },
});

// -------------------------------------------
// 调试模式：跳过真实支付，直接开通 VIP
// -------------------------------------------
if (DEBUG_VIP) {
  console.log(`[DEBUG VIP] userId=${req.userId} 调试模式直接开通 VIP`);

  const newExpireAt = addVipMonth(null);

  await prisma.subscription.update({
    where: { orderNo: outTradeNo },
    data: { status: 'paid', expiredAt: newExpireAt },
  });

  await prisma.user.update({
    where: { id: req.userId! },
    data: { isVip: true, vipExpireAt: newExpireAt },
  });

  res.json({
    debug: true,
    out_trade_no: outTradeNo,
    trade_no: `debug_${Date.now()}`,
    message: '调试模式：VIP 已直接开通',
    vipExpireAt: newExpireAt.toISOString(),
  });
  return;
}

// -------------------------------------------
// 正式支付流程
// -------------------------------------------
const response = await axios.post(
      `${cfg.apiUrl}/api/pay/create`,
      new URLSearchParams(requestParams as Record<string, string>).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      }
    );

    const respData = response.data;

    if (!respData || typeof respData !== 'object') {
      res.status(502).json({ error: '支付平台响应异常' });
      return;
    }

    if (respData.code !== 0) {
      res.status(400).json({ error: respData.msg || '创建支付订单失败', detail: respData });
      return;
    }

    // 校验平台返回签名
    if (respData.sign) {
      const valid = rsaVerify({ ...respData }, respData.sign, cfg.publicKey);
      if (!valid) {
        console.error('[subscription/create] 平台返回签名校验失败');
      }
    }

    res.json({
      out_trade_no: outTradeNo,
      trade_no: respData.trade_no,
      pay_type: respData.pay_type,
      pay_info: respData.pay_info,
      timestamp: respData.timestamp,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: '创建支付订单失败' });
  }
});

// -------------------------------------------
// GET /api/subscription/notify  — 支付异步回调通知（无需登录）
// -------------------------------------------
router.get('/notify', async (req, res) => {
  await handleNotify(req, res);
});

router.post('/notify', async (req, res) => {
  await handleNotify(req, res);
});

async function handleNotify(req: AuthRequest, res: Response) {
  try {
    const cfg = getConfig();
    if (!cfg.publicKey) {
      res.status(500).send('配置错误');
      return;
    }

    // 合并 query 和 body 参数
    const params: Record<string, unknown> = {};
    const merge = (src: Record<string, unknown>) => {
      Object.keys(src).forEach((k) => {
        const v = src[k];
        params[k] = Array.isArray(v) ? v[0] : v;
      });
    };
    merge(req.query as Record<string, unknown>);
    merge(req.body as Record<string, unknown>);

    const sign = params.sign as string | undefined;
    if (!sign) {
      res.status(400).send('missing sign');
      return;
    }

    const isValid = rsaVerify(params, sign, cfg.publicKey);
    if (!isValid) {
      console.error('[subscription/notify] 签名校验失败', params);
      res.status(400).send('invalid sign');
      return;
    }

    const tradeStatus = params.trade_status as string;
    const outTradeNo = params.out_trade_no as string | undefined;
    const tradeNo = params.trade_no as string | undefined;

    if (!outTradeNo) {
      res.status(400).send('missing out_trade_no');
      return;
    }

    const order = await prisma.subscription.findUnique({ where: { orderNo: outTradeNo } });
    if (!order) {
      console.error('[subscription/notify] 订单不存在:', outTradeNo);
      res.status(404).send('order not found');
      return;
    }

    // 幂等：只有首次成功才开通 VIP
    if (order.status !== 'paid' && tradeStatus === 'TRADE_SUCCESS') {
      // 计算新的 VIP 过期时间
      const newExpireAt = addVipMonth(order.expiredAt);

      // 更新订单状态
      await prisma.subscription.update({
        where: { orderNo: outTradeNo },
        data: {
          status: 'paid',
          tradeNo: tradeNo || null,
          expiredAt: newExpireAt,
        },
      });

      // 更新用户 VIP 状态
      await prisma.user.update({
        where: { id: order.userId },
        data: {
          isVip: true,
          vipExpireAt: newExpireAt,
        },
      });

      console.log(`[subscription] VIP 开通成功 userId=${order.userId} outTradeNo=${outTradeNo} expireAt=${newExpireAt.toISOString()}`);
    }

    res.send('success');
  } catch (err) {
    console.error('[subscription/notify] 错误:', err);
    res.status(500).send('error');
  }
}

// -------------------------------------------
// GET /api/subscription/return  — 支付同步跳转回调（无需登录，前端重定向）
// -------------------------------------------
router.get('/return', async (req, res) => {
  // 回调参数在 query 中，前端根据参数决定显示成功还是失败页面
  // 这里直接重定向到前端页面
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  res.redirect(`${base}/subscription/result?${query}`);
});

// -------------------------------------------
// DELETE /api/subscription/cancel  — 取消 VIP 自动续费（仅标记，不再自动扣款）
// 注：本系统无自动续费，DELETE 实际为退款/关闭当前VIP（可选）
// 这里仅提供查询，用户可在支付平台侧取消
// -------------------------------------------
router.delete('/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // 取消 VIP 立即失效（谨慎操作）
    await prisma.user.update({
      where: { id: req.userId },
      data: { isVip: false, vipExpireAt: new Date() },
    });
    res.json({ message: 'VIP 已取消' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 兼容 getConfig 命名
function getConfig() {
  return getPayConfig();
}

export default router;
