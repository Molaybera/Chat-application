async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('message');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Creating account...</span>';
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Account created successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Create Account</span>';
        }
    } catch (error) {
        showMessage('An error occurred. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span>';
    }
}

function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = msg;
    messageDiv.className = 'message ' + type + ' show';
}