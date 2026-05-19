document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    // Password toggle (safe)
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
            const res = await fetch('http://localhost:5001/api/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            console.log("Login response:", data);

            if (data.success) {
                // store user (IMPORTANT FOR NEXT STEP)
                localStorage.setItem("user", JSON.stringify(data.user));

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