/**
 * Velora Messages Logic with Socket.io
 */

if (!isLoggedIn()) window.location.href = 'login.html';

const { user: currentUser, token } = getSession();
if (currentUser) {
    document.getElementById('nav-user-avatar').src = currentUser.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${currentUser.username}`;
}

// ---- Connect to Socket.io ----
let socket;
try {
    if (typeof io !== 'undefined') {
        const socketUrl = `http://${window.location.hostname}:5000`;
        socket = io(socketUrl, {
            auth: { token }
        });
    } else {
        console.warn("Socket.io not loaded. Real-time features disabled.");
    }
} catch(e) {
    console.warn("Socket.io initialization failed.", e);
}

let currentChatUserId = null;
let conversations = [];

// ---- Elements ----
const convListEl = document.getElementById('conv-list');
const chatAreaEl = document.getElementById('chat-area');

// ---- New Message Search ----
const newMsgBtn = document.getElementById('new-msg-btn');
const searchBox = document.getElementById('user-search-box');
const searchInput = document.getElementById('user-search-input');
const searchResults = document.getElementById('user-search-results');

newMsgBtn.addEventListener('click', () => {
    searchBox.style.display = searchBox.style.display === 'none' ? 'block' : 'none';
    if (searchBox.style.display === 'block') searchInput.focus();
});

