// Function to fetch and display tokens
async function fetchTokens() {
    try {
        const response = await fetch('/api/tokens');
        const tokens = await response.json();
        displayTokens(tokens);
    } catch (error) {
        console.error('Error fetching tokens:', error);
    }
}

// Function to display tokens in the UI
function displayTokens(tokens) {
    const tokensList = document.getElementById('tokensList');
    tokensList.innerHTML = '';

    tokens.forEach(token => {
        const tokenCard = document.createElement('div');
        tokenCard.className = 'token-card';
        
        tokenCard.innerHTML = `
            <div class="token-info">
                <div class="token-status">
                    <div class="status-indicator ${token.valid ? 'status-valid' : 'status-invalid'}"></div>
                    <span>${token.valid ? 'Valid' : 'Invalid'}</span>
                </div>
                ${token.username ? `<div class="token-username">${token.username}</div>` : ''}
                <div class="token-value">${token.token}</div>
            </div>
            <button class="delete-btn" onclick="deleteToken('${token.token}')">Delete</button>
        `;
        
        // Add click event to navigate to user details
        if (token.valid) {
            tokenCard.addEventListener('click', (e) => {
                // Don't navigate if delete button was clicked
                if (!e.target.classList.contains('delete-btn')) {
                    window.location.href = `/user/${encodeURIComponent(token.token)}`;
                }
            });
        }
        
        tokensList.appendChild(tokenCard);
    });
}

// Function to add a new token
async function addToken() {
    const tokenInput = document.getElementById('newToken');
    const token = tokenInput.value.trim();

    if (!token) {
        alert('Please enter a token');
        return;
    }

    try {
        const response = await fetch('/api/tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        if (response.ok) {
            tokenInput.value = '';
            fetchTokens();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to add token');
        }
    } catch (error) {
        console.error('Error adding token:', error);
        alert('Failed to add token');
    }
}

// Function to delete a token
async function deleteToken(token) {
    if (!confirm('Are you sure you want to delete this token?')) {
        return;
    }

    try {
        const response = await fetch('/api/tokens', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        if (response.ok) {
            fetchTokens();
        } else {
            alert('Failed to delete token');
        }
    } catch (error) {
        console.error('Error deleting token:', error);
        alert('Failed to delete token');
    }
}

// Function to refresh tokens
function refreshTokens() {
    fetchTokens();
}

// Initial load of tokens
document.addEventListener('DOMContentLoaded', fetchTokens); 