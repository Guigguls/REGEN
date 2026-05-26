document.addEventListener("DOMContentLoaded", async () => {

    /* =========================
       LOAD USER (EMAIL + NAME)
    ========================= */

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        console.log("No user found in localStorage");
        return;
    }

    const emailEl = document.getElementById("profileEmail");
    const nameEl = document.getElementById("profileName");

    // EMAIL from localStorage (Always works instantly)
    if (emailEl) {
        emailEl.textContent = user.email;
    }

    // USERNAME + EMAIL from Supabase DB (Dynamically switches between localhost and phone Wi-Fi IP)
    if (nameEl && emailEl) {
        try {
            // Automatically detects if you're accessing via 'localhost' or a Wi-Fi IP address
            const currentHostname = window.location.hostname;
            const backendUrl = `http://${currentHostname}:5001/api/profile?email=${user.email}`;

            console.log("Fetching profile from:", backendUrl);

            const res = await fetch(backendUrl);
            const data = await res.json();

            console.log("PROFILE DATA RECEIVED:", data);

            if (data.success) {
                nameEl.textContent = data.user.username || "No Username";
                emailEl.textContent = data.user.email || "No Email";
            } else {
                console.log("Backend error details:", data.error);
                nameEl.textContent = "No Username";
            }

        } catch (err) {
            console.error("PROFILE FETCH ERROR (Server might be unreachable from this device):", err);
            nameEl.textContent = "No Username";
        }
    }

    /* =========================
       IMAGE ELEMENTS
    ========================= */

    const uploadInput = document.getElementById('profileUpload');
    const profileImage = document.getElementById('profileImage');
    const placeholder = document.getElementById('avatarPlaceholder');

    const imageModal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    const closeModal = document.querySelector(".close-modal");

    /* =========================
       LOAD SAVED IMAGE
    ========================= */

    const savedImage = localStorage.getItem("profileImage");

    if (savedImage && profileImage) {
        profileImage.src = savedImage;
        profileImage.style.display = "block";
        if (placeholder) placeholder.style.display = "none";
    }

    /* =========================
       UPLOAD IMAGE
    ========================= */

    if (uploadInput && profileImage) {
        uploadInput.addEventListener('change', function () {

            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = function (e) {
                const imageData = e.target.result;

                profileImage.src = imageData;
                profileImage.style.display = 'block';

                if (placeholder) {
                    placeholder.style.display = 'none';
                }

                localStorage.setItem('profileImage', imageData);
            };

            reader.readAsDataURL(file);
        });
    }

    /* =========================
       IMAGE MODAL
    ========================= */

    if (profileImage && imageModal && modalImage) {
        profileImage.addEventListener("click", () => {
            if (!profileImage.src) return;

            modalImage.src = profileImage.src;
            imageModal.style.display = "flex";
        });
    }

    if (closeModal && imageModal) {
        closeModal.addEventListener("click", () => {
            imageModal.style.display = "none";
        });
    }

    if (imageModal) {
        imageModal.addEventListener("click", (e) => {
            if (e.target === imageModal) {
                imageModal.style.display = "none";
            }
        });
    }

    /* =========================
       AGE CALCULATION
    ========================= */

    const dobInput = document.getElementById("dob");
    const ageInput = document.getElementById("age");

    if (dobInput && ageInput) {

        dobInput.addEventListener("change", () => {

            const birthDate = new Date(dobInput.value);
            const today = new Date();

            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            ageInput.value = age;
        });
    }

    /* =========================
       SAVE PROFILE
    ========================= */

    const saveBtn = document.getElementById("saveProfileBtn");

    if (saveBtn) {

        saveBtn.addEventListener("click", () => {

            const profileData = {
                name: document.getElementById("name")?.value,
                dob: document.getElementById("dob")?.value,
                age: document.getElementById("age")?.value,
                phone: document.getElementById("phone")?.value,
                gender: document.getElementById("gender")?.value,
                about: document.getElementById("about")?.value
            };

            localStorage.setItem("profileData", JSON.stringify(profileData));
            alert("Profile Saved Successfully!");
        });
    }

    /* =========================
       LOAD SAVED PROFILE
    ========================= */

    const savedProfile = JSON.parse(localStorage.getItem("profileData"));

    if (savedProfile) {
        document.getElementById("name") && (document.getElementById("name").value = savedProfile.name || "");
        document.getElementById("dob") && (document.getElementById("dob").value = savedProfile.dob || "");
        document.getElementById("age") && (document.getElementById("age").value = savedProfile.age || "");
        document.getElementById("phone") && (document.getElementById("phone").value = savedProfile.phone || "");
        document.getElementById("gender") && (document.getElementById("gender").value = savedProfile.gender || "");
        document.getElementById("about") && (document.getElementById("about").value = savedProfile.about || "");
    }
});