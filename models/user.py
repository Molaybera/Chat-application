import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from models.database import get_db

class User:
    @staticmethod
    def create(username, password):
        """Create a new user"""
        try:
            conn = get_db()
            c = conn.cursor()
            password_hash = generate_password_hash(password)
            c.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', 
                      (username, password_hash))
            conn.commit()
            user_id = c.lastrowid
            conn.close()
            return {'success': True, 'message': 'Registration successful!', 'user_id': user_id}
        except sqlite3.IntegrityError:
            return {'success': False, 'message': 'Username already exists'}
    
    @staticmethod
    def authenticate(username, password):
        """Authenticate user credentials"""
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = c.fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            return {
                'success': True,
                'user': {'id': user['id'], 'username': user['username']}
            }
        return {'success': False, 'message': 'Invalid credentials'}
    
    @staticmethod
    def get_all():
        """Get all users"""
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT id, username, created_at FROM users')
        users = [dict(row) for row in c.fetchall()]
        conn.close()
        return users
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT id, username FROM users WHERE id = ?', (user_id,))
        user = c.fetchone()
        conn.close()
        return dict(user) if user else None