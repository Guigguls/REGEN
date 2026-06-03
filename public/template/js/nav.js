/* --- Homepage: greeting name, streak, points, carbon budget --- */
document.addEventListener("DOMContentLoaded", async () => {
  await requireAuth();
  
  const nameEl   = document.getElementById("greetingName");
  const carbonEl = document.getElementById("home-display-pct");

  if (!nameEl && !carbonEl) return;

  const token = localStorage.getItem("access_token");
  const user  = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) return;

  const BASE_URL = `https://${window.location.hostname}:5000`;

  /* -- Greeting name, points, streak -- */
  if (nameEl && user.email) {
    try {
      const res  = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();

      if (data.success && data.user) {
        nameEl.textContent = data.user.username || user.email.split("@")[0];

        document.querySelectorAll(".progress-item").forEach(item => {
          const label    = item.querySelector(".progress-label")?.textContent?.trim();
          const numberEl = item.querySelector(".progress-number");
          if (!numberEl) return;

          if (label === "Points")    numberEl.textContent = data.user.total_points ?? 0;
        });
      }
    } catch (err) {
      console.error("Home profile fetch error:", err);
      nameEl.textContent = user.email.split("@")[0];
    }
  }

  /* -- Streak -- */
  try {
    const res  = await fetch(`${BASE_URL}/api/streak/check`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    document.querySelectorAll(".progress-item").forEach(item => {
      const label    = item.querySelector(".progress-label")?.textContent?.trim();
      const numberEl = item.querySelector(".progress-number");
      if (!numberEl) return;

      if (label === "Day Streak") numberEl.textContent = data.streak ?? 0;
    });
  } catch (err) {
    console.error("Home streak fetch error:", err);
  }

  /* -- Carbon budget -- */
  if (carbonEl) {
    try {
      const res = await fetch(`/api/stats?range=monthly`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      const stats = await res.json();

      const BUDGET = 126.0;
      const generated = stats.total_carbon_generated || 0;
      const saved = stats.total_carbon_saved || 0;
      const netEmissions = Math.max(generated - saved, 0);
      carbonEl.textContent = Math.max(100 - Math.round((netEmissions / BUDGET) * 100), 0) + "%";
    } catch (err) {
      console.error("Home carbon fetch error:", err);
      carbonEl.textContent = "--%";
    }
  }
});

function setActive(button, targetPage) {
  document.querySelectorAll('.nav-btn, .scan-btn').forEach(btn => btn.classList.remove('active'));

  if (!button.classList.contains('menu-btn')) {
    button.classList.add('active');
  }

  const img = button.querySelector('img');
  if (img && !button.classList.contains('menu-btn')) {
    localStorage.setItem('activeNav', img.alt);
  }

  if (targetPage) {
    window.location.href = targetPage;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-btn, .scan-btn').forEach(btn => {
    const targetPage = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if (!targetPage) return;
    const targetFile = targetPage.split('/').pop();
    const currentFile = currentPath.split('/').pop();
    if (targetFile === currentFile) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Sidebar toggle                                                      */
/* ------------------------------------------------------------------ */
const menuBtn  = document.querySelector('.menu-btn');
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('overlay');
const closeBtn = document.getElementById('closeSidebar');

if (menuBtn && sidebar && overlay && closeBtn) {
  menuBtn.addEventListener('click',  () => { sidebar.classList.add('active');    overlay.classList.add('active');    });
  closeBtn.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
  overlay.addEventListener('click',  () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
}

/* ------------------------------------------------------------------ */
/*  Reuse ideas shuffle (home page only)                               */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.reuse-name')) return;

  fetch('reuseIdeas.json')
    .then(res => res.json())
    .then(data => {
      const idea = data[Math.floor(Math.random() * data.length)];

      const nameEl  = document.querySelector('.reuse-name');
      const badgeEl = document.querySelector('.reuse-badge');
      const listEl  = document.querySelector('.materials-list');
      const descEl  = document.querySelector('.reuse-description');
      const imgEl   = document.querySelector('.reuse-image');

      if (nameEl)  nameEl.textContent  = idea.name;
      if (badgeEl) badgeEl.textContent = idea.difficulty;
      if (descEl)  descEl.textContent  = idea.description;

      if (listEl && idea.materials) {
        listEl.innerHTML = idea.materials
          .map(m => `<span class="material-bubble">${m}</span>`)
          .join('');
      }

      if (imgEl && idea.image) imgEl.src = idea.image;
    })
    .catch(err => console.error('Error loading reuse ideas:', err));
});

/* ------------------------------------------------------------------ */
/*  Homepage data: greeting, streak, points, carbon budget             */
/*  Reads from the `users` table (matches your app.py / server.js)     */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', async () => {
  const nameEl   = document.getElementById('greetingName');
  const carbonEl = document.getElementById('home-display-pct');

  // Not on a page that needs any of this — bail early
  if (!nameEl && !carbonEl) return;

  // ── 1. Get the current session ──────────────────────────────────
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user'));
  if (!token || !user) return;

  const userId = user.id;

  // ── 2. Fetch username, total_points, streak_count from `users` ──
  //       Column names match exactly what app.py reads/writes
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('username, total_points, streak_count')
    .eq('id', userId)
    .single();

  if (!userError && userData) {
    // Greeting
    if (nameEl) {
      nameEl.textContent = userData.username || session.user.email.split('@')[0];
    }

    // Streak + Points cards — matched by their visible label text
    document.querySelectorAll('.progress-item').forEach(item => {
      const label    = item.querySelector('.progress-label')?.textContent?.trim();
      const numberEl = item.querySelector('.progress-number');
      if (!numberEl) return;

      if (label === 'Day Streak') numberEl.textContent = userData.streak_count  ?? 0;
      if (label === 'Points')     numberEl.textContent = userData.total_points  ?? 0;
    });

  } else {
    // Fallback: at least show something in the greeting
    if (nameEl) nameEl.textContent = session.user.email.split('@')[0];
    console.warn('Could not load user data:', userError?.message);
  }

  // ── 3. Carbon budget — reads from `scan_results` ────────────────
  //       carbon_generated column, same table app.py writes to
  if (carbonEl) {
    const MONTHLY_BUDGET_KG = 40.0;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: scans, error: scanError } = await supabase
      .from('scan_results')
      .select('carbon_generated, carbon_saved')
      .eq('user_id', userId)
      .gte('created_at', oneMonthAgo.toISOString());

    if (!scanError && scans) {
      const generated = scans.reduce((sum, row) => sum + (parseFloat(row.carbon_generated) || 0), 0);
      const saved = scans.reduce((sum, row) => sum + (parseFloat(row.carbon_saved) || 0), 0);
      const netEmissions = Math.max(generated - saved, 0);
      carbonEl.textContent = Math.max(100 - Math.round((netEmissions / MONTHLY_BUDGET_KG) * 100), 0) + '%';
    } else {
      carbonEl.textContent = '--%';
      console.warn('Could not load carbon data:', scanError?.message);
    }
  }
});

/* ------------------------------------------------------------------ */
/*  Nav avatar — runs on every page with id="navAvatar"               */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', async () => {
  const navAvatar = document.getElementById('navAvatar');
  if (!navAvatar) return;

  // 1. Show cached image immediately (no flicker)
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const cachedImage = localStorage.getItem('profileImage');
  const cachedOwner = localStorage.getItem('profileImageOwner');
  if (cachedImage && cachedOwner === session.user.id) {
    navAvatar.src = cachedImage;
  }

  // 2. Fetch latest from API and update
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const email = user?.email || session.user.email;
    if (!email) return;

    const res  = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (data.success && data.user?.avatar_url) {
      navAvatar.src = data.user.avatar_url;
      // Refresh cache
      localStorage.setItem('profileImage', data.user.avatar_url);
      localStorage.setItem('profileImageOwner', session.user.id);
    }
  } catch (err) {
    console.error('Nav avatar load error:', err);
  }
});