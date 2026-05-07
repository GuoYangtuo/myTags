import api from './client';

export interface SubscriptionStatus {
  isVip: boolean;
  isVipForever: boolean;
  vipExpireAt: string | null;
  price: string;
}

export interface CreateOrderResult {
  out_trade_no: string;
  trade_no: string;
  pay_type: string;
  pay_info: string;
  timestamp: string;
}

export const subscriptionApi = {
  getStatus: () =>
    api.get<SubscriptionStatus>('/subscription/status').then((r) => r.data),

  createOrder: (payType: 'alipay' | 'wxpay', device: 'pc' | 'h5' = 'pc') =>
    api
      .post<CreateOrderResult>('/subscription/create', { payType, device })
      .then((r) => r.data),

  cancel: () =>
    api.delete('/subscription/cancel').then((r) => r.data),
};
