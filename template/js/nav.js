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
