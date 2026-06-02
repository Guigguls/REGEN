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
  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll('.nav-btn, .scan-btn').forEach(btn => {
    const targetPage = btn.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
    if (targetPage === currentPage) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
});

/* --- Sidebar toggle code --- */
const menuBtn = document.querySelector('.menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeSidebar');

if (menuBtn && sidebar && overlay && closeBtn) {
  menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
  });

  closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });
}

/* --- Fixed Reuse Ideas Shuffling Path --- */
/* --- Fixed Reuse Ideas Shuffling Path (Change only on Page Load/Refresh) --- */
document.addEventListener("DOMContentLoaded", () => {
  // Only execute if the target elements actually exist on the current page view
  if (document.querySelector(".reuse-name")) {
    fetch("reuseIdeas.json")
      .then(res => res.json())
      .then(data => {
        function showRandomIdea() {
          const randomIndex = Math.floor(Math.random() * data.length);
          const idea = data[randomIndex];

          const nameEl = document.querySelector(".reuse-name");
          const badgeEl = document.querySelector(".reuse-badge");
          const listEl = document.querySelector(".materials-list");
          const descEl = document.querySelector(".reuse-description");
          const imgEl = document.querySelector(".reuse-image");

          if (nameEl) nameEl.textContent = idea.name;
          if (badgeEl) badgeEl.textContent = idea.difficulty;
          if (descEl) descEl.textContent = idea.description;
          
          if (listEl && idea.materials) {
            listEl.innerHTML = idea.materials
              .map(m => `<span class="material-bubble">${m}</span>`)
              .join("");
          }

          if (imgEl && idea.image) {
            imgEl.src = idea.image;
          }
        }

        // Show one random idea immediately when entering or refreshing the page
        showRandomIdea();
        
        // NOTE: The 10-second automatic interval timer has been completely removed!
      })
      .catch(err => console.error("Error loading reuse ideas:", err));
  }
});

/* --- Homepage Statistics Fetching --- */
const HOME_BUDGETS = { weekly: 10.0 };
const homeToken = localStorage.getItem('access_token');

async function fetchHomeStats() {
  try {
    if (!homeToken) return null;
    const response = await fetch(`/api/stats?range=weekly`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${homeToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Homepage stats fetch failed:", err);
    return null;
  }
}

async function updateHomepage() {
  if (!document.getElementById('home-display-pct')) return;

  const stats = await fetchHomeStats();
  const budget = HOME_BUDGETS.weekly;
  const generated = (stats && typeof stats.total_carbon_generated === 'number') ? stats.total_carbon_generated : 0;
  const budgetUsedPct = budget > 0 ? Math.min(Math.round((generated / budget) * 100), 100) : 0;
  const budgetLeftPct = Math.max(100 - budgetUsedPct, 0);

  document.getElementById('home-display-pct').innerText = budgetLeftPct + '%';
}

document.addEventListener("DOMContentLoaded", updateHomepage);

/* --- User Authentication & Profile Greetings --- */
document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const nameEl = document.getElementById("greetingName");

  if (!user || !nameEl) {
    console.log("No user found in localStorage or element missing");
    return;
  }

  nameEl.textContent = user.email.split("@")[0];

  try {
    const currentHostname = window.location.hostname;
    const backendUrl = `http://` + currentHostname + `:5001/api/profile?email=` + user.email;

    console.log("Fetching profile from:", backendUrl);

    const res = await fetch(backendUrl);
    const data = await res.json();

    console.log("PROFILE DATA RECEIVED:", data);

    if (data.success && data.user) {
      nameEl.textContent = data.user.username || user.email.split("@")[0];
    }
  } catch (err) {
    console.error("PROFILE FETCH ERROR:", err);
  }
});