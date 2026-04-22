import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

export async function addKeyword(keyword) {
  const db = await getDatabase();
  try {
    const result = await db.run(
      'INSERT INTO keywords (keyword) VALUES (?)',
      [keyword.trim().toLowerCase()]
    );
    logger.success('Keyword added:', keyword);
    return result;
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      logger.warn('Keyword already exists:', keyword);
    } else {
      logger.error('Error adding keyword:', error.message);
    }
    throw error;
  }
}

export async function getKeywords() {
  const db = await getDatabase();
  try {
    const keywords = await db.all(
      'SELECT * FROM keywords WHERE is_active = 1 ORDER BY created_at DESC'
    );
    return keywords || [];
  } catch (error) {
    logger.error('Error fetching keywords:', error.message);
    return [];
  }
}

export async function getKeywordById(id) {
  const db = await getDatabase();
  try {
    const keyword = await db.get('SELECT * FROM keywords WHERE id = ?', [id]);
    return keyword;
  } catch (error) {
    logger.error('Error fetching keyword:', error.message);
    return null;
  }
}

export async function deleteKeyword(id) {
  const db = await getDatabase();
  try {
    await db.run('UPDATE keywords SET is_active = 0 WHERE id = ?', [id]);
    logger.success('Keyword deactivated:', id);
  } catch (error) {
    logger.error('Error deleting keyword:', error.message);
    throw error;
  }
}

export default {
  addKeyword,
  getKeywords,
  getKeywordById,
  deleteKeyword,
};
