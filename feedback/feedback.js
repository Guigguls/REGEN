document.addEventListener("DOMContentLoaded", () => {
  const stars = document.querySelectorAll(".stars i");
  let rating = 0;

  stars.forEach(star => {
    star.addEventListener("click", () => {
      rating = star.getAttribute("data-value");

      // Reset all stars
      stars.forEach(s => s.classList.remove("active"));
      
      // Highlight selected stars
      for (let i = 0; i < rating; i++) {
        stars[i].classList.add("active");
      }
    });
  });

  const form = document.querySelector(".feedback-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const comment = document.getElementById("feedbackComment").value;
    alert(`Feedback submitted!\nRating: ${rating} stars\nComment: ${comment}`);
    // Later: send rating + comment to backend
  });
});
