import crypto from 'crypto';

// 构造待签名字符串：按参数名 ASCII 升序，过滤空值以及 sign、sign_type 字段
export const buildSignContent = (params: Record<string, unknown>): string => {
  const filtered: Record<string, string> = {};

  Object.keys(params).forEach((key) => {
    if (key === 'sign' || key === 'sign_type') return;
    const value = params[key];
    if (value === undefined || value === null || value === '') return;
    filtered[key] = String(value);
  });

  const sortedKeys = Object.keys(filtered).sort();
  return sortedKeys
    .map((key) => `${key}=${filtered[key]}`)
    .join('&');
};

// 将换行符序列统一处理为真实换行
const normalizeLineBreaks = (content: string): string =>
  content.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

// 根据 key 内容推断类型并补全 PEM wrapper（统一转为 PKCS#8）
const wrapPem = (content: string): string => {
  const cleaned = normalizeLineBreaks(content.trim());
  if (cleaned.includes('-----BEGIN')) return cleaned;

  // 自动转换 PKCS#1 → PKCS#8（OpenSSL 3.0 不认旧格式）
  const converted = convertToPkcs8(cleaned);
  if (converted) return converted;

  // 无法识别格式
  throw new Error('未知的密钥格式，无法自动识别 PKCS#1/PRIVATE/PUBLIC 标记');
};

// 将 PKCS#1 格式转为 PKCS#8
function convertToPkcs8(base64Key: string): string | null {
  const chunked = base64Key.match(/.{1,64}/g)?.join('\n') ?? base64Key;

  if (base64Key.includes('PRIVATE')) {
    return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
  }
  if (base64Key.includes('PUBLIC')) {
    return `-----BEGIN PUBLIC KEY-----\n${chunked}\n-----END PUBLIC KEY-----`;
  }
  // 无标记：私钥更常见，默认当私钥处理
  return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
}

export const rsaSign = (params: Record<string, unknown>, rawPrivateKey: string): string => {
  const content = buildSignContent(params);
  const normalized = wrapPem(rawPrivateKey);
  console.log('[rsaSign] PEM header:', normalized.substring(0, 60));

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(content, 'utf8');
  signer.end();

  return signer.sign(normalized, 'base64');
};

export const rsaVerify = (
  params: Record<string, unknown>,
  sign: string,
  rawPublicKey: string
): boolean => {
  const content = buildSignContent(params);
  const publicKey = wrapPem(rawPublicKey);

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(content, 'utf8');
  verifier.end();

  try {
    return verifier.verify(publicKey, sign, 'base64');
  } catch {
    return false;
  }
};
