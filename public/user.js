// Get token from URL and decode it
const token = decodeURIComponent(window.location.pathname.split('/user/')[1]);

// Set visit servers button URL
document.getElementById('visitServersBtn').href = `/user/${encodeURIComponent(token)}/servers`;

// Function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
}

// Function to update status indicator
function updateStatusIndicator(status) {
    const indicator = document.getElementById('statusIndicator');
    indicator.className = 'status-indicator';
    
    switch(status) {
        case 'online':
            indicator.classList.add('status-valid');
            break;
        case 'idle':
            indicator.classList.add('status-idle');
            break;
        case 'dnd':
            indicator.classList.add('status-dnd');
            break;
        default:
            indicator.classList.add('status-invalid');
    }
}

// Function to fetch and display user details
async function fetchUserDetails() {
    try {
        const response = await fetch(`/api/user/${encodeURIComponent(token)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user details');
        }

        const userData = await response.json();
        
        // Update user information
        document.getElementById('username').textContent = `${userData.username}#${userData.discriminator}`;
        document.getElementById('email').textContent = userData.email || 'No email available';
        document.getElementById('phone').textContent = userData.phone || 'No phone number available';
        document.getElementById('userAvatar').src = userData.avatarUrl;
        document.getElementById('status').textContent = userData.presence?.status || 'offline';
        document.getElementById('activity').textContent = userData.presence?.custom_status || 'No activity';
        document.getElementById('about').textContent = userData.bio || 'No bio available';
        document.getElementById('userId').textContent = userData.id;
        document.getElementById('createdAt').textContent = formatDate(userData.created_at);
        document.getElementById('verified').textContent = userData.verified ? 'Yes' : 'No';
        document.getElementById('serverCount').textContent = userData.guilds?.length || 0;

        // Update status indicator
        updateStatusIndicator(userData.presence?.status || 'offline');
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('.user-container').innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>Failed to load user details. Please try again later.</p>
            </div>
        `;
    }
}

// Load user details when page loads
document.addEventListener('DOMContentLoaded', fetchUserDetails); 