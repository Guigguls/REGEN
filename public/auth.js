const SUPABASE_URL = 'https://zgbqvtfoaoeejlhktfuj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nB1AnIKvMyE1wM4JC-0C7w_UlcJSP28';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // ✅ FIX: use localStorage and save refresh token too
  localStorage.setItem('access_token', data.session.access_token);
  localStorage.setItem('refresh_token', data.session.refresh_token);
  localStorage.setItem('user_id', data.user.id);
  return data;
}

async function getValidToken() {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!accessToken || !refreshToken) {
        window.location.replace('signin.html');
        return null;
    }

    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();

    if (!isExpired) {
        return accessToken;
    }

    console.log("🔄 Token expired, refreshing...");

    const BASE_URL = window.location.hostname === 'localhost'
        ? 'https://localhost:5000'
        : `https://${window.location.hostname}:5000`;

    const response = await fetch(`${BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
        console.error("❌ Refresh failed, redirecting to login");
        alert('Your session has expired. Please sign in again.');
        window.location.replace('signin.html');
        return null;
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    console.log("✅ Token refreshed");
    return data.access_token;
}

async function signOut() {
  await supabaseClient.auth.signOut();
  localStorage.clear();
  window.location.href = 'signin.html';
}

async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

// ✅ FIX: try to refresh before redirecting, show message if it fails
async function requireAuth() {
  const accessToken = localStorage.getItem('access_token');
  const storedRefresh = localStorage.getItem('refresh_token');

  if (!accessToken || !storedRefresh) {
    window.location.href = 'signin.html';
    return null;
  }

  const session = await getSession();
  if (session) return session;

  try {
    const BASE_URL = window.location.hostname === 'localhost'
      ? 'https://localhost:5000'
      : `https://${window.location.hostname}:5000`;

    const response = await fetch(`${BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: storedRefresh })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return data;
    }
  } catch (err) {
    console.error('Auth refresh error:', err);
  }

  alert('Your session has expired. Please sign in again.');
  window.location.href = 'signin.html';
  return null;
}