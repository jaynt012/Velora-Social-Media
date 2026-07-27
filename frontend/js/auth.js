/**
 * Velora Auth UI Logic
 * Handles signup & login form interactions.
 */

// ---- Toast Utility ----
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = `toast ${type}`; }, 3500);
}

// ---- Password Toggle ----
function setupPasswordToggle(btnId, inputId, iconId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
        const input = document.getElementById(inputId);
        const icon  = document.getElementById(iconId);
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.innerHTML = isPassword
            ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
            : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    });
}

// ---- Field Error Helpers ----
function setError(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? 'block' : 'none';
}

function clearErrors(...ids) {
    ids.forEach(id => setError(id, ''));
}

// ---- Redirect if already logged in ----
if (isLoggedIn()) {
    const path = window.location.pathname;
    if (path.includes('login') || path.includes('signup')) {
        window.location.href = 'feed.html';
    }
}

// ---- Signup Logic ----
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    setupPasswordToggle('toggle-signup-pwd', 'signup-password', 'eye-icon-signup');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors('username-error', 'email-error', 'password-error', 'signup-global-error');

        const username = document.getElementById('signup-username').value.trim();
        const email    = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;

        // Client-side validation
        let valid = true;
        if (!username || username.length < 3) {
            setError('username-error', 'Username must be at least 3 characters.');
            valid = false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('email-error', 'Please enter a valid email address.');
            valid = false;
        }
        if (!password || password.length < 8) {
            setError('password-error', 'Password must be at least 8 characters.');
            valid = false;
        }
        if (!valid) return;

        // Submit
        const btn  = document.getElementById('signup-submit-btn');
        const text = document.getElementById('signup-btn-text');
        const spin = document.getElementById('signup-spinner');
        btn.disabled = true;
        text.textContent = 'Creating account…';
        spin.style.display = 'inline-block';

        try {
            await API.auth.register({ username, email, password });
            // Auto-login after register
            const data = await API.auth.login({ email, password });
            saveSession(data.token, data.user);
            showToast('Welcome to Velora! 🎉', 'success');
            setTimeout(() => { window.location.href = 'feed.html'; }, 1000);
        } catch (err) {
            setError('signup-global-error', err.message || 'Something went wrong. Please try again.');
            btn.disabled = false;
            text.textContent = 'Create Account';
            spin.style.display = 'none';
        }
    });
}

// ---- Login Logic ----
const loginForm = document.getElementById('login-form');
if (loginForm) {
    setupPasswordToggle('toggle-login-pwd', 'login-password', 'eye-icon-login');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors('login-email-error', 'login-password-error', 'login-global-error');

        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        let valid = true;
        if (!email) { setError('login-email-error', 'Email is required.'); valid = false; }
        if (!password) { setError('login-password-error', 'Password is required.'); valid = false; }
        if (!valid) return;

        const btn  = document.getElementById('login-submit-btn');
        const text = document.getElementById('login-btn-text');
        const spin = document.getElementById('login-spinner');
        btn.disabled = true;
        text.textContent = 'Signing in…';
        spin.style.display = 'inline-block';

        try {
            const data = await API.auth.login({ email, password });
            saveSession(data.token, data.user);
            showToast('Welcome back! 👋', 'success');
            setTimeout(() => { window.location.href = 'feed.html'; }, 900);
        } catch (err) {
            setError('login-global-error', err.message || 'Invalid email or password.');
            btn.disabled = false;
            text.textContent = 'Sign In';
            spin.style.display = 'none';
        }
    });
}
