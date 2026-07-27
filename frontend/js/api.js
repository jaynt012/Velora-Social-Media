/**
 * Velora API Layer
 * Centralizes all backend HTTP calls.
 */

const API_BASE = `http://${window.location.hostname}:5000/api`;

async function request(path, options = {}) {
    const token = localStorage.getItem('velora_token');
    const headers = { ...options.headers };
    
    // Automatically set JSON content type if body is present and not FormData
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const err = new Error(data.message || 'Request failed');
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

const API = {
    auth: {
        register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
        login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
    },
    posts: {
        getAll:      (page = 1) => request(`/posts?page=${page}`),
        create:      (body)    => request('/posts', { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
        like:        (id)      => request(`/posts/${id}/like`,     { method: 'POST' }),
        unlike:      (id)      => request(`/posts/${id}/unlike`,   { method: 'POST' }),
        delete:      (id)      => request(`/posts/${id}`,          { method: 'DELETE' }),
        getComments: (id)      => request(`/posts/${id}/comments`),
        addComment:  (id, body)=> request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
    },
    users: {
        me:        ()         => request('/users/me'),
        profile:   (username) => request(`/users/${username}`),
        followers: (username) => request(`/users/${username}/followers`),
        following: (username) => request(`/users/${username}/following`),
        follow:    (id)       => request(`/users/${id}/follow`,   { method: 'POST' }),
        unfollow:  (id)       => request(`/users/${id}/unfollow`, { method: 'POST' }),
        suggest:   ()         => request('/users/suggestions'),
    },
    search: {
        query:    (q) => request(`/search?q=${encodeURIComponent(q)}`),
        trending: ()  => request('/search/trending'),
    },
    messages: {
        conversations: ()       => request('/messages/conversations'),
        history:       (userId) => request(`/messages/${userId}`),
        unreadCount:   ()       => request('/messages/unread-count')
    },
    notifications: {
        getAll:      () => request('/notifications'),
        unreadCount: () => request('/notifications/unread-count'),
    }
};

// Auth helpers
function saveSession(token, user) {
    localStorage.setItem('velora_token', token);
    localStorage.setItem('velora_user',  JSON.stringify(user));
}

function getSession() {
    const token = localStorage.getItem('velora_token');
    const user  = JSON.parse(localStorage.getItem('velora_user') || 'null');
    return { token, user };
}

function clearSession() {
    localStorage.removeItem('velora_token');
    localStorage.removeItem('velora_user');
}

function isLoggedIn() {
    return !!localStorage.getItem('velora_token');
}

// ---- Global Nav Unread Dot Updater ----
async function updateUnreadMessagesDot() {
    if (!isLoggedIn()) return;
    try {
        const navMessages = document.getElementById('nav-messages');
        if (!navMessages) return;

        const data = await API.messages.unreadCount();
        
        let dot = navMessages.querySelector('.unread-dot');
        if (data.count > 0) {
            if (!dot) {
                dot = document.createElement('div');
                dot.className = 'unread-dot';
                navMessages.appendChild(dot);
            }
        } else {
            if (dot) dot.remove();
        }
    } catch (e) {
        // Silently fail if network error
    }
}

// Run immediately and every 10 seconds if logged in
if (isLoggedIn()) {
    updateUnreadMessagesDot();
    setInterval(updateUnreadMessagesDot, 10000);
}

// ---- Mobile Menu Logic ----
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuDropdown = document.getElementById('mobile-menu-dropdown');
    
    if (mobileMenuBtn && mobileMenuDropdown) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !mobileMenuDropdown.contains(e.target)) {
                mobileMenuDropdown.classList.remove('show');
            }
        });
    }
});

// Global logout function
window.globalLogout = function() {
    localStorage.removeItem('velora_token');
    localStorage.removeItem('velora_user');
    window.location.href = 'index.html';
};
