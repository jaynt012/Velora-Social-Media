/**
 * Velora Profile Page Logic
 */

if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

const { user: currentUser } = getSession();
if (currentUser) {
    document.getElementById('nav-user-avatar').src = currentUser.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${currentUser.username}`;
}

// ---- Toast ----
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = `toast ${type}`; }, 3500);
}

// Get username from URL query param (e.g., profile.html?u=aria_kim), default to current user
const urlParams = new URLSearchParams(window.location.search);
const rawParam = urlParams.get('u');
// Strip leading @ if present, and use currentUser as fallback
const targetUsername = rawParam ? rawParam.replace(/^@/, '') : currentUser.username;
const isOwnProfile = targetUsername === currentUser.username;

// ---- Render Helpers ----
function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'clay-card post-card fade-in visible';
    
    const formattedContent = post.content.replace(/(#\w+)/g, '<span class="post-tag">$1</span>');

    card.innerHTML = `
        <div class="post-header">
            <img src="${post.author.avatar}" alt="${post.author.username}'s avatar" class="avatar" width="44" height="44">
            <div class="post-meta">
                <div class="post-author">${post.author.username}</div>
                <div class="post-time">${post.author.handle} · ${post.timestamp || 'Recently'}</div>
            </div>
        </div>
        <div class="post-body">${formattedContent}</div>
        <div class="post-actions">
            <button class="action-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ${post.likes}</button>
            <button class="action-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${post.comments}</button>
        </div>
    `;
    return card;
}

const emptyStateHtml = `
    <div style="text-align:center; padding:48px 24px; color:var(--clr-text-muted); background:rgba(255,255,255,0.5); border-radius:16px; border:1px dashed var(--clr-border);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;opacity:0.5;margin-bottom:16px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <h3>No posts yet</h3>
        <p>This user hasn't posted anything.</p>
    </div>
`;

// ---- Load Profile ----
async function loadProfile() {
    try {
        const data = await API.users.profile(targetUsername);
        const { user, posts } = data;

        document.getElementById('profile-skeleton').style.display = 'none';
        const contentEl = document.getElementById('profile-content');
        contentEl.style.display = 'block';
        // Small delay to allow display:block to apply before fading in
        setTimeout(() => contentEl.classList.add('visible'), 10);

        // Populate header
        const avatarSrc = user.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${user.username}`;
        document.getElementById('profile-avatar').src = avatarSrc;
        document.getElementById('profile-name').textContent = user.display_name || user.username;
        document.getElementById('profile-handle').textContent = `@${user.username}`;
        document.getElementById('profile-bio').textContent = user.bio || (isOwnProfile ? 'Add a bio to tell people about yourself.' : '');
        
        document.getElementById('count-followers').textContent = user.followers || 0;
        document.getElementById('count-following').textContent = user.following || 0;

        // Meta tags
        if (user.location) {
            const locEl = document.getElementById('profile-location');
            locEl.style.display = 'flex';
            locEl.querySelector('i').textContent = user.location;
        }
        if (user.website) {
            const webEl = document.getElementById('profile-website');
            webEl.style.display = 'flex';
            const a = webEl.querySelector('a');
            a.href = user.website;
            a.textContent = user.website.replace(/^https?:\/\//, '');
        }
        
        const d = new Date(user.joined_date);
        const joinedStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('profile-joined').innerHTML += ` ${joinedStr}`;

        // Actions
        const actionsContainer = document.getElementById('profile-actions');
        if (isOwnProfile) {
            actionsContainer.innerHTML = `<button class="clay-btn clay-btn-ghost" id="edit-profile-trigger">Edit Profile</button>`;
            document.getElementById('edit-profile-trigger').addEventListener('click', () => {
                document.getElementById('edit-name').value = user.display_name || '';
                document.getElementById('edit-bio').value = user.bio || '';
                document.getElementById('edit-location').value = user.location || '';
                document.getElementById('edit-website').value = user.website || '';
                document.getElementById('edit-modal').classList.add('show');
            });
        } else {
            actionsContainer.innerHTML = `
                <button class="clay-btn" id="follow-btn">${user.isFollowing ? 'Unfollow' : 'Follow'}</button>
                <button class="clay-btn clay-btn-sky" id="message-btn" style="margin-left: 8px;">Message</button>
            `;
            const followBtn = document.getElementById('follow-btn');
            followBtn.addEventListener('click', async () => {
                followBtn.disabled = true;
                try {
                    if (user.isFollowing) {
                        await API.users.unfollow(user.id);
                        user.isFollowing = false;
                        followBtn.textContent = 'Follow';
                        followBtn.classList.remove('clay-btn-ghost');
                        document.getElementById('count-followers').textContent = parseInt(document.getElementById('count-followers').textContent) - 1;
                    } else {
                        await API.users.follow(user.id);
                        user.isFollowing = true;
                        followBtn.textContent = 'Unfollow';
                        followBtn.classList.add('clay-btn-ghost');
                        document.getElementById('count-followers').textContent = parseInt(document.getElementById('count-followers').textContent) + 1;
                    }
                } catch (e) {
                    showToast('Action failed.', 'error');
                }
                followBtn.disabled = false;
            });
            if (user.isFollowing) followBtn.classList.add('clay-btn-ghost');

            const messageBtn = document.getElementById('message-btn');
            messageBtn.addEventListener('click', () => {
                window.location.href = `messages?u=${user.username}`;
            });
        }

        // Posts
        const postsContainer = document.getElementById('posts-container');
        if (posts && posts.length > 0) {
            postsContainer.innerHTML = '';
            posts.forEach(p => postsContainer.appendChild(createPostCard(p)));
        } else {
            postsContainer.innerHTML = emptyStateHtml;
        }

    } catch (err) {
        document.getElementById('profile-skeleton').style.display = 'none';
        document.getElementById('profile-content').style.display = 'none';
        // Show a full not-found state instead of a bare error string
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'text-align:center; padding:80px 24px; color:var(--clr-text-muted);';
        errDiv.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:64px;height:64px;opacity:0.3;margin-bottom:20px;"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <h2 style="margin-bottom:8px;">User not found</h2>
            <p style="margin-bottom:24px;">The profile <strong>@${targetUsername}</strong> doesn't exist or may have been removed.</p>
            <a href="feed.html" class="clay-btn">Back to Feed</a>
        `;
        document.querySelector('.container').appendChild(errDiv);
    }
}

// ---- Edit Modal Logic ----
document.getElementById('close-modal-btn').addEventListener('click', () => {
    document.getElementById('edit-modal').classList.remove('show');
});

document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const body = {
        display_name: document.getElementById('edit-name').value.trim(),
        bio: document.getElementById('edit-bio').value.trim(),
        location: document.getElementById('edit-location').value.trim(),
        website: document.getElementById('edit-website').value.trim(),
    };

    try {
        const res = await fetch('http://localhost:5000/api/users/me', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getSession().token}`
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to update');
        
        showToast('Profile updated!', 'success');
        document.getElementById('edit-modal').classList.remove('show');
        setTimeout(() => location.reload(), 800); // Reload to show new info
    } catch (e) {
        showToast('Update failed.', 'error');
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
});

