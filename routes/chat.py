from flask import Blueprint, request, jsonify, session, render_template, redirect, url_for
from models.database import get_db
from models.user import User
from utils.encryption import encryptor

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat')
def chat():
    """Chat page"""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    return render_template('chat.html', username=session['username'])

@chat_bp.route('/users')
def get_users():
    """Get all users except the current logged-in user"""
    if 'user_id' not in session:
        return jsonify({'users': []})
    
    current_user_id = session['user_id']
    
    conn = get_db()
    c = conn.cursor()
    # Exclude the current user from the list
    c.execute('SELECT id, username, created_at FROM users WHERE id != ? ORDER BY username', (current_user_id,))
    users = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return jsonify({'users': users})

@chat_bp.route('/unread_counts')
def get_unread_counts():
    """Get unread message counts for all contacts"""
    if 'user_id' not in session:
        return jsonify({'counts': {}})
    
    user_id = session['user_id']
    
    conn = get_db()
    c = conn.cursor()
    
    # Count unread messages from each sender
    c.execute('''SELECT sender_id, COUNT(*) as unread_count
                 FROM messages
                 WHERE receiver_id = ? AND is_read = 0
                 GROUP BY sender_id''', (user_id,))
    
    counts = {}
    for row in c.fetchall():
        counts[row['sender_id']] = row['unread_count']
    
    conn.close()
    return jsonify({'counts': counts})

@chat_bp.route('/messages/<int:other_user_id>')
def get_messages(other_user_id):
    """Get messages between current user and another user"""
    if 'user_id' not in session:
        return jsonify({'messages': []})
    
    user_id = session['user_id']
    
    conn = get_db()
    c = conn.cursor()
    
    # Mark messages from this user as read
    c.execute('''UPDATE messages 
                 SET is_read = 1 
                 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0''',
              (other_user_id, user_id))
    conn.commit()
    
    c.execute('''SELECT m.*, u.username as sender
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 WHERE (m.sender_id = ? AND m.receiver_id = ?)
                    OR (m.sender_id = ? AND m.receiver_id = ?)
                 ORDER BY m.timestamp ASC''',
              (user_id, other_user_id, other_user_id, user_id))
    
    messages = []
    for row in c.fetchall():
        try:
            decrypted_content = encryptor.decrypt(row['encrypted_content'])
        except Exception as e:
            decrypted_content = "[Message could not be decrypted]"
        
        messages.append({
            'sender': row['sender'],
            'content': decrypted_content,
            'timestamp': row['timestamp'],
            'is_sent': row['sender_id'] == user_id
        })
    
    conn.close()
    return jsonify({'messages': messages})

@chat_bp.route('/send_message', methods=['POST'])
def send_message():
    """Send a message"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    data = request.json
    sender_id = session['user_id']
    receiver_id = data.get('receiver_id')
    content = data.get('content')
    
    if not content or not receiver_id:
        return jsonify({'success': False, 'message': 'Invalid message'})
    
    encrypted_content = encryptor.encrypt(content)
    
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT INTO messages (sender_id, receiver_id, encrypted_content, is_read) VALUES (?, ?, ?, 0)',
              (sender_id, receiver_id, encrypted_content))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})