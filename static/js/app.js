let currentUser = null;
let selectedUserId = null;

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const response = await fetch('/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    });
    
    const data = await response.json();
    showMessage(data.message, data.success ? 'success' : 'error');
    
    if (data.success) {
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const response = await fetch('/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    });
    
    const data = await response.json();
    
    if (data.success) {
        currentUser = data.user;
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('chatSection').classList.remove('hidden');
        document.getElementById('userInfo').textContent = 'Logged in as: ' + username;
        document.getElementById('userInfo').classList.remove('hidden');
        loadUsers();
    } else {
        showMessage(data.message, 'error');
    }
}

async function loadUsers() {
    const response = await fetch('/users');
    const data = await response.json();
    
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    
    data.users.forEach(user => {
        if (user.id !== currentUser.id) {
            const btn = document.createElement('button');
            btn.textContent = user.username;
            btn.className = 'user-btn';
            btn.onclick = () => selectUser(user.id, user.username);
            userList.appendChild(btn);
        }
    });
}

function selectUser(userId, username) {
    selectedUserId = userId;
    document.getElementById('chatWith').textContent = username;
    document.getElementById('chatArea').classList.remove('hidden');
    
    document.querySelectorAll('.user-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadMessages();
}

async function loadMessages() {
    if (!selectedUserId) return;
    
    const response = await fetch(`/messages/${selectedUserId}`);
    const data = await response.json();
    
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    data.messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message' + (msg.is_sent ? ' message-sent' : '');
        div.innerHTML = `
            <div class="message-header">
                ${msg.sender} - ${new Date(msg.timestamp).toLocaleString()}
            </div>
            <div>${msg.content}</div>
        `;
        container.appendChild(div);
    });
    
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const content = document.getElementById('messageInput').value;
    if (!content || !selectedUserId) return;
    
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
        document.getElementById('messageInput').value = '';
        loadMessages();
    }
}

function logout() {
    fetch('/logout', {method: 'POST'}).then(() => {
        location.reload();
    });
}

function showMessage(msg, type) {
    const div = document.getElementById('authMessage');
    div.textContent = msg;
    div.className = type;
}

// Auto-refresh messages every 3 seconds
setInterval(() => {
    if (selectedUserId) loadMessages();
}, 3000);