// Init
loadProfile();

// ---- Connections Modal Logic ----
const connectionsModal = document.getElementById('connections-modal');
const connectionsList = document.getElementById('connections-list');
const connectionsTabs = document.getElementById('connections-tabs');
const closeConnectionsModalBtn = document.getElementById('close-connections-modal');

if (closeConnectionsModalBtn) {
    closeConnectionsModalBtn.addEventListener('click', () => {
        connectionsModal.classList.remove('show');
        setTimeout(() => connectionsModal.style.display = 'none', 300);
    });
}

async function loadConnections(type) {
    connectionsList.innerHTML = '<div style="text-align:center; padding:20px;"><span class="spinner"></span></div>';
    
    // Update active tab button visually
    Array.from(connectionsTabs.querySelectorAll('button')).forEach(btn => {
        if (btn.dataset.tab === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    try {
        const users = type === 'followers' 
            ? await API.users.followers(targetUsername)
            : await API.users.following(targetUsername);

        connectionsList.innerHTML = '';
        if (users.length === 0) {
            connectionsList.innerHTML = `<div style="text-align:center; color:var(--clr-text-muted); padding:20px;">No ${type} found.</div>`;
            return;
        }

        users.forEach(user => {
            const userEl = document.createElement('div');
            userEl.style.cssText = 'display:flex; align-items:center; gap:12px; padding:10px; border-bottom:1px solid var(--clr-border); cursor:pointer;';
            userEl.innerHTML = `
                <img src="${user.avatar}" width="40" height="40" style="border-radius:50%; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:600;">${user.username}</div>
                </div>
            `;
            userEl.addEventListener('click', () => {
                window.location.href = `profile.html?u=${user.username}`;
            });
            connectionsList.appendChild(userEl);
        });
    } catch (e) {
        connectionsList.innerHTML = '<div style="text-align:center; color:var(--clr-primary); padding:20px;">Error loading data.</div>';
    }
}

document.getElementById('followers-stat').addEventListener('click', () => {
    connectionsModal.style.display = 'flex';
    // small delay to allow display:flex to apply before adding show class for transition
    setTimeout(() => connectionsModal.classList.add('show'), 10);
    loadConnections('followers');
});

document.getElementById('following-stat').addEventListener('click', () => {
    connectionsModal.style.display = 'flex';
    setTimeout(() => connectionsModal.classList.add('show'), 10);
    loadConnections('following');
});

if (connectionsTabs) {
    connectionsTabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            loadConnections(e.target.dataset.tab);
        }
    });
}

