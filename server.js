const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure tokens.txt exists
if (!fs.existsSync('tokens.txt')) {
    fs.writeFileSync('tokens.txt', '');
}

// Serve user details page
app.get('/user/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

// Serve servers page
app.get('/user/:token/servers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'servers.html'));
});

// Serve server details page
app.get('/user/:token/servers/:guildId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'server.html'));
});

// Get user details
app.get('/api/user/:token', async (req, res) => {
    const token = req.params.token;
    
    try {
        const response = await fetch('https://discord.com/api/v9/users/@me', {
            headers: {
                'Authorization': token
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            // Get user presence/status
            const presenceResponse = await fetch('https://discord.com/api/v9/users/@me/settings', {
                headers: {
                    'Authorization': token
                }
            });
            
            // Get user's guilds (servers)
            const guildsResponse = await fetch('https://discord.com/api/v9/users/@me/guilds', {
                headers: {
                    'Authorization': token
                }
            });
            
            let presence = { status: 'offline' };
            if (presenceResponse.ok) {
                presence = await presenceResponse.json();
            }

            let guilds = [];
            if (guildsResponse.ok) {
                guilds = await guildsResponse.json();
            }
            
            res.json({
                ...userData,
                presence,
                guilds,
                avatarUrl: userData.avatar ? 
                    `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 
                    'https://cdn.discordapp.com/embed/avatars/0.png',
                created_at: new Date(parseInt(userData.id) / 4194304 + 1420070400000).toISOString()
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// Get all tokens
app.get('/api/tokens', (req, res) => {
    const tokens = fs.readFileSync('tokens.txt', 'utf8')
        .split('\n')
        .filter(token => token.trim() !== '');
    
    Promise.all(tokens.map(async (token) => {
        try {
            const response = await fetch('https://discord.com/api/v9/users/@me', {
                headers: {
                    'Authorization': token.trim()
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                return {
                    token: token.trim(),
                    valid: true,
                    username: `${userData.username}#${userData.discriminator}`,
                    avatarUrl: userData.avatar ? 
                        `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 
                        'https://cdn.discordapp.com/embed/avatars/0.png'
                };
            }
            return {
                token: token.trim(),
                valid: false,
                username: null,
                avatarUrl: null
            };
        } catch (error) {
            return {
                token: token.trim(),
                valid: false,
                username: null,
                avatarUrl: null
            };
        }
    }))
    .then(results => res.json(results))
    .catch(error => res.status(500).json({ error: 'Failed to fetch token data' }));
});

// Add new token
app.post('/api/tokens', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const tokens = fs.readFileSync('tokens.txt', 'utf8')
        .split('\n')
        .filter(t => t.trim() !== '');

    if (!tokens.includes(token)) {
        fs.appendFileSync('tokens.txt', token + '\n');
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Token already exists' });
    }
});

// Remove token
app.delete('/api/tokens', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const tokens = fs.readFileSync('tokens.txt', 'utf8')
        .split('\n')
        .filter(t => t.trim() !== '' && t.trim() !== token);

    fs.writeFileSync('tokens.txt', tokens.join('\n') + '\n');
    res.json({ success: true });
});

// Get user's servers
app.get('/api/user/:token/servers', async (req, res) => {
    const token = req.params.token;
    
    try {
        const response = await fetch('https://discord.com/api/v9/users/@me/guilds', {
            headers: {
                'Authorization': token
            }
        });
        
        if (response.ok) {
            const guilds = await response.json();
            res.json(guilds);
        } else {
            res.status(404).json({ error: 'Failed to fetch servers' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch servers' });
    }
});

// Leave server
app.post('/api/user/:token/leave-server', async (req, res) => {
    const token = req.params.token;
    const { guildId } = req.body;
    
    if (!guildId) {
        return res.status(400).json({ error: 'Guild ID is required' });
    }
    
    try {
        const response = await fetch(`https://discord.com/api/v9/users/@me/guilds/${guildId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });
        
        if (response.ok) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Failed to leave server' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to leave server' });
    }
});

// Create server
app.post('/api/user/:token/create-server', async (req, res) => {
    const token = req.params.token;
    const { name, region } = req.body;
    
    try {
        const response = await fetch('https://discord.com/api/v9/guilds', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            body: JSON.stringify({
                name: 'Created with Tool!',
                region: 'us-central',
                icon: null,
                channels: [
                    {
                        name: 'general',
                        type: 0
                    }
                ]
            })
        });
        
        if (response.ok) {
            const guild = await response.json();
            res.json(guild);
        } else {
            const error = await response.json();
            console.error('Discord API Error:', error);
            res.status(400).json({ error: error.message || 'Failed to create server' });
        }
    } catch (error) {
        console.error('Server Creation Error:', error);
        res.status(500).json({ error: 'Failed to create server' });
    }
});

// Create server invite
app.post('/api/user/:token/create-invite/:guildId', async (req, res) => {
    const token = req.params.token;
    const guildId = req.params.guildId;
    
    try {
        // First, get the first channel in the guild
        const channelsResponse = await fetch(`https://discord.com/api/v9/guilds/${guildId}/channels`, {
            headers: {
                'Authorization': token,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!channelsResponse.ok) {
            throw new Error('Failed to fetch channels');
        }

        const channels = await channelsResponse.json();
        const textChannel = channels.find(channel => channel.type === 0); // Find first text channel

        if (!textChannel) {
            throw new Error('No text channels found');
        }

        // Create invite in the first text channel
        const inviteResponse = await fetch(`https://discord.com/api/v9/channels/${textChannel.id}/invites`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            body: JSON.stringify({
                max_age: 0,
                max_uses: 0,
                temporary: false
            })
        });

        if (inviteResponse.ok) {
            const invite = await inviteResponse.json();
            res.json({ invite: `https://discord.gg/${invite.code}` });
        } else {
            const error = await inviteResponse.json();
            console.error('Discord API Error:', error);
            res.status(400).json({ error: error.message || 'Failed to create invite' });
        }
    } catch (error) {
        console.error('Invite Creation Error:', error);
        res.status(500).json({ error: 'Failed to create invite' });
    }
});

// Get server details
app.get('/api/user/:token/server/:guildId', async (req, res) => {
    const { token, guildId } = req.params;
    
    try {
        // Fetch server details with additional fields
        const serverResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!serverResponse.ok) {
            throw new Error('Failed to fetch server details');
        }

        const server = await serverResponse.json();

        // Fetch channels
        const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!channelsResponse.ok) {
            throw new Error('Failed to fetch channels');
        }

        const channels = await channelsResponse.json();

        // Fetch roles
        const rolesResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!rolesResponse.ok) {
            throw new Error('Failed to fetch roles');
        }

        const roles = await rolesResponse.json();

        // Fetch server emojis
        const emojisResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/emojis`, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!emojisResponse.ok) {
            throw new Error('Failed to fetch emojis');
        }

        const emojis = await emojisResponse.json();

        // Check if user is owner
        const userResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user guilds');
        }

        const userGuilds = await userResponse.json();
        const userGuild = userGuilds.find(g => g.id === guildId);
        server.owner = userGuild?.owner || false;

        // Use approximate counts from the server object
        const memberStats = {
            total: server.approximate_member_count || 0,
            online: server.approximate_presence_count || 0,
            offline: (server.approximate_member_count || 0) - (server.approximate_presence_count || 0),
            idle: 0, // Not available without member list
            dnd: 0, // Not available without member list
            bots: 0, // Not available without member list
            humans: server.approximate_member_count || 0 // Approximate total
        };

        // Fetch server bans
        const bansResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/bans`, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        let bans = [];
        if (bansResponse.ok) {
            bans = await bansResponse.json();
        }

        // Combine all data
        const serverData = {
            ...server,
            channels,
            roles,
            members: memberStats,
            emojis: {
                total: emojis.length,
                animated: emojis.filter(e => e.animated).length,
                static: emojis.filter(e => !e.animated).length,
                list: emojis
            },
            bans: {
                total: bans.length,
                list: bans.map(ban => ({
                    user: {
                        id: ban.user.id,
                        username: ban.user.username,
                        discriminator: ban.user.discriminator,
                        avatar: ban.user.avatar
                    },
                    reason: ban.reason || 'No reason provided',
                    created_at: new Date(parseInt(ban.user.id) / 4194304 + 1420070400000).toISOString()
                }))
            },
            features: server.features || [],
            premium_subscription_count: server.premium_subscription_count || 0,
            max_members: server.max_members || 0,
            max_video_channel_users: server.max_video_channel_users || 0,
            max_stage_video_channel_users: server.max_stage_video_channel_users || 0
        };

        res.json(serverData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch server details' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 