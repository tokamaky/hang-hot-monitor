-- Keywords Table
CREATE TABLE IF NOT EXISTS keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

-- Hotspots Table
CREATE TABLE IF NOT EXISTS hotspots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  content TEXT,
  raw_data TEXT,
  ai_score REAL,
  is_real BOOLEAN,
  relevance_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  hash TEXT UNIQUE NOT NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword_id INTEGER NOT NULL,
  hotspot_id INTEGER NOT NULL,
  status TEXT DEFAULT 'unread',
  email_sent BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (keyword_id) REFERENCES keywords(id),
  FOREIGN KEY (hotspot_id) REFERENCES hotspots(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hotspots_created_at ON hotspots(created_at);
CREATE INDEX IF NOT EXISTS idx_hotspots_hash ON hotspots(hash);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
