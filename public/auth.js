const SUPABASE_URL = 'https://zgbqvtfoaoeejlhktfuj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nB1AnIKvMyE1wM4JC-0C7w_UlcJSP28';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sign up
async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

// Sign in
async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // Save token for backend calls
  sessionStorage.setItem('access_token', data.session.access_token);
  sessionStorage.setItem('user_id', data.user.id);
  return data;
}

// Sign out
async function signOut() {
  await supabaseClient.auth.signOut();
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('user_id');
  window.location.href = 'login.html';
}

// Get current session
async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

// Redirect to login if not logged in
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
  }
  return session;
}