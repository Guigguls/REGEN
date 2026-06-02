// Toggle FAQ answers
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const answer = button.nextElementSibling;
    const isOpen = answer.style.display === 'block';

    // toggle answer visibility
    answer.style.display = isOpen ? 'none' : 'block';

    // toggle active class for arrow rotation
    button.classList.toggle('active', !isOpen);
  });
});

// Simple search filter
const searchInput = document.querySelector('.faq-input');
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question').textContent.toLowerCase();
    item.style.display = question.includes(query) ? 'block' : 'none';
  });
});

function goBack() {
  window.history.back();
}
