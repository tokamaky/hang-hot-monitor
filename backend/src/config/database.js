import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function initDatabase() {
  const dbPath = process.env.DB_PATH || './database/hotspots.db';
  
  // 创建目录如果不存在
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // 读取初始化 SQL 脚本
  const initSqlPath = path.join(__dirname, '../../database/init.sql');
  const initSql = fs.readFileSync(initSqlPath, 'utf8');
  
  // 执行初始化脚本
  const statements = initSql.split(';').filter(stmt => stmt.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      await db.exec(stmt);
    }
  }

  console.log('✅ Database initialized successfully');
  return db;
}

export async function getDatabase() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

// 当直接运行此文件时，初始化数据库
if (import.meta.url === `file://${process.argv[1]}`) {
  await initDatabase();
  console.log('Database setup complete!');
  process.exit(0);
}
