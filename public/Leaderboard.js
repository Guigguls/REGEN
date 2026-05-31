// leaderboard.js
// Depends on: supabaseClient from auth.js, tokens stored in localStorage

document.addEventListener('DOMContentLoaded', async () => {

    // ── helpers ───────────────────────────────────────────────────────────────

    function formatPoints(n) {
        return Number(n || 0).toLocaleString();
    }

    function rankIcon(rank) {
        if (rank === 1) return `<div class="lb-badge gold-icon"><i class="fa-solid fa-trophy"></i></div>`;
        if (rank === 2) return `<div class="lb-badge silver-icon"><i class="fa-solid fa-medal"></i></div>`;
        if (rank === 3) return `<div class="lb-badge bronze-icon"><i class="fa-solid fa-award"></i></div>`;
        return `<div class="lb-rank-number">#${rank}</div>`;
    }

    function escapeHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function buildItem(user, rank, isCurrentUser) {
        const highlight = isCurrentUser ? ' lb-item--me' : '';
        return `
        <div class="lb-item${highlight}">
          <div class="lb-left">
            ${rankIcon(rank)}
            <div class="lb-avatar"><i class="fa-regular fa-user"></i></div>
            <div class="lb-name">${escapeHtml(user.username || 'Unknown')}</div>
          </div>
          <div class="lb-points">
            <div class="lb-points-value">${formatPoints(user.total_points)}</div>
            <div class="lb-points-label">points</div>
          </div>
        </div>`;
    }

    // ── elements ──────────────────────────────────────────────────────────────

    const currentId = localStorage.getItem('user_id') ?? null;
    const listEl    = document.getElementById('lb-list');
    const rankEl    = document.getElementById('lb-your-rank');
    const pointsEl  = document.getElementById('lb-your-points');

    // ── fetch ─────────────────────────────────────────────────────────────────

    try {
        // Restore session so RLS recognises the logged-in user
        const accessToken  = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (accessToken && refreshToken) {
            await supabaseClient.auth.setSession({
                access_token:  accessToken,
                refresh_token: refreshToken
            });
        }

        const { data, error } = await supabaseClient
            .from('leaderboard_view')
            .select('id, username, total_points')
            .order('total_points', { ascending: false });

        if (error) throw error;

        const allUsers = data || [];

        // Current user's rank & points
        const myIndex = allUsers.findIndex(u => u.id === currentId);
        if (myIndex !== -1) {
            rankEl.textContent   = `#${myIndex + 1}`;
            pointsEl.textContent = formatPoints(allUsers[myIndex].total_points);
        } else {
            rankEl.textContent   = '—';
            pointsEl.textContent = '—';
        }

        // Render all rows — scrolling handles overflow
        listEl.innerHTML = allUsers
            .map((user, i) => buildItem(user, i + 1, user.id === currentId))
            .join('');

    } catch (err) {
        console.error('Leaderboard fetch error:', err);
        listEl.innerHTML = '<div class="lb-loading lb-error">Could not load leaderboard.</div>';
    }
});