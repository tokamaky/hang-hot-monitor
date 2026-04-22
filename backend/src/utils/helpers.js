import crypto from 'crypto';

/**
 * 生成内容的哈希值用于去重
 */
export function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * 清理文本（去除多余空格、换行等）
 */
export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

/**
 * 延迟执行（毫秒）
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 随机延迟（用于爬虫频率控制）
 */
export function randomDelay(minMs = 1000, maxMs = 5000) {
  const ms = Math.random() * (maxMs - minMs) + minMs;
  return delay(ms);
}

/**
 * 验证 URL 格式
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 提取 URL 的域名
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

export default {
  generateHash,
  cleanText,
  delay,
  randomDelay,
  isValidUrl,
  extractDomain,
};
