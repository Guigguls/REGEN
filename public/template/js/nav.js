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
