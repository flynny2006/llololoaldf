// Get token and guild ID from URL
const pathParts = window.location.pathname.split('/');
const token = decodeURIComponent(pathParts[2]);
const guildId = pathParts[4];

// Set back button URL
document.getElementById('backBtn').href = `/user/${encodeURIComponent(token)}/servers`;

// Function to format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to format verification level
function formatVerificationLevel(level) {
    const levels = {
        0: 'None',
        1: 'Low',
        2: 'Medium',
        3: 'High',
        4: 'Highest'
    };
    return levels[level] || 'Unknown';
}

// Function to format content filter level
function formatContentFilter(level) {
    const levels = {
        0: 'Disabled',
        1: 'Members without roles',
        2: 'All members'
    };
    return levels[level] || 'Unknown';
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
async function createAndCopyInvite() {
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

// Function to leave server
async function leaveServer() {
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
            window.location.href = `/user/${encodeURIComponent(token)}/servers`;
        } else {
            alert('Failed to leave server');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to leave server');
    }
}

// Function to display channels
function displayChannels(channels) {
    const channelsList = document.getElementById('channelsList');
    channelsList.innerHTML = '';

    const categories = channels.filter(c => c.type === 4);
    const textChannels = channels.filter(c => c.type === 0);
    const voiceChannels = channels.filter(c => c.type === 2);

    if (categories.length > 0) {
        categories.forEach(category => {
            const categoryChannels = channels.filter(c => c.parent_id === category.id);
            const categoryElement = document.createElement('div');
            categoryElement.className = 'channel-category';
            categoryElement.innerHTML = `
                <h4><i class="fas fa-folder"></i> ${category.name}</h4>
                <div class="category-channels">
                    ${categoryChannels.map(channel => `
                        <div class="channel-item">
                            <i class="fas fa-${channel.type === 0 ? 'hashtag' : 'volume-up'}"></i>
                            <span>${channel.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            channelsList.appendChild(categoryElement);
        });
    }

    // Display uncategorized channels
    const uncategorizedChannels = channels.filter(c => !c.parent_id);
    if (uncategorizedChannels.length > 0) {
        const uncategorizedElement = document.createElement('div');
        uncategorizedElement.className = 'channel-category';
        uncategorizedElement.innerHTML = `
            <h4><i class="fas fa-hashtag"></i> Channels</h4>
            <div class="category-channels">
                ${uncategorizedChannels.map(channel => `
                    <div class="channel-item">
                        <i class="fas fa-${channel.type === 0 ? 'hashtag' : 'volume-up'}"></i>
                        <span>${channel.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
        channelsList.appendChild(uncategorizedElement);
    }
}

// Function to display roles
function displayRoles(roles) {
    const rolesList = document.getElementById('rolesList');
    rolesList.innerHTML = '';

    roles.sort((a, b) => b.position - a.position).forEach(role => {
        const roleElement = document.createElement('div');
        roleElement.className = 'role-item';
        roleElement.innerHTML = `
            <div class="role-color" style="background-color: ${role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#99aab5'}"></div>
            <div class="role-info">
                <span class="role-name">${role.name}</span>
                <span class="role-members">${role.members || 0} members</span>
            </div>
        `;
        rolesList.appendChild(roleElement);
    });
}

// Function to fetch and display server details
async function fetchServerDetails() {
    try {
        const response = await fetch(`/api/user/${encodeURIComponent(token)}/server/${guildId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch server details');
        }

        const server = await response.json();

        // Update basic info
        document.getElementById('serverName').textContent = server.name;
        document.getElementById('serverId').textContent = `ID: ${server.id}`;
        document.getElementById('serverIcon').src = server.icon 
            ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        // Update stats
        document.getElementById('memberCount').textContent = server.members.total;
        document.getElementById('channelCount').textContent = server.channels?.length || 0;
        document.getElementById('ownerName').textContent = server.owner ? 'You' : 'Unknown';
        document.getElementById('creationDate').textContent = formatDate(server.id / 4194304 + 1420070400000);

        // Update server information
        document.getElementById('serverRegion').textContent = server.region || 'Unknown';
        document.getElementById('verificationLevel').textContent = formatVerificationLevel(server.verification_level);
        document.getElementById('contentFilter').textContent = formatContentFilter(server.explicit_content_filter);
        document.getElementById('boostLevel').textContent = server.premium_tier || '0';

        // Add member statistics section
        const memberStatsSection = document.createElement('div');
        memberStatsSection.className = 'section';
        memberStatsSection.innerHTML = `
            <h3>Member Statistics</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Total Members</span>
                    <span class="info-value">${server.members.total}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Online</span>
                    <span class="info-value">${server.members.online}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Offline</span>
                    <span class="info-value">${server.members.offline}</span>
                </div>
                ${server.members.idle > 0 ? `
                <div class="info-item">
                    <span class="info-label">Idle</span>
                    <span class="info-value">${server.members.idle}</span>
                </div>
                ` : ''}
                ${server.members.dnd > 0 ? `
                <div class="info-item">
                    <span class="info-label">Do Not Disturb</span>
                    <span class="info-value">${server.members.dnd}</span>
                </div>
                ` : ''}
                ${server.members.bots > 0 ? `
                <div class="info-item">
                    <span class="info-label">Bots</span>
                    <span class="info-value">${server.members.bots}</span>
                </div>
                ` : ''}
                ${server.members.humans > 0 ? `
                <div class="info-item">
                    <span class="info-label">Humans</span>
                    <span class="info-value">${server.members.humans}</span>
                </div>
                ` : ''}
            </div>
            ${!server.members.idle && !server.members.dnd && !server.members.bots ? `
            <div class="info-note">
                <i class="fas fa-info-circle"></i>
                <span>Detailed member statistics require additional permissions</span>
            </div>
            ` : ''}
        `;

        // Add emoji statistics section
        const emojiStatsSection = document.createElement('div');
        emojiStatsSection.className = 'section';
        emojiStatsSection.innerHTML = `
            <h3>Emoji Statistics</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Total Emojis</span>
                    <span class="info-value">${server.emojis.total}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Animated</span>
                    <span class="info-value">${server.emojis.animated}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Static</span>
                    <span class="info-value">${server.emojis.static}</span>
                </div>
            </div>
        `;

        // Add server limits section
        const serverLimitsSection = document.createElement('div');
        serverLimitsSection.className = 'section';
        serverLimitsSection.innerHTML = `
            <h3>Server Limits</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Max Members</span>
                    <span class="info-value">${server.max_members.toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Max Video Users</span>
                    <span class="info-value">${server.max_video_channel_users}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Max Stage Video Users</span>
                    <span class="info-value">${server.max_stage_video_channel_users}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Boost Count</span>
                    <span class="info-value">${server.premium_subscription_count}</span>
                </div>
            </div>
        `;

        // Add server features section
        const serverFeaturesSection = document.createElement('div');
        serverFeaturesSection.className = 'section';
        serverFeaturesSection.innerHTML = `
            <h3>Server Features</h3>
            <div class="features-list">
                ${server.features.map(feature => `
                    <div class="feature-item">
                        <i class="fas fa-check"></i>
                        <span>${feature.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Add banned users section
        const bannedUsersSection = document.createElement('div');
        bannedUsersSection.className = 'section';
        bannedUsersSection.innerHTML = `
            <h3>Banned Users (${server.bans.total})</h3>
            ${server.bans.total > 0 ? `
                <div class="bans-list">
                    ${server.bans.list.map(ban => `
                        <div class="ban-item">
                            <div class="ban-user">
                                <img src="${ban.user.avatar ? 
                                    `https://cdn.discordapp.com/avatars/${ban.user.id}/${ban.user.avatar}.png` : 
                                    'https://cdn.discordapp.com/embed/avatars/0.png'}" 
                                    alt="${ban.user.username}" 
                                    class="ban-avatar">
                                <div class="ban-info">
                                    <span class="ban-username">${ban.user.username}#${ban.user.discriminator}</span>
                                    <span class="ban-id">ID: ${ban.user.id}</span>
                                </div>
                            </div>
                            <div class="ban-details">
                                <div class="ban-reason">
                                    <i class="fas fa-exclamation-circle"></i>
                                    <span>${ban.reason}</span>
                                </div>
                                <div class="ban-date">
                                    <i class="fas fa-clock"></i>
                                    <span>${formatDate(ban.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="no-bans">
                    <i class="fas fa-shield-alt"></i>
                    <span>No users are currently banned from this server</span>
                </div>
            `}
        `;

        // Insert new sections before the channels section
        const channelsSection = document.querySelector('.section:nth-child(3)');
        channelsSection.parentNode.insertBefore(memberStatsSection, channelsSection);
        channelsSection.parentNode.insertBefore(emojiStatsSection, channelsSection);
        channelsSection.parentNode.insertBefore(serverLimitsSection, channelsSection);
        channelsSection.parentNode.insertBefore(serverFeaturesSection, channelsSection);
        channelsSection.parentNode.insertBefore(bannedUsersSection, channelsSection);

        // Display channels and roles
        if (server.channels) {
            displayChannels(server.channels);
        }
        if (server.roles) {
            displayRoles(server.roles);
        }

    } catch (error) {
        console.error('Error:', error);
        document.querySelector('.server-details-container').innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>Failed to load server details. Please try again later.</p>
            </div>
        `;
    }
}

// Add event listeners
document.getElementById('copyIdBtn').addEventListener('click', () => copyToClipboard(guildId));
document.getElementById('copyInviteBtn').addEventListener('click', createAndCopyInvite);
document.getElementById('leaveServerBtn').addEventListener('click', leaveServer);

// Load server details when page loads
document.addEventListener('DOMContentLoaded', fetchServerDetails); 