let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    if (!q) { searchResults.innerHTML = ''; return; }
    searchTimeout = setTimeout(async () => {
        try {
            const data = await API.users.search(q);
            const users = data.users || [];
            searchResults.innerHTML = '';
            if (users.length === 0) {
                searchResults.innerHTML = '<div style="padding:8px;color:var(--clr-text-muted);font-size:0.9rem;">No users found.</div>';
                return;
            }
            users.forEach(u => {
                if (u.id === currentUser.id) return;
                const item = document.createElement('div');
                item.className = 'conv-item';
                item.style.cssText = 'padding:10px;border-radius:10px;cursor:pointer;';
                item.innerHTML = `<img src="${u.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${u.username}`}" class="avatar" width="36" height="36"> <span style="font-weight:600;">${u.username}</span>`;
                item.onclick = () => {
                    searchBox.style.display = 'none';
                    searchInput.value = '';
                    searchResults.innerHTML = '';
                    openChat({ id: u.id, username: u.username, avatar: u.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${u.username}` });
                };
                searchResults.appendChild(item);
            });
        } catch(e) {
            searchResults.innerHTML = '<div style="padding:8px;color:red;font-size:0.88rem;">Search failed.</div>';
        }
    }, 300);
});

// ---- Render Helpers ----
function renderConversations() {
    convListEl.innerHTML = '';
    if (conversations.length === 0) {
        convListEl.innerHTML = `<div style="padding:24px; text-align:center; color:var(--clr-text-muted);">No messages yet. Search for a user to start chatting!</div>`;
        return;
    }

    conversations.forEach(c => {
        const item = document.createElement('div');
        item.className = `conv-item ${currentChatUserId === c.id ? 'active' : ''}`;
        item.onclick = () => openChat(c);

        item.innerHTML = `
            <img src="${c.avatar}" class="avatar" width="48" height="48" alt="${c.username}">
            <div class="conv-info">
                <div class="conv-name">${c.username}</div>
                <div class="conv-last">${c.lastMessage}</div>
            </div>
            ${!c.is_read && c.sender_id !== currentUser.id ? '<div style="width:10px;height:10px;background:var(--clr-peach-dark);border-radius:50%;"></div>' : ''}
        `;
        convListEl.appendChild(item);
    });
}

function appendMessage(msg, prepend = false) {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    const isSentByMe = msg.sender_id === currentUser.id;
    const bubble = document.createElement('div');
    bubble.className = `msg-bubble fade-in visible ${isSentByMe ? 'msg-sent' : 'msg-received'}`;
    bubble.textContent = msg.content;
    
    if (prepend) {
        container.insertBefore(bubble, container.firstChild);
    } else {
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }
}

async function openChat(user) {
    currentChatUserId = user.id;
    renderConversations(); // highlight active

    // Build chat UI
    chatAreaEl.innerHTML = `
        <div class="chat-header">
            <button class="clay-btn clay-btn-ghost clay-btn-sm" onclick="closeChat()" style="display:none;" id="mobile-back-btn">← Back</button>
            <img src="${user.avatar}" class="avatar" width="40" height="40">
            <div>
                <div style="font-weight:600;">${user.username}</div>
            </div>
        </div>
        <div class="chat-messages" id="messages-container">
            <div style="text-align:center;"><span class="spinner"></span></div>
        </div>
        <div class="chat-input-area">
            <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." autocomplete="off">
            <button class="send-btn" id="send-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
        </div>
    `;

    // Handle mobile view
    if (window.innerWidth <= 900) {
        document.querySelector('.conv-list').classList.remove('show');
        chatAreaEl.classList.remove('hide');
        document.getElementById('mobile-back-btn').style.display = 'block';
    }

    // Load history
    try {
        const history = await API.messages.history(user.id);
        const container = document.getElementById('messages-container');
        container.innerHTML = '';
        if (history.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--clr-text-muted); margin-top:20px;">Say hi to ${user.username}!</div>`;
        } else {
            history.forEach(m => appendMessage(m));
        }
    } catch (e) {
        document.getElementById('messages-container').innerHTML = `<div style="text-align:center; color:red;">Failed to load messages.</div>`;
    }

    // Setup input
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;
        
        input.value = '';
        if (socket) {
            socket.emit('send_message', { receiverId: currentChatUserId, content: text }, (res) => {
                if (res.success) {
                    appendMessage(res.message);
                    updateConvList(currentChatUserId, text);
                }
            });
        } else {
            showToast('Real-time chat is currently offline.', 'error');
        }
    };

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
    input.focus();
}

function closeChat() {
    currentChatUserId = null;
    document.querySelector('.conv-list').classList.add('show');
    chatAreaEl.classList.add('hide');
}

// Update local conversation list instantly
function updateConvList(userId, text) {
    const idx = conversations.findIndex(c => c.id === userId);
    if (idx !== -1) {
        conversations[idx].lastMessage = text;
        const c = conversations.splice(idx, 1)[0];
        conversations.unshift(c); // move to top
    } else {
        // If it's a new conversation, we should ideally fetch the user info, but for simplicity we reload
        loadConversations();
    }
    renderConversations();
}

// ---- Listen for Incoming Messages ----
if (socket) {
    socket.on('receive_message', (msg) => {
        // If we have the chat open, append it
        if (currentChatUserId === msg.sender_id) {
            appendMessage(msg);
        }
        updateConvList(msg.sender_id, msg.content);
    });
}

// ---- Init ----
async function loadConversations() {
    try {
        conversations = await API.messages.conversations();
        renderConversations();
        
        // Check for 'u' parameter to automatically open a chat
        const urlParams = new URLSearchParams(window.location.search);
        const targetUsername = urlParams.get('u');
        
        if (targetUsername) {
            try {
                const profileData = await API.users.profile(targetUsername);
                if (profileData && profileData.user) {
                    const u = profileData.user;
                    // Format avatar fallback if missing
                    u.avatar = u.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${u.username}`;
                    openChat(u);
                }
            } catch (e) {
                console.error("Could not load target user for chat:", e);
            }
        } else if (window.innerWidth <= 900) {
            // If on mobile and no specific chat requested, show list
            document.querySelector('.conv-list').classList.add('show');
            chatAreaEl.classList.add('hide');
        }
    } catch (e) {
        convListEl.innerHTML = `<div style="padding:24px; color:red;">Failed to load.</div>`;
    }
}

loadConversations();
