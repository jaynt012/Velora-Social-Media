/**
 * Velora Feed Page Logic
 */

// ---- Guard: redirect if not logged in ----
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

const { user: currentUser } = getSession();

// ---- Toast ----
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = `toast ${type}`; }, 3500);
}

// ---- Seed demo posts (shown while backend may not be running) ----
const DEMO_POSTS = [
    {
        id: 'demo1',
        author: { username: 'aria_kim', handle: '@aria_kim', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Aria' },
        content: 'Just dropped my new moodboard for Q3 — softness, structure, and a whole lot of lavender. What do you all think? ✨ #MoodBoard #DesignVibes',
        timestamp: '2 hours ago',
        likes: 142,
        comments: 38,
        liked: false,
    },
    {
        id: 'demo2',
        author: { username: 'marco_rv', handle: '@marco_rv', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Marco' },
        content: 'Golden hour at the rooftop. Some moments just deserve to be shared. 🌇 #GoldenHour #Velora',
        timestamp: '4 hours ago',
        likes: 210,
        comments: 54,
        liked: true,
    },
    {
        id: 'demo3',
        author: { username: 'zoe_parks', handle: '@zoe_parks', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Zoe' },
        content: 'There is something so powerful about a community that actually listens. Found my people here on Velora. 💙 #CreativeLife',
        timestamp: '6 hours ago',
        likes: 98,
        comments: 21,
        liked: false,
    },
    {
        id: 'demo4',
        author: { username: 'luca_b', handle: '@luca_b', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Luca' },
        content: 'Just launched my new portfolio site — three months of late nights and too much coffee, finally done! Would love some feedback from this amazing community. 🚀',
        timestamp: '8 hours ago',
        likes: 305,
        comments: 77,
        liked: false,
    },
];

// ---- Render User Info ----
function renderUserInfo(user) {
    const avatarSrc = user?.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${user?.username || 'user'}`;

    document.getElementById('nav-user-avatar').src = avatarSrc;
    document.getElementById('sidebar-avatar').src  = avatarSrc;
    document.getElementById('create-post-avatar').src = avatarSrc;

    document.getElementById('sidebar-name').textContent   = user?.username || 'You';
    document.getElementById('sidebar-handle').textContent = `@${user?.username || 'you'}`;
}

// ---- Render Post Card ----
function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'clay-card post-card fade-in';
    card.id = `post-${post.id}`;

    // Format content with hashtag highlights
    const formattedContent = post.content.replace(/(#\w+)/g, '<span class="post-tag">$1</span>');

    card.innerHTML = `
        <div class="post-header">
            <a href="profile?u=${post.author.username}" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;">
                <img src="${post.author.avatar}" alt="${post.author.username}'s avatar" class="avatar" width="44" height="44">
                <div class="post-meta">
                    <div class="post-author">${post.author.username}</div>
                    <div class="post-time">${post.author.handle} · ${post.timestamp}</div>
                </div>
            </a>
        </div>
        <div class="post-body">${formattedContent}</div>
        ${post.image_url ? `<div class="post-image-container" style="margin-top: 12px; border-radius: 12px; overflow: hidden;"><img src="http://${window.location.hostname}:5000${post.image_url}" style="width: 100%; max-height: 500px; object-fit: cover; display: block;" alt="Post image"></div>` : ''}
        <div class="post-actions">
            <button class="action-btn like-btn ${post.liked ? 'liked' : ''}" data-id="${post.id}" aria-label="${post.liked ? 'Unlike' : 'Like'} post" aria-pressed="${post.liked}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${post.liked ? '#E11D48' : 'none'}" stroke="${post.liked ? '#E11D48' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span class="like-count">${post.likes}</span>
            </button>
            <button class="action-btn comment-toggle-btn" data-id="${post.id}" aria-label="Comment on post">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span class="comment-count">${post.comments}</span>
            </button>
            <button class="action-btn" aria-label="Share post" onclick="navigator.clipboard.writeText(window.location.href);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share
            </button>
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display:none; padding:0 4px 8px;">
            <div class="comments-list" id="comments-list-${post.id}"></div>
            <div style="display:flex;gap:8px;margin-top:10px;">
                <input type="text" class="comment-input" id="comment-input-${post.id}" placeholder="Write a comment..." style="flex:1;padding:10px 16px;border-radius:20px;border:1.5px solid var(--clr-border);background:rgba(255,255,255,0.8);font-size:0.9rem;">
                <button class="clay-btn" style="padding:8px 16px;" id="comment-submit-${post.id}">Post</button>
            </div>
        </div>
    `;

    // Like button handler
    card.querySelector('.like-btn').addEventListener('click', async function() {
        const wasLiked = this.classList.contains('liked');
        const countEl  = this.querySelector('.like-count');
        const svg      = this.querySelector('svg');
        const count    = parseInt(countEl.textContent);

        if (wasLiked) {
            this.classList.remove('liked');
            this.setAttribute('aria-pressed', 'false');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            countEl.textContent = count - 1;
            try { if (!String(post.id).startsWith('demo')) await API.posts.unlike(post.id); } catch(_){}
        } else {
            this.classList.add('liked');
            this.setAttribute('aria-pressed', 'true');
            svg.setAttribute('fill', '#E11D48');
            svg.setAttribute('stroke', '#E11D48');
            countEl.textContent = count + 1;
            try { if (!String(post.id).startsWith('demo')) await API.posts.like(post.id); } catch(_){}
        }
    });

    // Comments toggle
    card.querySelector('.comment-toggle-btn').addEventListener('click', async function() {
        const section = document.getElementById(`comments-${post.id}`);
        const isHidden = section.style.display === 'none';
        section.style.display = isHidden ? 'block' : 'none';
        if (isHidden && String(post.id).startsWith('demo') === false) {
            const listEl = document.getElementById(`comments-list-${post.id}`);
            listEl.innerHTML = '<div style="padding:8px;color:var(--clr-text-muted);font-size:0.9rem;">Loading...</div>';
            try {
                const comments = await API.posts.getComments(post.id);
                listEl.innerHTML = '';
                if (comments.length === 0) {
                    listEl.innerHTML = '<div style="color:var(--clr-text-muted);font-size:0.88rem;padding:6px;">No comments yet. Be the first!</div>';
                } else {
                    comments.forEach(c => {
                        const el = document.createElement('div');
                        el.style.cssText = 'display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;';
                        el.innerHTML = `<img src="${c.author.avatar}" class="avatar" width="32" height="32"><div><div style="font-weight:600;font-size:0.85rem;">${c.author.username}</div><div style="font-size:0.9rem;">${c.content}</div></div>`;
                        listEl.appendChild(el);
                    });
                }
            } catch(e) { listEl.innerHTML = '<div style="color:var(--clr-text-muted);font-size:0.88rem;padding:6px;">Could not load comments.</div>'; }
        }
        // Setup submit
        const submitBtn = document.getElementById(`comment-submit-${post.id}`);
        const inputEl   = document.getElementById(`comment-input-${post.id}`);
        if (submitBtn && !submitBtn.dataset.bound) {
            submitBtn.dataset.bound = '1';
            const submit = async () => {
                const text = inputEl.value.trim();
                if (!text) return;
                inputEl.value = '';
                const listEl = document.getElementById(`comments-list-${post.id}`);
                // Optimistic
                const el = document.createElement('div');
                el.style.cssText = 'display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;';
                el.innerHTML = `<img src="${currentUser.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${currentUser.username}`}" class="avatar" width="32" height="32"><div><div style="font-weight:600;font-size:0.85rem;">${currentUser.username}</div><div style="font-size:0.9rem;">${text}</div></div>`;
                listEl.appendChild(el);
                // Persist
                try { if (!String(post.id).startsWith('demo')) await API.posts.addComment(post.id, { content: text }); } catch(_){}
                // Update count
                const countSpan = card.querySelector('.comment-count');
                countSpan.textContent = parseInt(countSpan.textContent) + 1;
            };
            submitBtn.addEventListener('click', submit);
            inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') submit(); });
        }
    });

    // Fade in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { card.classList.add('visible'); });
    });

    return card;
}

// ---- Skeleton Loader ----
function renderSkeletons(n = 3) {
    const container = document.getElementById('posts-container');
    for (let i = 0; i < n; i++) {
        const sk = document.createElement('div');
        sk.className = 'clay-card skeleton-card';
        sk.innerHTML = `
            <div class="sk-header">
                <div class="skeleton sk-avatar"></div>
                <div class="sk-lines">
                    <div class="skeleton sk-line" style="width:140px"></div>
                    <div class="skeleton sk-line" style="width:90px"></div>
                </div>
            </div>
            <div class="skeleton sk-line" style="width:100%; height:14px; margin-bottom:8px;"></div>
            <div class="skeleton sk-line" style="width:80%; height:14px;"></div>
        `;
        container.appendChild(sk);
    }
}

// ---- Load Posts ----
async function loadPosts() {
    const container = document.getElementById('posts-container');
    renderSkeletons();

    try {
        const data = await API.posts.getAll();
        container.innerHTML = '';
        const posts = data.posts || DEMO_POSTS;
        posts.forEach(p => container.appendChild(createPostCard(p)));
        document.getElementById('feed-end').style.display = 'block';
    } catch (_) {
        // Backend not connected yet — show demo content
        container.innerHTML = '';
        DEMO_POSTS.forEach(p => container.appendChild(createPostCard(p)));
        document.getElementById('feed-end').style.display = 'block';
    }
}

// ---- Create Post ----
let selectedImageFile = null;

document.getElementById('attach-photo-btn').addEventListener('click', () => {
    document.getElementById('post-image-input').click();
});

document.getElementById('post-image-input').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        selectedImageFile = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('image-preview-container').style.display = 'block';
        };
        reader.readAsDataURL(selectedImageFile);
    }
});

document.getElementById('remove-image-btn').addEventListener('click', () => {
    selectedImageFile = null;
    document.getElementById('post-image-input').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
});

document.getElementById('submit-post-btn').addEventListener('click', async () => {
    const textarea = document.getElementById('post-content');
    const content  = textarea.value.trim();
    if (!content && !selectedImageFile) { showToast('Write something or attach an image!', 'error'); return; }
    if (!content) { showToast('Content is required.', 'error'); return; }

    const btn = document.getElementById('submit-post-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;

    // Optimistic UI insert (without image upload URL immediately)
    let tempImageUrl = '';
    if (selectedImageFile) {
        tempImageUrl = document.getElementById('image-preview').src;
    }

    const newPost = {
        id: `local-${Date.now()}`,
        author: {
            username: currentUser?.username || 'You',
            handle:   `@${currentUser?.username || 'you'}`,
            avatar:   currentUser?.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${currentUser?.username}`,
        },
        content,
        image_url: tempImageUrl ? tempImageUrl.replace(`http://${window.location.hostname}:5000`, '') : '',
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        liked: false,
    };

    const container = document.getElementById('posts-container');
    const tempCard = createPostCard(newPost);
    if (tempImageUrl) {
        // Fix temp image source since the relative path trick won't work for base64 blob
        const imgEl = tempCard.querySelector('.post-image-container img');
        if (imgEl) imgEl.src = tempImageUrl;
    }
    container.insertBefore(tempCard, container.firstChild);
    
    textarea.value = '';
    selectedImageFile = null;
    document.getElementById('post-image-input').value = '';
    document.getElementById('image-preview-container').style.display = 'none';

    try {
        let payload = { content };
        if (selectedImageFile || document.getElementById('post-image-input').files[0]) {
            payload = new FormData();
            payload.append('content', content);
            if (document.getElementById('post-image-input').files[0]) {
                payload.append('image', document.getElementById('post-image-input').files[0]);
            } else if (selectedImageFile) {
                payload.append('image', selectedImageFile);
            }
        }
        await API.posts.create(payload);
    } catch (_) {
        // Backend call failed silently (demo mode)
    }

    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Post`;
    showToast('Post shared! ✨', 'success');
});

// ---- Load Suggestions ----
async function loadSuggestions() {
    const list = document.getElementById('suggestions-list');
    try {
        const users = await API.users.suggest();
        list.innerHTML = '';
        if (users.length === 0) {
            list.innerHTML = '<div style="padding: 16px; color: var(--clr-text-muted); font-size: 0.9rem;">No suggestions right now.</div>';
            return;
        }

        users.forEach(u => {
            const avatar = u.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${u.username}`;
            const el = document.createElement('div');
            // We use a div instead of a tag to prevent the button click from navigating
            el.className = 'user-suggestion';
            el.style.cssText = 'cursor: pointer; text-decoration: none; color: inherit; display: flex; align-items: center; gap: 12px; margin-bottom: 16px;';
            el.innerHTML = `
                <img src="${avatar}" class="avatar avatar-sm" alt="${u.username}" width="32" height="32">
                <div class="user-suggestion-info" style="flex:1;">
                    <div class="user-suggestion-name">${u.username}</div>
                    <div class="user-suggestion-handle">@${u.username}</div>
                </div>
                <button class="clay-btn clay-btn-sky clay-btn-sm follow-btn" data-id="${u.id}">Follow</button>
            `;
            
            // Navigate on click, unless clicking the button
            el.addEventListener('click', (e) => {
                if (!e.target.closest('.follow-btn')) {
                    window.location.href = `profile?u=${u.username}`;
                }
            });

            // Follow button logic
            const followBtn = el.querySelector('.follow-btn');
            followBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                followBtn.disabled = true;
                const isFollowing = followBtn.textContent === 'Unfollow';
                try {
                    if (isFollowing) {
                        await API.users.unfollow(u.id);
                        followBtn.textContent = 'Follow';
                        followBtn.classList.remove('clay-btn-ghost');
                    } else {
                        await API.users.follow(u.id);
                        followBtn.textContent = 'Unfollow';
                        followBtn.classList.add('clay-btn-ghost');
                    }
                } catch (err) {
                    showToast('Failed to update follow status', 'error');
                }
                followBtn.disabled = false;
            });

            list.appendChild(el);
        });
    } catch (_) {
        list.innerHTML = '<div style="padding: 16px; color: var(--clr-text-muted); font-size: 0.9rem;">Could not load suggestions.</div>';
    }
}

// ---- Logout ----
document.getElementById('logout-btn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
});

// ---- Load Sidebar Stats ----
async function loadUserStats() {
    try {
        const fullUser = await API.users.me();
        if (fullUser) {
            document.getElementById('sidebar-posts').textContent = fullUser.posts !== undefined ? fullUser.posts : '—';
            document.getElementById('sidebar-followers').textContent = fullUser.followers !== undefined ? fullUser.followers : '—';
            document.getElementById('sidebar-following').textContent = fullUser.following !== undefined ? fullUser.following : '—';
        }
    } catch (err) {
        // Silently fail if stats can't load
    }
}

// ---- Init ----
renderUserInfo(currentUser);
loadPosts();
loadSuggestions();
loadUserStats();
