document.addEventListener('DOMContentLoaded', () => {

    const signupForm = document.getElementById('signupForm');

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');

    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');

    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirm = document.getElementById('toggleConfirmPassword');

    const termsCheckbox = document.getElementById('terms');

    const checks = Array.from(
        document.querySelectorAll('.validation-list p')
    );

    const [
        lenCheck,
        upperCheck,
        lowerCheck,
        numCheck,
        spaceCheck
    ] = checks;

    if (!signupForm) return;


    /* =========================================================
       TOGGLE PASSWORD VISIBILITY
    ========================================================= */

    const toggleVisibility = (input, toggle) => {

        const type =
            input.type === 'password'
                ? 'text'
                : 'password';

        input.type = type;

        toggle.innerHTML =
            type === 'password'
                ? '<i class="fas fa-eye"></i>'
                : '<i class="fas fa-eye-slash"></i>';
    };

    togglePassword?.addEventListener('click', () => {
        toggleVisibility(passwordInput, togglePassword);
    });

    toggleConfirm?.addEventListener('click', () => {
        toggleVisibility(confirmInput, toggleConfirm);
    });


    /* =========================================================
       PASSWORD VALIDATION
    ========================================================= */

    const validatePassword = () => {

        const v = passwordInput.value;

        const lenOk =
            v.length >= 8 &&
            v.length <= 20;

        const upperOk =
            /[A-Z]/.test(v);

        const lowerOk =
            /[a-z]/.test(v);

        const numOk =
            /[0-9]/.test(v);

        const spaceOk =
            !/\s/.test(v);


        // Length
        lenCheck.classList.toggle('valid', lenOk);
        lenCheck.classList.toggle('invalid', !lenOk);

        lenCheck.textContent =
            (lenOk ? '✓ ' : '✕ ') +
            '8-20 characters';


        // Uppercase
        upperCheck.classList.toggle('valid', upperOk);
        upperCheck.classList.toggle('invalid', !upperOk);

        upperCheck.textContent =
            (upperOk ? '✓ ' : '✕ ') +
            'At least 1 uppercase letter';


        // Lowercase
        lowerCheck.classList.toggle('valid', lowerOk);
        lowerCheck.classList.toggle('invalid', !lowerOk);

        lowerCheck.textContent =
            (lowerOk ? '✓ ' : '✕ ') +
            'At least 1 lowercase letter';


        // Number
        numCheck.classList.toggle('valid', numOk);
        numCheck.classList.toggle('invalid', !numOk);

        numCheck.textContent =
            (numOk ? '✓ ' : '✕ ') +
            'At least 1 number';


        // Spaces
        spaceCheck.classList.toggle('valid', spaceOk);
        spaceCheck.classList.toggle('invalid', !spaceOk);

        spaceCheck.textContent =
            (spaceOk ? '✓ ' : '✕ ') +
            'No spaces';


        return (
            lenOk &&
            upperOk &&
            lowerOk &&
            numOk &&
            spaceOk
        );
    };

    passwordInput?.addEventListener(
        'input',
        validatePassword
    );


    /* =========================================================
       FORM SUBMIT
    ========================================================= */

    signupForm.addEventListener('submit', async (e) => {

        e.preventDefault();


        /* =========================
           GET VALUES
        ========================= */

        const username =
            usernameInput.value.trim();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmInput.value;


        /* =========================
           TERMS CHECK
        ========================= */

        if (!termsCheckbox.checked) {

            alert(
                'Please agree to the Terms & Conditions'
            );

            return;
        }


        /* =========================
           NAME VALIDATION
        ========================= */

        const nameRegex =
            /^[A-Za-z\s]+$/;

        if (!username) {

            alert('Please enter your name');

            return;
        }

        if (username.length < 2) {

            alert(
                'Name must be at least 2 letters'
            );

            return;
        }

        if (!nameRegex.test(username)) {

            alert(
                'Name must contain letters only'
            );

            return;
        }


        /* =========================
           EMAIL VALIDATION
        ========================= */

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.(com|net|org|edu|gov|ph|co|io)$/i;

        if (!emailRegex.test(email)) {

            alert(
                'Please enter a valid email address'
            );

            return;
        }


        /* =========================
           PASSWORD VALIDATION
        ========================= */

        const passwordValid =
            validatePassword();

        if (!passwordValid) {

            alert(
                'Password does not meet requirements'
            );

            return;
        }


        /* =========================
           CONFIRM PASSWORD
        ========================= */

        if (password !== confirmPassword) {

            alert('Passwords do not match');

            return;
        }


        /* =========================================================
           SEND TO BACKEND
        ========================================================= */

        try {

            const res = await fetch(
                `http://${window.location.hostname}:5001/api/signup`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        username,
                        email,
                        password,
                        termsAccepted:
                            termsCheckbox.checked
                    })
                }
            );

            const data = await res.json();

            console.log(
                'Server response:',
                data
            );


            /* =========================
               SUCCESS
            ========================= */

            if (data.success) {

                // Save tokens
                if (data.access_token) {

                    localStorage.setItem(
                        'access_token',
                        data.access_token
                    );

                    localStorage.setItem(
                        'refresh_token',
                        data.refresh_token
                    );
                }

                else if (data.token) {

                    localStorage.setItem(
                        'access_token',
                        data.token
                    );
                }

                // SAVE USER
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                alert(
                    'Account created successfully!'
                );

                // Redirect
                window.location.replace(
                    'goals.html'
                );
            }


            /* =========================
               FAILED
            ========================= */

            else {

                alert(
                    data.error ||
                    'Signup failed'
                );
            }

        }

        catch (err) {

            console.error(err);

            alert(
                'Server error. Please try again.'
            );
        }

    });

});