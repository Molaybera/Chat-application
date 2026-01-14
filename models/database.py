import sqlite3
from config import Config

def get_db():
    """Get database connection with row factory"""
    conn = sqlite3.connect(Config.DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables"""
    conn = sqlite3.connect(Config.DATABASE_NAME)
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password_hash TEXT NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Messages table with read status
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  sender_id INTEGER NOT NULL,
                  receiver_id INTEGER NOT NULL,
                  encrypted_content TEXT NOT NULL,
                  is_read INTEGER DEFAULT 0,
                  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (sender_id) REFERENCES users(id),
                  FOREIGN KEY (receiver_id) REFERENCES users(id))''')
    
    # Add is_read column if it doesn't exist (for existing databases)
    try:
        c.execute('ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0')
    except:
        pass  # Column already exists
    
    conn.commit()
    conn.close()
    print("✓ Database initialized successfully")