document.addEventListener("DOMContentLoaded", async () => {
    await requireAuth();

    console.log("User from localStorage:", JSON.parse(localStorage.getItem("user")));
    const user = JSON.parse(localStorage.getItem("user"));

    // Avatar elements and helper — declared early so setAvatar is available everywhere
    const profileImage = document.getElementById('profileImage');
    const placeholder = document.getElementById('avatarPlaceholder');

    function setAvatar(src) {
        if (!src || !profileImage) return;
        profileImage.src = src;
        profileImage.style.display = "block";
        if (placeholder) placeholder.style.display = "none";
    }

    // Fallback to localStorage while DB loads — only use if it belongs to current user
    const savedImage = localStorage.getItem("profileImage");
    const savedImageOwner = localStorage.getItem("profileImageOwner");
    if (savedImage && savedImageOwner === user?.id) setAvatar(savedImage);

    /* =========================
       LOAD CARBON BUDGET
    ========================= */
    async function loadCarbonBudget() {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const response = await fetch(`/api/stats?range=monthly`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const stats = await response.json();

            const BUDGET = 126.0;
            const generated = stats.total_carbon_generated || 0;
            const saved = stats.total_carbon_saved || 0;
            const netEmissions = Math.max(generated - saved, 0);
            const budgetLeftPct = Math.max(100 - Math.round((netEmissions / BUDGET) * 100), 0);

            const carbonEl = document.getElementById("carbonBudgetValue");
            if (carbonEl) carbonEl.textContent = budgetLeftPct + "%";

            const streakEl = document.getElementById("streakValue");
            if (streakEl) streakEl.textContent = stats.streak || "0";
        } catch (err) {
            console.error("Carbon budget error:", err);
        }
    }

    loadCarbonBudget();

    /* =========================
       LOAD RANK
    ========================= */
    async function loadRank() {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const response = await fetch(`/api/leaderboard`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            const rankEl = document.getElementById("rankValue");
            if (rankEl && data.rank) rankEl.textContent = "#" + data.rank;
        } catch (err) {
            console.error("Rank error:", err);
        }
    }

    loadRank();

    if (!user) {
        console.log("No user found in localStorage");
        return;
    }

    const emailEl = document.getElementById("profileEmail");
    const nameEl = document.getElementById("profileName");

    if (emailEl) emailEl.textContent = user.email;

    /* =========================
       FETCH PROFILE FROM DB
    ========================= */
    let profileData = null;

    if (user.email) {
        try {
            const res = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
            const data = await res.json();
            console.log("PROFILE DATA RECEIVED:", data);

            if (data.success) {
                profileData = data.user;

                /* ---------- PROFILE PAGE ---------- */
                if (nameEl) nameEl.textContent = profileData.username || "No Username";
                if (emailEl) emailEl.textContent = profileData.email || user.email;

                const pointsEl = document.getElementById("profilePoints");
                if (pointsEl) pointsEl.textContent = profileData.total_points?.toLocaleString() || "0";

                // Load avatar
                if (profileData.avatar_url) {
                    setAvatar(profileData.avatar_url);
                    localStorage.setItem("profileImage", profileData.avatar_url);
                    localStorage.setItem("profileImageOwner", user?.id);
                } else {
                    // Clear any leftover image from another account
                    localStorage.removeItem("profileImage");
                    localStorage.removeItem("profileImageOwner");
                    if (profileImage) profileImage.style.display = "none";
                    if (placeholder) placeholder.style.display = "block";
                }

                // Bio
                const aboutEl = document.querySelector('.about-text');
                if (aboutEl) {
                    const bio = profileData.bio;
                    aboutEl.innerHTML = bio
                        ? `${bio} <span class="read-more">Read More</span>`
                        : `I'm new to REGEN! Let's get started. <span class="read-more">Read More</span>`;
                }

                // Parse saved goals & interests (handles both array and JSON string from DB)
                const savedGoals = parseJsonArray(profileData.goals);
                const savedInterests = parseJsonArray(profileData.interests);

                // Goals — profile page: show only saved, fallback if none
                const goalCards = document.querySelectorAll('.goal-card');
                if (goalCards.length) {
                    let anyVisible = false;
                    goalCards.forEach(card => {
                        const label = card.querySelector('.goal-label')?.textContent.trim();
                        const show = savedGoals.includes(label);
                        card.style.display = show ? "flex" : "none";
                        if (show) anyVisible = true;
                    });

                    // If user hasn't set goals yet, hide all
                    if (!anyVisible) {
                        goalCards.forEach(card => card.style.display = "none");
                    }
                }

                // Interests — profile page: show only saved, fallback if none
                // Interests — only show saved ones, hide all if none saved
                const interestTags = document.querySelectorAll('.interest-tag');
                if (interestTags.length) {
                    interestTags.forEach(tag => {
                        const interestKey = tag.dataset.interest || tag.textContent.trim();
                        const show = savedInterests.some(i => interestKey.includes(i) || i.includes(interestKey));
                        tag.style.display = show ? "inline-flex" : "none";
                    });
                }

                /* ---------- EDIT PROFILE PAGE: pre-fill fields ---------- */
                if (document.getElementById("dob") || document.getElementById("name")) {
                    // Name / username
                    const nameInput = document.getElementById("name");
                    if (nameInput && profileData.username) nameInput.value = profileData.username;

                    const dobEl = document.getElementById("dob");
                    const ageEl = document.getElementById("age");
                    const genderEl = document.getElementById("gender");
                    const aboutInputEl = document.getElementById("about");
                    const phoneEl = document.getElementById("phone");

                    if (dobEl && profileData.date_of_birth) {
                        dobEl.value = profileData.date_of_birth;
                        calculateAndSetAge(profileData.date_of_birth);
                    }
                    if (ageEl && profileData.age) ageEl.value = profileData.age;
                    if (genderEl && profileData.gender) genderEl.value = profileData.gender;
                    if (aboutInputEl && profileData.bio) aboutInputEl.value = profileData.bio;
                    if (phoneEl && profileData.phone) phoneEl.value = profileData.phone;

                    // Pre-select goals — clear all first, then apply DB state
                    document.querySelectorAll('.goal-option').forEach(option => {
                        const label = option.querySelector('.goal-option-label')?.textContent.trim();
                        if (savedGoals.includes(label)) {
                            option.classList.add('selected');
                        } else {
                            option.classList.remove('selected');
                        }
                    });

                    // Pre-select interests — use data-interest for exact matching
                    document.querySelectorAll('.interest-input-tag').forEach(tag => {
                        const key = tag.dataset.interest;
                        if (key && savedInterests.includes(key)) {
                            tag.classList.add('selected');
                        } else {
                            tag.classList.remove('selected');
                        }
                    });
                }

            } else {
                console.log("Backend error:", data.error);
                if (nameEl) nameEl.textContent = "No Username";
            }
        } catch (err) {
            console.error("PROFILE FETCH ERROR:", err);
            if (nameEl) nameEl.textContent = "No Username";
        }
    }

    /* =========================
       HELPER: parse DB arrays
       (Supabase may return a real
        array or a JSON string)
    ========================= */
    function parseJsonArray(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        try { return JSON.parse(value); } catch { return []; }
    }

    /* =========================
       IMAGE HANDLING
    ========================= */
    const uploadInput = document.getElementById('profileUpload');
    const imageModal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    const closeModal = document.querySelector(".close-modal");

    if (uploadInput && profileImage) {
        uploadInput.addEventListener('change', async function () {
            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function (e) {
                const dataUrl = e.target.result;
                setAvatar(dataUrl);

                const token = localStorage.getItem("access_token");
                if (!token) return;

                const base64Data = dataUrl.split(",")[1];
                const mimeType = file.type;

                try {
                    console.log("📤 Uploading avatar...");
                    const res = await fetch('/api/upload-avatar', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ image: base64Data, mime_type: mimeType })
                    });

                    console.log("📥 Response status:", res.status);
                    const data = await res.json();
                    console.log("📥 Response data:", data);

                    if (data.success) {
                        localStorage.setItem("profileImage", data.avatar_url);
                        localStorage.setItem("profileImageOwner", user?.id);
                        console.log("✅ Avatar uploaded:", data.avatar_url);
                    } else {
                        console.error("❌ Avatar upload failed:", data.error);
                    }
                } catch (err) {
                    console.error("❌ Avatar upload error:", err);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (profileImage && imageModal && modalImage) {
        profileImage.addEventListener("click", () => {
            if (!profileImage.src) return;
            modalImage.src = profileImage.src;
            imageModal.style.display = "flex";
        });
    }

    if (closeModal && imageModal) {
        closeModal.addEventListener("click", () => { imageModal.style.display = "none"; });
    }

    if (imageModal) {
        imageModal.addEventListener("click", (e) => {
            if (e.target === imageModal) imageModal.style.display = "none";
        });
    }

    /* =========================
       DOB → AGE AUTO-CALC
    ========================= */
    function calculateAndSetAge(dobValue) {
        const ageInput = document.getElementById("age");
        if (!dobValue || !ageInput) return;
        const birthDate = new Date(dobValue);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        ageInput.value = age;
    }

    const dobInput = document.getElementById("dob");
    const ageInput = document.getElementById("age");
    if (dobInput) {
        dobInput.addEventListener("change", () => calculateAndSetAge(dobInput.value));
    }

    // Auto-fill age on load if DOB is already populated (e.g. from database pre-fill)
    if (dobInput && ageInput && dobInput.value) {
        const birthDate = new Date(dobInput.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        ageInput.value = age;
    }

    /* =========================
       SAVE PROFILE
    ========================= */
    const saveBtn = document.getElementById("saveProfileBtn");

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            const token = localStorage.getItem("access_token");
            console.log("TOKEN:", token);         // ← add this
            console.log("Save button clicked");   // ← add this
            if (!token) {
                alert("You're not logged in. Please sign in again.");
                return;
            }

            const goals = [...document.querySelectorAll('.goal-option.selected')]
                .map(el => el.querySelector('.goal-option-label')?.textContent.trim())
                .filter(Boolean);

            const interests = [...document.querySelectorAll('.interest-input-tag.selected')]
                .map(el => el.dataset.interest)
                .filter(Boolean);

            const nameVal = document.getElementById("name")?.value.trim() || null;
            const dobVal = document.getElementById("dob")?.value || null;
            const ageVal = document.getElementById("age")?.value || null;
            const phoneVal = document.getElementById("phone")?.value.trim() || null;
            const genderVal = document.getElementById("gender")?.value || null;
            const bioVal = document.getElementById("about")?.value.trim() || null;

            const updatedProfile = {
                username: nameVal,
                dob: dobVal,
                age: ageVal ? parseInt(ageVal) : null,
                phone: phoneVal,
                gender: genderVal,
                bio: bioVal,
                goals: goals,
                interests: interests
            };

            // Disable button to prevent double-submit
            saveBtn.disabled = true;
            saveBtn.textContent = "Saving...";

            try {
                const res = await fetch('/api/update-profile', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedProfile)
                });

                const data = await res.json();

                if (data.success) {
                    // Update cached user in localStorage so profile page reflects new name
                    const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
                    if (nameVal) cachedUser.username = nameVal;
                    localStorage.setItem("user", JSON.stringify(cachedUser));

                    alert("Profile saved!");
                    window.location.href = 'profile.html';
                } else {
                    alert("Failed to save profile: " + (data.error || "Unknown error"));
                    saveBtn.disabled = false;
                    saveBtn.textContent = "Save Profile";
                }
            } catch (err) {
                console.error("Save profile error:", err);
                alert("Network error while saving. Please try again.");
                saveBtn.disabled = false;
                saveBtn.textContent = "Save Profile";
            }
        });
    }
});