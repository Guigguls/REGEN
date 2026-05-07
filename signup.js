document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Check if terms are checked
            const terms = document.getElementById('terms').checked;
            
            if(!terms) {
                alert("Please agree to the Terms & Conditions");
                return;
            }

            const name = signupForm.querySelector('input[type="text"]').value;
            console.log("Account created for:", name);
            
            window.location.href = "goals.html";
        });
    }
});