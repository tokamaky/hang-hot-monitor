import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { logger } from '../../utils/logger.js';
import { randomDelay, generateHash, cleanText } from '../../utils/helpers.js';

/**
 * 网页爬虫：搜索关键词并抓取结果
 */
export async function searchWeb(keyword) {
  logger.info(`🔍 Web search started for keyword: "${keyword}"`);
  
  const results = [];
  
  try {
    // 使用 DuckDuckGo 作为搜索源（不需要 API Key）
    const searchQuery = encodeURIComponent(`${keyword} latest news`);
    const url = `https://html.duckduckgo.com/?q=${searchQuery}`;

    // 随机延迟，避免被检测为爬虫
    await randomDelay(2000, 5000);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      logger.warn(`Search failed with status ${response.status}`);
      return results;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 提取搜索结果
    $('.result').each((index, element) => {
      if (index >= 10) return; // 只获取前10个结果

      const title = $(element).find('.result__title').text().trim();
      const url = $(element).find('.result__url').attr('href');
      const snippet = $(element).find('.result__snippet').text().trim();

      if (title && snippet) {
        results.push({
          title,
          url: url || null,
          snippet: cleanText(snippet),
          source: 'web',
        });
      }
    });

    logger.success(`Found ${results.length} web results for: "${keyword}"`);
  } catch (error) {
    logger.error('Web search error:', error.message);
  }

  return results;
}

/**
 * 爬取单个 URL 的内容
 */
export async function scrapeUrl(url) {
  try {
    logger.info(`📄 Scraping URL: ${url}`);

    await randomDelay(1000, 3000);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      logger.warn(`Failed to scrape ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 提取主要内容
    const content = cleanText(
      $('article').text() ||
      $('main').text() ||
      $('body').text()
    );

    const title = $('h1').first().text().trim() || $('title').text().trim();

    return {
      title,
      content,
      url,
    };
  } catch (error) {
    logger.error(`Scrape error for ${url}:`, error.message);
    return null;
  }
}

export default {
  searchWeb,
  scrapeUrl,
};
