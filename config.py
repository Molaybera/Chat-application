import secrets

class Config:
    SECRET_KEY = secrets.token_hex(32)
    DATABASE_NAME = 'chat.db'
    DEBUG = True
    HOST = '127.0.0.1'
    PORT = 5000