import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * 使用 OpenRouter API 进行 AI 识别
 * 识别热点真实性、垃圾内容、相关性等
 */
export async function analyzeHotspotWithAI(hotspot, keyword) {
  if (!config.openrouterApiKey) {
    logger.warn('⚠️  OpenRouter API key not configured, skipping AI analysis');
    return {
      aiScore: null,
      isReal: null,
      relevanceScore: null,
    };
  }

  try {
    logger.info(`🤖 Analyzing hotspot with AI: "${hotspot.title}"`);

    const prompt = `
You are an expert news analyst. Analyze the following hotspot content and respond with JSON.

Content Title: ${hotspot.title}
Content: ${hotspot.content || hotspot.snippet || ''}
Source: ${hotspot.source}

Please evaluate:
1. "realness_score" (0-10): How likely is this real news? 0=definitely fake, 10=definitely real
2. "is_spam": true/false - Is this spam/marketing/clickbait?
3. "relevance_score" (0-10): How relevant is this to the keyword "${keyword}"?
4. "summary": Brief 1-2 sentence summary

Respond with ONLY valid JSON, no other text.
`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // or 'claude-3-haiku' etc
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.warn(`OpenRouter API error (${response.status}):`, error.substring(0, 100));
      return {
        aiScore: null,
        isReal: null,
        relevanceScore: null,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // 尝试解析 JSON 响应
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      logger.warn('Failed to parse AI response as JSON');
      return {
        aiScore: null,
        isReal: null,
        relevanceScore: null,
      };
    }

    const result = {
      aiScore: analysis.realness_score || null,
      isReal: !analysis.is_spam && (analysis.realness_score || 0) >= 5,
      relevanceScore: analysis.relevance_score || null,
      summary: analysis.summary || null,
    };

    logger.success(`AI Analysis completed:`, {
      score: result.aiScore,
      isReal: result.isReal,
      relevance: result.relevanceScore,
    });

    return result;
  } catch (error) {
    logger.error('AI analysis error:', error.message);
    return {
      aiScore: null,
      isReal: null,
      relevanceScore: null,
    };
  }
}

/**
 * 批量分析多个热点
 */
export async function analyzeHotspotsWithAI(hotspots, keyword) {
  logger.info(`🤖 Batch analyzing ${hotspots.length} hotspots with AI`);

  const analyzed = [];

  for (const hotspot of hotspots) {
    try {
      const analysis = await analyzeHotspotWithAI(hotspot, keyword);
      analyzed.push({
        ...hotspot,
        ...analysis,
      });

      // 避免 API 限流
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      logger.error(`Error analyzing hotspot "${hotspot.title}":`, error.message);
      analyzed.push({
        ...hotspot,
        aiScore: null,
        isReal: null,
        relevanceScore: null,
      });
    }
  }

  return analyzed;
}

export default {
  analyzeHotspotWithAI,
  analyzeHotspotsWithAI,
};
