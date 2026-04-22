import { searchWeb, scrapeUrl } from './web-crawler.js';
import { searchTwitter } from './twitter-crawler.js';
import { logger } from '../../utils/logger.js';
import { generateHash } from '../../utils/helpers.js';
import * as hotspotModel from '../../models/hotspot.js';

/**
 * 协调多个爬虫，获取并处理热点数据
 */
export async function fetchHotspotsForKeyword(keyword) {
  logger.info(`🎯 Fetching hotspots for keyword: "${keyword}"`);

  const allResults = [];
  const errors = [];

  try {
    // 并行执行多个爬虫
    const [webResults, twitterResults] = await Promise.allSettled([
      searchWeb(keyword),
      searchTwitter(keyword),
    ]).then((results) => [
      results[0].status === 'fulfilled' ? results[0].value : [],
      results[1].status === 'fulfilled' ? results[1].value : [],
    ]);

    // 合并结果
    allResults.push(...webResults, ...twitterResults);

    logger.success(
      `Total results collected: ${allResults.length} (Web: ${webResults.length}, Twitter: ${twitterResults.length})`
    );
  } catch (error) {
    logger.error('Error fetching hotspots:', error.message);
    errors.push(error.message);
  }

  // 处理结果：去重、存储
  const newHotspots = [];

  for (const result of allResults) {
    const hash = generateHash(
      `${result.title}|${result.source}|${result.url || ''}`
    );

    // 检查是否已存在
    const existing = await hotspotModel.getHotspotByHash(hash);
    if (existing) {
      logger.debug('Hotspot already exists (duplicate):', hash);
      continue;
    }

    try {
      await hotspotModel.addHotspot({
        title: result.title,
        source: result.source,
        url: result.url,
        content: result.snippet || result.content || null,
        rawData: result.rawData || result,
        hash,
        aiScore: null, // 将由 AI 识别模块后续设置
        isReal: null,
        relevanceScore: null,
      });

      newHotspots.push({
        ...result,
        hash,
      });
    } catch (error) {
      if (!error.message.includes('UNIQUE')) {
        logger.error('Error storing hotspot:', error.message);
      }
    }
  }

  logger.success(
    `Stored ${newHotspots.length} new hotspots for keyword: "${keyword}"`
  );

  return {
    keyword,
    totalCollected: allResults.length,
    newHotspots: newHotspots.length,
    results: newHotspots,
  };
}

/**
 * 批量获取多个关键词的热点
 */
export async function fetchHotspotsForAllKeywords(keywords) {
  logger.info(`🚀 Batch fetching hotspots for ${keywords.length} keywords`);

  const results = [];

  for (const keyword of keywords) {
    try {
      const result = await fetchHotspotsForKeyword(keyword.keyword);
      results.push(result);

      // 控制频率，避免太快请求
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      logger.error(`Error fetching hotspots for "${keyword.keyword}":`, error.message);
    }
  }

  logger.success(`✅ Batch fetch completed. Processed ${results.length} keywords`);

  return results;
}

export default {
  fetchHotspotsForKeyword,
  fetchHotspotsForAllKeywords,
};
