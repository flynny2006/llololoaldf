// Get token from URL
const token = decodeURIComponent(window.location.pathname.split('/user/')[1].split('/servers')[0]);

// Set back button URL
document.getElementById('backBtn').href = `/user/${encodeURIComponent(token)}`;

// Function to format server icon URL
function getServerIconUrl(guild) {
    if (!guild.icon) return 'https://cdn.discordapp.com/embed/avatars/0.png';
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
}

// Function to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

// Function to create and copy invite
async function createAndCopyInvite(guildId) {
    try {
        const response = await fetch(`/api/user/${encodeURIComponent(token)}/create-invite/${guildId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            copyToClipboard(data.invite);
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to create invite');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to create invite');
    }
}

// Function to display servers
function displayServers(servers) {
    const serversGrid = document.getElementById('serversGrid');
    serversGrid.innerHTML = '';

    if (!servers || servers.length === 0) {
        serversGrid.innerHTML = `
            <div class="no-servers">
                <p>You are not in any servers.</p>
            </div>
        `;
        return;
    }

    servers.forEach(guild => {
        const serverCard = document.createElement('div');
        serverCard.className = 'server-card';
        serverCard.onclick = (e) => {
            // Don't navigate if clicking on action buttons
            if (e.target.closest('.server-actions')) {
                return;
            }
            window.location.href = `/user/${encodeURIComponent(token)}/servers/${guild.id}`;
        };
        
        serverCard.innerHTML = `
            <div class="server-icon">
                <img src="${getServerIconUrl(guild)}" alt="${guild.name}">
            </div>
            <div class="server-info">
                <h3>${guild.name}</h3>
                <p class="server-id">ID: ${guild.id}</p>
                <p class="server-owner">${guild.owner ? '👑 Owner' : 'Member'}</p>
            </div>
            <div class="server-actions">
                <button class="action-btn copy-id-btn" onclick="copyToClipboard('${guild.id}')" title="Copy Guild ID">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="action-btn copy-invite-btn" onclick="createAndCopyInvite('${guild.id}')" title="Copy Invite Link">
                    <i class="fas fa-link"></i>
                </button>
                <button class="action-btn leave-server-btn" onclick="leaveServer('${guild.id}')" title="Leave Server">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
        
        serversGrid.appendChild(serverCard);
    });
}

// Function to search servers
function searchServers(query) {
    const servers = window.serversData || [];
    
    const filteredServers = servers.filter(guild => 
        guild.name.toLowerCase().includes(query.toLowerCase())
    );
    
    displayServers(filteredServers);
}

// Function to leave server
async function leaveServer(guildId) {
    if (!confirm('Are you sure you want to leave this server?')) {
        return;
    }

    try {
        const response = await fetch(`/api/user/${encodeURIComponent(token)}/leave-server`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ guildId })
        });

        if (response.ok) {
            // Remove server from display
            window.serversData = window.serversData.filter(guild => guild.id !== guildId);
            displayServers(window.serversData);
        } else {
            alert('Failed to leave server');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to leave server');
    }
}

// Function to fetch servers
async function fetchServers() {
    try {
        const response = await fetch(`/api/user/${encodeURIComponent(token)}/servers`);
        if (!response.ok) {
            throw new Error('Failed to fetch servers');
        }

        const servers = await response.json();
        window.serversData = servers;
        displayServers(servers);
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('.servers-container').innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>Failed to load servers. Please try again later.</p>
            </div>
        `;
    }
}

// Create server directly when clicking the create server button
document.getElementById('createServerBtn').addEventListener('click', async () => {
    const createServerBtn = document.getElementById('createServerBtn');
    createServerBtn.disabled = true;
    createServerBtn.textContent = 'Creating...';
    
    try {
        const response = await fetch(`/api/user/${encodeURIComponent(token)}/create-server`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            await fetchServers();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to create server');
        }
    } catch (error) {
        alert('Failed to create server');
    } finally {
        createServerBtn.disabled = false;
        createServerBtn.textContent = 'Create Server';
    }
});

// Add search functionality
document.getElementById('serverSearch').addEventListener('input', (e) => {
    searchServers(e.target.value);
});

// Load servers when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Set back button URL again to ensure it's set
    document.getElementById('backBtn').href = `/user/${encodeURIComponent(token)}`;
    // Fetch servers
    fetchServers();
}); 