document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    // Password Toggle Logic
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.innerHTML = type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
    });

    // Form Submission Logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        const email = document.getElementById('email').value;
        const password = passwordInput.value;

        console.log("Logging in...", email);
        
        // Redirect to goals.html after login
        window.location.href = "goals.html";
    });
});