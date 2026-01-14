let currentUser = null;
let selectedUserId = null;
let selectedUsername = null;

// Load users on page load
window.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    
    // Auto-resize textarea
    const textarea = document.getElementById('messageInput');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
});

async function loadUsers() {
    try {
        const [usersResponse, unreadResponse] = await Promise.all([
            fetch('/users'),
            fetch('/unread_counts')
        ]);
        
        const usersData = await usersResponse.json();
        const unreadData = await unreadResponse.json();
        
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        
        if (usersData.users.length === 0) {
            userList.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No other users yet</p>';
            return;
        }
        
        usersData.users.forEach(user => {
            const unreadCount = unreadData.counts[user.id] || 0;
            
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div class="user-item-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div class="user-item-info">
                    <div class="user-item-name">${user.username}</div>
                </div>
                ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
            `;
            userItem.onclick = () => selectUser(user.id, user.username);
            
            if (selectedUserId === user.id) {
                userItem.classList.add('active');
            }
            
            userList.appendChild(userItem);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function selectUser(userId, username) {
    selectedUserId = userId;
    selectedUsername = username;
    
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('chatContent').classList.remove('hidden');
    
    document.getElementById('chatWith').textContent = username;
    document.getElementById('chatAvatar').textContent = username.charAt(0).toUpperCase();
    
    // Update active state - FIX: Check if event exists
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // FIX: Find the clicked user item properly
    const userItems = document.querySelectorAll('.user-item');
    userItems.forEach(item => {
        if (item.querySelector('.user-item-name').textContent === username) {
            item.classList.add('active');
        }
    });
    
    loadMessages();
}

async function loadMessages() {
    if (!selectedUserId) return;
    
    try {
        const response = await fetch(`/messages/${selectedUserId}`);
        const data = await response.json();
        
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        
        if (data.messages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #9ca3af; padding: 40px;">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }
        
        data.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = msg.is_sent ? 'message message-sent' : 'message message-received';
            
            const timestamp = new Date(msg.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span>${msg.sender}</span>
                    <span>${timestamp}</span>
                </div>
                <div class="message-content">${escapeHtml(msg.content)}</div>
            `;
            
            container.appendChild(messageDiv);
        });
        
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || !selectedUserId) return;
    
    try {
        const response = await fetch('/send_message', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                receiver_id: selectedUserId,
                content: content
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            input.style.height = 'auto';
            loadMessages();
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

async function logout() {
    try {
        await fetch('/logout', {method: 'POST'});
        window.location.href = '/login';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function confirmDeleteAccount() {
    const confirmed = confirm(
        '⚠️ WARNING: This will permanently delete your account and all your messages!\n\n' +
        'This action CANNOT be undone.\n\n' +
        'Are you absolutely sure you want to delete your account?'
    );
    
    if (confirmed) {
        // Double confirmation
        const doubleConfirmed = confirm(
            '🚨 FINAL CONFIRMATION\n\n' +
            'Click OK to permanently delete your account, or Cancel to go back.'
        );
        
        if (doubleConfirmed) {
            await deleteAccount();
        }
    }
}

function confirmDeleteAccount() {
    // Show custom modal instead of browser confirm
    document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
}

async function proceedDelete() {
    // Close modal
    closeDeleteModal();
    
    // Show loading toast
    showToast('Deleting account...', 'info');
    
    try {
        const response = await fetch('/delete_account', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Account deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = '/register';
            }, 1500);
        } else {
            showToast('❌ Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showToast('❌ An error occurred', 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = 'toast ' + type;
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Auto-refresh messages and users every 3 seconds
setInterval(() => {
    if (selectedUserId) {
        loadMessages();
    }
    loadUsers();
}, 3000);