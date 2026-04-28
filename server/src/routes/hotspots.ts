import { Router } from 'express';
import { prisma } from '../db.js';
import { sortHotspots } from '../utils/sortHotspots.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// 所有热点路由都需要认证
router.use(authMiddleware);

// 获取所有热点（只返回当前用户关键词相关的热点）
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      source, 
      importance,
      keywordId,
      isReal,
      timeRange,
      timeFrom,
      timeTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 获取当前用户的所有关键词ID
    const userKeywords = await prisma.keyword.findMany({
      where: { userId: req.userId },
      select: { id: true }
    });
    const keywordIds = userKeywords.map(k => k.id);

    // 如果用户没有关键词，返回空列表
    if (keywordIds.length === 0) {
      return res.json({
        data: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 }
      });
    }

    const where: any = { keywordId: { in: keywordIds } };
    if (source) where.source = source;
    if (importance) where.importance = importance;
    if (keywordId) where.keywordId = keywordId;
    if (isReal !== undefined && isReal !== '') {
      where.isReal = isReal === 'true';
    }

    // 时间范围筛选
    if (timeRange) {
      const now = new Date();
      let dateFrom: Date | null = null;
      switch (timeRange) {
        case '1h':
          dateFrom = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'today':
          dateFrom = new Date(now);
          dateFrom.setHours(0, 0, 0, 0);
          break;
        case '7d':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      if (dateFrom) {
        where.createdAt = { gte: dateFrom };
      }
    } else if (timeFrom || timeTo) {
      where.createdAt = {};
      if (timeFrom) where.createdAt.gte = new Date(timeFrom as string);
      if (timeTo) where.createdAt.lte = new Date(timeTo as string);
    }

    // 排序处理
    let orderBy: any;
    const sort = sortBy as string;
    const order = (sortOrder as string) === 'asc' ? 'asc' : 'desc';

    // importance 和 hot 需要在内存中排序（Prisma 不支持自定义排序）
    const needsMemorySort = sort === 'importance' || sort === 'hot';

    switch (sort) {
      case 'publishedAt':
        orderBy = [{ publishedAt: order }, { createdAt: 'desc' }];
        break;
      case 'relevance':
        orderBy = { relevance: order };
        break;
      case 'importance':
      case 'hot':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: order };
        break;
    }

    const [rawHotspots, total] = await Promise.all([
      prisma.hotspot.findMany({
        where,
        orderBy,
        ...(needsMemorySort ? {} : { skip, take: limitNum }),
        include: {
          keyword: {
            select: { id: true, text: true, category: true }
          }
        }
      }),
      prisma.hotspot.count({ where })
    ]);

    let hotspots;
    if (needsMemorySort) {
      const sorted = sortHotspots(rawHotspots, sort, order as 'asc' | 'desc');
      hotspots = sorted.slice(skip, skip + limitNum);
    } else {
      hotspots = rawHotspots;
    }

    res.json({
      data: hotspots,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching hotspots:', error);
    res.status(500).json({ error: 'Failed to fetch hotspots' });
  }
});

// 获取热点统计（只统计当前用户关键词相关的热点）
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    // 获取当前用户的所有关键词ID
    const userKeywords = await prisma.keyword.findMany({
      where: { userId: req.userId },
      select: { id: true }
    });
    const keywordIds = userKeywords.map(k => k.id);

    // 如果用户没有关键词，返回空统计
    if (keywordIds.length === 0) {
      return res.json({
        total: 0,
        today: 0,
        urgent: 0,
        bySource: {}
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = { keywordId: { in: keywordIds } };

    const [
      totalHotspots,
      todayHotspots,
      urgentHotspots,
      sourceStats
    ] = await Promise.all([
      prisma.hotspot.count({ where }),
      prisma.hotspot.count({
        where: { ...where, createdAt: { gte: today } }
      }),
      prisma.hotspot.count({
        where: { ...where, importance: 'urgent' }
      }),
      prisma.hotspot.groupBy({
        by: ['source'],
        where,
        _count: { source: true }
      })
    ]);

    res.json({
      total: totalHotspots,
      today: todayHotspots,
      urgent: urgentHotspots,
      bySource: sourceStats.reduce((acc: Record<string, number>, item: { source: string; _count: { source: number } }) => {
        acc[item.source] = item._count.source;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 获取单个热点（只允许查看属于自己关键词的热点）
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    // 获取当前用户的所有关键词ID
    const userKeywords = await prisma.keyword.findMany({
      where: { userId: req.userId },
      select: { id: true }
    });
    const keywordIds = userKeywords.map(k => k.id);

    const hotspot = await prisma.hotspot.findFirst({
      where: {
        id: req.params.id as string,
        keywordId: { in: keywordIds }
      },
      include: {
        keyword: true
      }
    });

    if (!hotspot) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }

    res.json(hotspot);
  } catch (error) {
    console.error('Error fetching hotspot:', error);
    res.status(500).json({ error: 'Failed to fetch hotspot' });
  }
});

// 手动搜索热点
router.post('/search', async (req, res) => {
  try {
    const { query, sources = ['twitter', 'bing'] } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // 导入搜索服务
    const { searchTwitter } = await import('../services/twitter.js');
    const { searchBing } = await import('../services/search.js');
    const { analyzeContent } = await import('../services/ai.js');

    const results: any[] = [];

    // Twitter 搜索
    if (sources.includes('twitter')) {
      try {
        const tweets = await searchTwitter(query);
        results.push(...tweets);
      } catch (error) {
        console.error('Twitter search failed:', error);
      }
    }

    // Bing 搜索
    if (sources.includes('bing')) {
      try {
        const webResults = await searchBing(query);
        results.push(...webResults);
      } catch (error) {
        console.error('Bing search failed:', error);
      }
    }

    // AI 分析前几个结果
    const analyzedResults = await Promise.all(
      results.slice(0, 10).map(async (item) => {
        try {
          const analysis = await analyzeContent(item.title + ' ' + item.content, query);
          return { ...item, analysis };
        } catch {
          return { ...item, analysis: null };
        }
      })
    );

    res.json({ results: analyzedResults });
  } catch (error) {
    console.error('Error searching hotspots:', error);
    res.status(500).json({ error: 'Failed to search hotspots' });
  }
});

// 删除热点（只允许删除属于自己关键词的热点）
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // 获取当前用户的所有关键词ID
    const userKeywords = await prisma.keyword.findMany({
      where: { userId: req.userId },
      select: { id: true }
    });
    const keywordIds = userKeywords.map(k => k.id);

    // 检查热点是否属于用户的关键词
    const hotspot = await prisma.hotspot.findFirst({
      where: {
        id: req.params.id as string,
        keywordId: { in: keywordIds }
      }
    });

    if (!hotspot) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }

    await prisma.hotspot.delete({
      where: { id: req.params.id as string }
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Hotspot not found' });
    }
    console.error('Error deleting hotspot:', error);
    res.status(500).json({ error: 'Failed to delete hotspot' });
  }
});

export default router;
