import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

export async function addHotspot(hotspotData) {
  const db = await getDatabase();
  const {
    title,
    source,
    url,
    content,
    rawData,
    hash,
    aiScore,
    isReal,
    relevanceScore,
  } = hotspotData;

  try {
    const result = await db.run(
      `INSERT INTO hotspots 
       (title, source, url, content, raw_data, hash, ai_score, is_real, relevance_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        source,
        url || null,
        content || null,
        JSON.stringify(rawData || {}),
        hash,
        aiScore || null,
        isReal !== undefined ? (isReal ? 1 : 0) : null,
        relevanceScore || null,
      ]
    );
    logger.success('Hotspot added:', title);
    return result;
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      logger.warn('Hotspot already exists (duplicate):', hash);
    } else {
      logger.error('Error adding hotspot:', error.message);
    }
    throw error;
  }
}

export async function getHotspots(limit = 50, offset = 0) {
  const db = await getDatabase();
  try {
    const hotspots = await db.all(
      `SELECT * FROM hotspots 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return hotspots || [];
  } catch (error) {
    logger.error('Error fetching hotspots:', error.message);
    return [];
  }
}

export async function getHotspotsByKeyword(keyword, limit = 50) {
  const db = await getDatabase();
  try {
    const hotspots = await db.all(
      `SELECT * FROM hotspots 
       WHERE title LIKE ? OR content LIKE ?
       ORDER BY created_at DESC 
       LIMIT ?`,
      [`%${keyword}%`, `%${keyword}%`, limit]
    );
    return hotspots || [];
  } catch (error) {
    logger.error('Error fetching hotspots by keyword:', error.message);
    return [];
  }
}

export async function getHotspotByHash(hash) {
  const db = await getDatabase();
  try {
    const hotspot = await db.get(
      'SELECT * FROM hotspots WHERE hash = ?',
      [hash]
    );
    return hotspot;
  } catch (error) {
    logger.error('Error fetching hotspot by hash:', error.message);
    return null;
  }
}

export async function countHotspots() {
  const db = await getDatabase();
  try {
    const result = await db.get('SELECT COUNT(*) as count FROM hotspots');
    return result?.count || 0;
  } catch (error) {
    logger.error('Error counting hotspots:', error.message);
    return 0;
  }
}

export default {
  addHotspot,
  getHotspots,
  getHotspotsByKeyword,
  getHotspotByHash,
  countHotspots,
};
