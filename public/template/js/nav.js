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
  const active = localStorage.getItem('activeNav');
  if (active) {
    document.querySelectorAll('.nav-btn img, .scan-btn img').forEach(img => {
      if (img.alt === active) {
        img.parentElement.classList.add('active');
      }
    });
  }
});


/* --- Sidebar toggle code --- */
const menuBtn = document.querySelector('.menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeSidebar');

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

document.addEventListener("DOMContentLoaded", () => {
  fetch("assets/data/reuseIdeas.json")
    .then(res => res.json())
    .then(data => {
      function showRandomIdea() {
        const randomIndex = Math.floor(Math.random() * data.length);
        const idea = data[randomIndex];

        document.querySelector(".reuse-name").textContent = idea.name;
        document.querySelector(".reuse-badge").textContent = idea.difficulty;
        document.querySelector(".materials-list").innerHTML =
          idea.materials.map(m => `<span class="material-bubble">${m}</span>`).join("");
        document.querySelector(".reuse-description").textContent = idea.description;
        document.querySelector(".reuse-image").src = idea.image;
      }

      // show one on load
      showRandomIdea();

      // auto shuffle every 10s
      setInterval(showRandomIdea, 10000);
    });

});

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
  const stats = await fetchHomeStats();
  const budget = HOME_BUDGETS.weekly;
  const generated = (stats && typeof stats.total_carbon_generated === 'number') ? stats.total_carbon_generated : 0;
  const budgetUsedPct = budget > 0 ? Math.min(Math.round((generated / budget) * 100), 100) : 0;
  const budgetLeftPct = Math.max(100 - budgetUsedPct, 0);

  document.getElementById('home-display-pct').innerText = budgetLeftPct + '%';
}

document.addEventListener("DOMContentLoaded", updateHomepage);

