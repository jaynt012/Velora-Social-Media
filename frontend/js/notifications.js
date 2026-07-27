/**
 * Velora Notifications Page Logic
 */

if (!isLoggedIn()) window.location.href = 'login.html';

const { user: currentUser } = getSession();
if (currentUser) {
    document.getElementById('nav-user-avatar').src =
        currentUser.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${currentUser.username}`;
}

function timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const NOTIF_ICONS = {
    like:    { emoji: '❤️', text: 'liked your post' },
    comment: { emoji: '💬', text: 'commented on your post' },
    follow:  { emoji: '👤', text: 'started following you' },
    message: { emoji: '✉️', text: 'sent you a message' },
};

const DEMO_NOTIFICATIONS = [
    { id: 1, type: 'like', isRead: false, timestamp: new Date(Date.now() - 300000).toISOString(), actor: { username: 'Aria Kim', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Aria' }, postContent: 'Just dropped my new moodboard for Q3...' },
    { id: 2, type: 'follow', isRead: false, timestamp: new Date(Date.now() - 900000).toISOString(), actor: { username: 'Marco Rivera', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Marco' }, postContent: null },
    { id: 3, type: 'comment', isRead: true, timestamp: new Date(Date.now() - 3600000).toISOString(), actor: { username: 'Zoe Parks', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Zoe' }, postContent: 'This is such a great post! Love the vibes here...' },
    { id: 4, type: 'like', isRead: true, timestamp: new Date(Date.now() - 7200000).toISOString(), actor: { username: 'Luca Blanc', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Luca' }, postContent: 'Just launched my new portfolio...' },
];

function renderNotification(n) {
    const info = NOTIF_ICONS[n.type] || { emoji: '🔔', text: 'did something' };
    const el = document.createElement('div');
    el.className = `notif-item ${!n.isRead ? 'unread' : ''}`;
    el.innerHTML = `
        <div class="notif-icon ${n.type}">${info.emoji}</div>
        <div class="notif-body">
            <div class="notif-text">
                <a href="profile.html?u=${n.actor.username}" style="font-weight:700; color:inherit; text-decoration:none;">
                    ${n.actor.username}
                </a>
                ${info.text}
            </div>
            ${n.postContent ? `<div class="notif-preview">"${n.postContent}"</div>` : ''}
            <div class="notif-time">${timeAgo(n.timestamp)}</div>
        </div>
        <img src="${n.actor.avatar}" class="avatar" width="40" height="40" alt="${n.actor.username}">
    `;
    return el;
}

async function loadNotifications() {
    const listEl = document.getElementById('notif-list');
    
    try {
        const notifications = await API.notifications.getAll();
        listEl.innerHTML = '';
        
        if (notifications.length === 0) {
            listEl.innerHTML = `
                <div class="empty-notif">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <h3>You're all caught up!</h3>
                    <p>When people like, comment, or follow you, it'll show up here.</p>
                </div>
            `;
            return;
        }
        
        notifications.forEach(n => listEl.appendChild(renderNotification(n)));
    } catch (e) {
        // Show demo data if backend not connected
        listEl.innerHTML = '';
        DEMO_NOTIFICATIONS.forEach(n => listEl.appendChild(renderNotification(n)));
    }
}

loadNotifications();
