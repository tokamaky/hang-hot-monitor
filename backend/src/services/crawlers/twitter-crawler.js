import fetch from 'node-fetch';
import { logger } from '../../utils/logger.js';
import { randomDelay, cleanText } from '../../utils/helpers.js';
import { config } from '../../config/env.js';

/**
 * Twitter(X) API 爬虫
 * 使用 twitterapi.io 或官方 API v2
 */
export async function searchTwitter(keyword) {
  if (!config.twitterApiKey) {
    logger.warn('⚠️  Twitter API key not configured, skipping Twitter search');
    return [];
  }

  logger.info(`🐦 Twitter search started for keyword: "${keyword}"`);

  const results = [];

  try {
    // 使用 twitterapi.io 的搜索 API
    // 文档: https://twitterapi.io/
    const url = new URL('https://api.twitterapi.io/v1/tweets/search');
    url.searchParams.append('query', keyword);
    url.searchParams.append('lang', 'en,zh');
    url.searchParams.append('max_results', '20');
    url.searchParams.append('sort_order', 'recency');

    await randomDelay(2000, 5000);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${config.twitterApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      logger.warn(`Twitter API returned status ${response.status}`);
      // 如果 API 故障，返回空结果，不中断流程
      return results;
    }

    const data = await response.json();

    // 处理返回结果
    if (data.tweets && Array.isArray(data.tweets)) {
      data.tweets.forEach((tweet) => {
        results.push({
          title: tweet.author_name || 'Tweet',
          content: cleanText(tweet.text),
          url: `https://twitter.com/${tweet.author_username}/status/${tweet.id}`,
          source: 'twitter',
          rawData: tweet,
          engagement: {
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
          },
        });
      });

      logger.success(`Found ${results.length} tweets for: "${keyword}"`);
    }
  } catch (error) {
    logger.error('Twitter search error:', error.message);
    // 不中断，允许其他数据源继续
  }

  return results;
}

/**
 * 获取 Twitter 热搜话题
 */
export async function getTwitterTrends() {
  if (!config.twitterApiKey) {
    logger.warn('⚠️  Twitter API key not configured');
    return [];
  }

  logger.info('🔥 Fetching Twitter trends...');

  try {
    // 这里需要根据实际的 API 调整
    // Twitter API v2 需要付费 Elevated access 才能获取 trends
    // 可以改为使用替代方案：定期搜索热门关键词

    logger.warn('Twitter trends API requires Premium access');
    return [];
  } catch (error) {
    logger.error('Error fetching Twitter trends:', error.message);
    return [];
  }
}

export default {
  searchTwitter,
  getTwitterTrends,
};
