// streak.js
const BASE_URL = `https://${window.location.hostname}:5000`;


async function checkStreak() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
        const res = await fetch(`${BASE_URL}/api/streak/check`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) return;

        const data = await res.json();

        const el = document.getElementById("streak-count");
        if (el) el.textContent = data.streak;

        return data.streak;
    } catch (err) {
        console.error("Streak check failed:", err);
    }
}

checkStreak();