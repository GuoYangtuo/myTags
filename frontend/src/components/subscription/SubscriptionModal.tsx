import React, { useEffect, useState } from 'react';
import { Modal } from '../ui';
import { useAuthStore } from '../../stores/authStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { subscriptionApi } from '../../api/subscription';
import { Loader2, Check, Crown, Star, Zap, Heart, Infinity } from 'lucide-react';

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
}

const BENEFITS = [
  {
    icon: Star,
    title: '专属身份标识',
    desc: '头像佩戴 VIP 金色皇冠，彰显尊享身份',
  },
  {
    icon: Heart,
    title: '专属皮肤主题',
    desc: '解锁 myTags 专属 VIP 配色主题',
  },
  {
    icon: Zap,
    title: '优先体验新功能',
    desc: '率先体验最新推出的高级功能',
  },
  {
    icon: Crown,
    title: '专属客服支持',
    desc: '优先回复，问题解决更快速',
  },
];

export function SubscriptionModal({ open, onClose }: SubscriptionModalProps) {
  const { user } = useAuthStore();
  const { status, loading, fetchStatus } = useSubscriptionStore();
  const [payType, setPayType] = useState<'alipay' | 'wxpay'>('alipay');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchStatus();
    }
  }, [open]);

  const handleOpenMembership = async () => {
    if (!user) return;
    setPaying(true);
    setError(null);

    // Detect device
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    const device = isWechat ? 'h5' : 'pc';

    try {
      const result = await subscriptionApi.createOrder(payType, device);

      // result.pay_info contains the payment URL or HTML to redirect
      if (result.pay_info) {
        if (result.pay_type === 'alipay' || device === 'h5') {
          // Open payment page in new tab or redirect
          window.open(result.pay_info, '_blank');
        } else {
          // WeChat QR code or redirect
          window.open(result.pay_info, '_blank');
        }
      } else if (result.trade_no) {
        // Redirect URL returned differently
        window.location.href = result.pay_info || result.trade_no;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '发起支付失败，请稍后重试';
      setError(msg);
    } finally {
      setPaying(false);
    }
  };

  const isVip = status?.isVip ?? user?.isVip ?? false;
  const vipExpireAt = status?.vipExpireAt ?? user?.vipExpireAt;
  const price = status?.price ?? '6.90';

  const formatExpireDate = (iso: string | null | undefined) => {
    if (!iso) return '永久';
    const d = new Date(iso);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <Modal open={open} onClose={onClose} title="" size="md">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center mb-3 shadow-lg">
          <Crown size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold font-heading">订阅 MyTags 专业版</h2>
        {isVip ? (
          <div className="mt-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-600 text-sm font-medium">
            您已是 VIP 会员
            {vipExpireAt && (
              <span className="ml-1 text-green-500 text-xs">
                · {formatExpireDate(vipExpireAt)} 到期
              </span>
            )}
          </div>
        ) : (
          <div className="mt-1 text-sm text-text-secondary">
            无限次访问本产品全部功能，仅需 <span className="text-accent-primary font-bold text-base">¥{price}</span> /月
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 border-border-light bg-bg-secondary"
          >
            <b.icon size={18} className="text-accent-primary flex-shrink-0" />
            <span className="font-bold text-sm leading-tight">{b.title}</span>
            <span className="text-xs text-text-secondary leading-tight">{b.desc}</span>
          </div>
        ))}
      </div>

      {/* VIP benefits checklist for already VIP users */}
      {isVip && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
          <p className="text-sm font-medium text-amber-700 mb-2">您已享有的 VIP 权益</p>
          <ul className="space-y-1">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex items-center gap-2 text-xs text-amber-700">
                <Check size={13} className="text-amber-500 flex-shrink-0" />
                {b.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Payment type selector */}
      {!isVip && (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium text-text-secondary mb-2">选择支付方式</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPayType('alipay')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  payType === 'alipay'
                    ? 'border-accent-primary bg-orange-50 text-accent-primary'
                    : 'border-border-strong bg-bg-card text-text-secondary hover:border-accent-primary/40'
                }`}
              >
                <AlipayIcon />
                <span className="font-medium text-sm">支付宝</span>
              </button>
              <button
                onClick={() => setPayType('wxpay')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  payType === 'wxpay'
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : 'border-border-strong bg-bg-card text-text-secondary hover:border-green-400'
                }`}
              >
                <WechatIcon />
                <span className="font-medium text-sm">微信支付</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Open button */}
          <button
            onClick={handleOpenMembership}
            disabled={paying || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-base shadow-[3px_3px_0_rgba(0,0,0,0.15)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {paying || loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                正在跳转支付页面...
              </>
            ) : (
              <>
                <Crown size={18} />
                立即开通 VIP · ¥{price}/月
              </>
            )}
          </button>

          <p className="mt-2 text-center text-xs text-text-secondary/60">
            支付成功后立即生效
          </p>
        </>
      )}

      {isVip && (
        <div className="flex items-center justify-center gap-2 text-sm text-text-secondary/60 mt-2">
          <Infinity size={14} />
          <span>会员期间权益持续有效</span>
        </div>
      )}
    </Modal>
  );
}

// Simple SVG icons for payment logos
function AlipayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#1677FF" />
      <path
        d="M24 8C15.2 8 8 14.1 8 21.5c0 4.2 2.3 7.9 5.8 10.2l-1.5 6.3h5.4l2.2-4.9c1.2.3 2.5.4 3.9.4 8.8 0 15.8-5.9 15.8-12.7C39.6 14.5 33 8 24 8z"
        fill="white"
      />
    </svg>
  );
}

function WechatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#07C160" />
      <path
        d="M10 28c0-7.7 6.3-14 14-14 1.2 0 2.4.2 3.5.4C24.3 9 19.3 5.5 14 5.5 7.4 5.5 2 11.5 2 19.3c0 5 2.6 9.3 6.5 12L6.5 39l8-3.5C12.8 32.7 11.3 30.5 10 28z"
        fill="white"
      />
      <path
        d="M36 25c0-7.2-6.3-13-14-13-1.2 0-2.4.2-3.5.4 3.2-5.4 8.2-9 13.5-9 6.6 0 12 5.5 12 13.3 0 5-2.6 9.3-6.5 12l2 7.2 8-3.5c-1.7-2.8-3.2-5-4.5-7.4z"
        fill="white"
        opacity="0.5"
      />
      <circle cx="32" cy="14" r="2.5" fill="white" />
    </svg>
  );
}
