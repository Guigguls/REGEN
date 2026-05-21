document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirm = document.getElementById('toggleConfirmPassword');
    const termsCheckbox = document.getElementById('terms');

    const checks = Array.from(document.querySelectorAll('.validation-list p'));
    const [lenCheck, upperCheck, numCheck, spaceCheck] = checks;

    if (!signupForm) return;

    // Toggle password visibility
    const toggleVisibility = (input, toggle) => {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        toggle.innerHTML = type === 'password'
            ? '<i class="fas fa-eye"></i>'
            : '<i class="fas fa-eye-slash"></i>';
    };

    togglePassword?.addEventListener('click', () =>
        toggleVisibility(passwordInput, togglePassword)
    );

    toggleConfirm?.addEventListener('click', () =>
        toggleVisibility(confirmInput, toggleConfirm)
    );

    // Password validation
    const validatePassword = () => {
        const v = passwordInput.value;

        const lenOk = v.length >= 8 && v.length <= 20;
        const upperOk = /[A-Z]/.test(v);
        const numOk = /[0-9]/.test(v);
        const spaceOk = !/\s/.test(v);

        lenCheck.classList.toggle('valid', lenOk);
        lenCheck.classList.toggle('invalid', !lenOk);
        lenCheck.textContent = (lenOk ? '✓ ' : '✕ ') + '8-20 characters';

        upperCheck.classList.toggle('valid', upperOk);
        upperCheck.classList.toggle('invalid', !upperOk);
        upperCheck.textContent = (upperOk ? '✓ ' : '✕ ') + 'At least 1 uppercase letter';

        numCheck.classList.toggle('valid', numOk);
        numCheck.classList.toggle('invalid', !numOk);
        numCheck.textContent = (numOk ? '✓ ' : '✕ ') + 'At least 1 number';

        spaceCheck.classList.toggle('valid', spaceOk);
        spaceCheck.classList.toggle('invalid', !spaceOk);
        spaceCheck.textContent = (spaceOk ? '✓ ' : '✕ ') + 'No spaces';

        return lenOk && upperOk && numOk && spaceOk;
    };

    passwordInput?.addEventListener('input', validatePassword);

    // Submit form
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!termsCheckbox.checked) {
            alert('Please agree to the Terms & Conditions');
            return;
        }

        const passwordValid = validatePassword();

        if (!passwordValid) {
            alert('Password does not meet requirements');
            return;
        }

        if (passwordInput.value !== confirmInput.value) {
            alert('Passwords do not match');
            return;
        }

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = passwordInput.value;

        try {
            // Dynamic fix so signup works on your phone and other devices
            const res = await fetch(`http://${window.location.hostname}:5001/api/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    termsAccepted: termsCheckbox.checked
                })
            });

            const data = await res.json();
            console.log('Server response:', data);

            if (data.success) {
                // 🛠️ FIX: Save the session credentials right here!
                // (Matches your backend token property names, e.g., data.access_token or data.token)
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                } else if (data.token) {
                    // Just in case your backend payload sets it to 'token' instead of 'access_token'
                    localStorage.setItem('access_token', data.token);
                }

                // Clean mobile redirect
                window.location.replace('goals.html');
            } else {
                alert(data.error || 'Signup failed');
            }

        } catch (err) {
            console.error(err);
            alert('Server error. Please try again.');
        }
    });
});