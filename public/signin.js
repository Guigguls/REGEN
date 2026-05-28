document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    // Password toggle
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;

            togglePassword.innerHTML =
                type === 'password'
                    ? '<i class="fa-solid fa-eye"></i>'
                    : '<i class="fa-solid fa-eye-slash"></i>';
        });
    }

    // LOGIN SUBMIT
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = passwordInput.value;

        try {
            const BASE_URL = window.location.hostname === 'localhost'
            ? 'https://localhost:5000'
            : `https://${window.location.hostname}:5000`;

            const res = await fetch(`${BASE_URL}/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            console.log("Login response:", data);

            if (data.success) {
                // Keep existing user save
                localStorage.setItem("user", JSON.stringify(data.user));

                // Save token so Flask API calls work
                localStorage.setItem("access_token", data.session.access_token);
                localStorage.setItem("refresh_token", data.session.refresh_token);  // ← confirm this is there
                localStorage.setItem("user_id", data.user.id);

                window.location.href = "goals.html";
            } else {
                alert(data.error || "Invalid login");
            }

        } catch (err) {
            console.error("LOGIN ERROR:", err);
            alert("Server error. Try again.");
        }
    });
});