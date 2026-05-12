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

    // Utility to safely add event listeners
    const safeAddListener = (el, evt, fn) => el?.addEventListener(evt, fn);

    // Toggle password visibility
    const toggleVisibility = (input, toggle) => {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        toggle.innerHTML = type === 'password'
            ? '<i class="fas fa-eye"></i>'
            : '<i class="fas fa-eye-slash"></i>';
    };

    safeAddListener(togglePassword, 'click', () => toggleVisibility(passwordInput, togglePassword));
    safeAddListener(toggleConfirm, 'click', () => toggleVisibility(confirmInput, toggleConfirm));

    // Update password validation checklist
    const validatePassword = () => {
        const v = passwordInput.value;
        lenCheck.classList.toggle('valid', v.length >= 8 && v.length <= 20);
        lenCheck.classList.toggle('invalid', !(v.length >= 8 && v.length <= 20));

        upperCheck.classList.toggle('valid', /[A-Z]/.test(v));
        upperCheck.classList.toggle('invalid', !/[A-Z]/.test(v));

        numCheck.classList.toggle('valid', /[0-9]/.test(v));
        numCheck.classList.toggle('invalid', !/[0-9]/.test(v));

        spaceCheck.classList.toggle('valid', !/\s/.test(v));
        spaceCheck.classList.toggle('invalid', /\s/.test(v));

        // Update text markers
        lenCheck.textContent = (v.length >= 8 && v.length <= 20 ? '✓ ' : '✕ ') + '8-20 characters';
        upperCheck.textContent = (/[A-Z]/.test(v) ? '✓ ' : '✕ ') + 'At least 1 uppercase letter';
        numCheck.textContent = (/[0-9]/.test(v) ? '✓ ' : '✕ ') + 'At least 1 number';
        spaceCheck.textContent = (!/\s/.test(v) ? '✓ ' : '✕ ') + 'No spaces';
    };

    safeAddListener(passwordInput, 'input', validatePassword);
    validatePassword(); // initialize checklist

    // Form submission
    safeAddListener(signupForm, 'submit', (e) => {
        e.preventDefault();

        if (!termsCheckbox.checked) {
            alert('Please agree to the Terms & Conditions');
            return;
        }

        validatePassword();

        const v = passwordInput.value;
        const checksOk = v.length >= 8 && v.length <= 20 && /[A-Z]/.test(v) && /[0-9]/.test(v) && !/\s/.test(v);
        if (!checksOk) {
            alert('Password does not meet the requirements.');
            return;
        }

        if (passwordInput.value !== confirmInput.value) {
            alert('Passwords do not match.');
            return;
        }

        const name = signupForm.querySelector('input[type="text"]')?.value || '';
        console.log('Account created for:', name);

        window.location.href = 'goals.html';
    });
});