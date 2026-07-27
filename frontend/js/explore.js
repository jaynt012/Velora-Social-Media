/**
 * Velora Explore Page Logic
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

// ---- Tab Switching ----
const tabBtns = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.search-results-section');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
    });
});

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

function createUserRow(user) {
    const div = document.createElement('div');
    div.className = 'user-suggestion fade-in visible';
    div.style.padding = '16px';
    const avatar = user.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${user.username}`;
    
    div.innerHTML = `
        <img src="${avatar}" class="avatar" alt="${user.username}" style="cursor:pointer;" onclick="window.location.href='profile?u=${user.username}'">
        <div class="user-suggestion-info" style="cursor:pointer; flex:1;" onclick="window.location.href='profile?u=${user.username}'">
            <div class="user-suggestion-name" style="font-size:1.1rem;">${user.username}</div>
            <div class="user-suggestion-handle">@${user.username}</div>
        </div>
        <button class="clay-btn clay-btn-sm follow-btn ${user.isFollowing ? 'clay-btn-ghost' : 'clay-btn-sky'}" data-id="${user.id}">
            ${user.isFollowing ? 'Unfollow' : 'Follow'}
        </button>
    `;
    
    // Follow button logic
    const followBtn = div.querySelector('.follow-btn');
    followBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        followBtn.disabled = true;
        const isFollowing = followBtn.textContent.trim() === 'Unfollow';
        try {
            if (isFollowing) {
                await API.users.unfollow(user.id);
                followBtn.textContent = 'Follow';
                followBtn.classList.remove('clay-btn-ghost');
                followBtn.classList.add('clay-btn-sky');
            } else {
                await API.users.follow(user.id);
                followBtn.textContent = 'Unfollow';
                followBtn.classList.add('clay-btn-ghost');
                followBtn.classList.remove('clay-btn-sky');
            }
        } catch (err) {
            showToast('Failed to update follow status', 'error');
        }
        followBtn.disabled = false;
    });
    
    return div;
}

const emptyStateHtml = `
    <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>No results found</h3>
        <p>Try different keywords.</p>
    </div>
`;

// ---- Search Logic ----
const searchInput = document.getElementById('search-input');
const postsContainer = document.getElementById('posts-container');
const usersContainer = document.getElementById('users-container');

let debounceTimeout;

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimeout);
    
    if (!query) {
        postsContainer.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <h3>Search the community</h3>
                <p>Type in the search bar above to find posts and inspiration.</p>
            </div>`;
        usersContainer.innerHTML = '';
        return;
    }
    
    postsContainer.innerHTML = '<div style="text-align:center; padding:40px;"><span class="spinner"></span></div>';
    usersContainer.innerHTML = '<div style="text-align:center; padding:40px;"><span class="spinner"></span></div>';

    debounceTimeout = setTimeout(async () => {
        try {
            const data = await API.search.query(query);
            
            // Render posts
            if (data.posts && data.posts.length > 0) {
                postsContainer.innerHTML = '';
                data.posts.forEach(p => postsContainer.appendChild(createPostCard(p)));
            } else {
                postsContainer.innerHTML = emptyStateHtml;
            }

            // Render users
            if (data.users && data.users.length > 0) {
                usersContainer.innerHTML = '';
                data.users.forEach(u => usersContainer.appendChild(createUserRow(u)));
            } else {
                usersContainer.innerHTML = emptyStateHtml;
            }
            
        } catch (err) {
            postsContainer.innerHTML = `<div class="empty-state">Error loading results.</div>`;
            usersContainer.innerHTML = `<div class="empty-state">Error loading results.</div>`;
        }
    }, 400);
});

// ---- Load Trending ----
async function loadTrending() {
    const list = document.getElementById('trending-list');
    try {
        const data = await API.search.trending();
        list.innerHTML = '';
        data.forEach(t => {
            const div = document.createElement('div');
            div.className = 'trending-item';
            div.innerHTML = `<div class="trending-tag">${t.tag}</div><div class="trending-count">${t.count} posts</div>`;
            list.appendChild(div);
        });
    } catch (_) {
        list.innerHTML = '<div style="padding:20px; text-align:center;">Could not load trending.</div>';
    }
}

loadTrending();
