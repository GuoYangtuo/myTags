import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui';
import { Check, X, Loader2, Crown } from 'lucide-react';

export default function SubscriptionResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [verifying, setVerifying] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    // Re-fetch user to update VIP status
    const verify = async () => {
      await checkAuth();
      setVerifying(false);
      // If we have out_trade_no in params, assume success
      const tradeStatus = searchParams.get('trade_status');
      const outTradeNo = searchParams.get('out_trade_no');
      setPaid(!!outTradeNo || tradeStatus === 'TRADE_SUCCESS');
    };
    verify();
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-bg-card rounded-2xl border-2 border-border-strong shadow-[6px_6px_0_var(--color-border-strong)] p-6 text-center">
        {verifying ? (
          <>
            <Loader2 size={48} className="animate-spin text-accent-primary mx-auto mb-4" />
            <h2 className="text-lg font-bold font-heading">验证支付结果中...</h2>
          </>
        ) : paid ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold font-heading mb-1">支付成功！</h2>
            <p className="text-sm text-text-secondary mb-2">恭喜您成为 VIP 会员</p>
            <div className="flex items-center justify-center gap-1 mb-4 text-amber-600">
              <Crown size={16} />
              <span className="text-sm font-medium">VIP 会员已开通</span>
            </div>
            <p className="text-xs text-text-secondary/60 mb-5">
              您的 VIP 权益已生效，可随时享受专属功能
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/')}
              className="w-full"
            >
              返回首页
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold font-heading mb-1">支付结果未知</h2>
            <p className="text-sm text-text-secondary mb-5">
              如果已完成支付，请稍后刷新查看会员状态
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                返回首页
              </Button>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                刷新页面
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
