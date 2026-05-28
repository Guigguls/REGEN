document.addEventListener('DOMContentLoaded', async () => {

    const BASE_URL = window.location.hostname === 'localhost'
        ? 'https://localhost:5000'
        : `https://${window.location.hostname}:5000`;

    const token = await getValidToken();
    if (!token) return;

    try {
        const response = await fetch(`${BASE_URL}/challenges`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch challenges:', response.status);
            return;
        }

        const data = await response.json();
        const challenges = data.challenges || [];
        const totalPoints = data.total_points || 0;

        // Update total points display
        const pointsEl = document.getElementById('total-points');
        if (pointsEl) pointsEl.innerText = totalPoints;

        // Update streak count
        const streakEl = document.querySelector('.streak-count');
        if (streakEl) streakEl.innerText = data.streak || 0;

        // Update streak dots (lights up based on streak, max 7)
        const dots = document.querySelectorAll('.streak-dots .dot');
        dots.forEach((dot, index) => {
            if (index < Math.min(data.streak || 0, 7)) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Map challenge_type to their bar/text/percent element IDs
        const elementMap = {
            'sort':     { bar: 'sort-bar',     text: 'sort-text',     percent: 'sort-percent' },
            'identify': { bar: 'identify-bar', text: 'identify-text', percent: 'identify-percent' },
            'reuse':    { bar: 'reuse-bar',    text: 'reuse-text',    percent: 'reuse-percent' }
        };

        let completedTasks = 0;
        const totalTasks = challenges.length;

        challenges.forEach(challenge => {
            const type = challenge.challenge_type?.toLowerCase();
            const progress = challenge.progress || 0;
            const target = challenge.target || 1;
            const pct = Math.min(Math.round((progress / target) * 100), 100);
            const els = elementMap[type];

            if (!els) return;

            const bar = document.getElementById(els.bar);
            const text = document.getElementById(els.text);
            const percent = document.getElementById(els.percent);

            if (bar) bar.style.width = pct + '%';
            if (text) text.innerText = `${progress} / ${target} completed`;
            if (percent) percent.innerText = pct + '%';

            if (challenge.completed) completedTasks++;
        });

        // Update active challenge (Eco Starter) progress
        // Find eco_starter row specifically
        const ecoChallenge = challenges.find(c => c.challenge_type === 'eco_starter');
        const ecoProgress = ecoChallenge ? ecoChallenge.progress : 0;
        const ecoTarget = ecoChallenge ? ecoChallenge.target : 3;
        const activePct = Math.min(Math.round((ecoProgress / ecoTarget) * 100), 100);

        const activeBar = document.getElementById('active-challenge-bar');
        const activeText = document.getElementById('active-challenge-text');
        const activePctEl = document.getElementById('active-challenge-percent');

        if (activeBar) activeBar.style.width = activePct + '%';
        if (activeText) activeText.innerText = `${ecoProgress} / ${ecoTarget}`;
        if (activePctEl) activePctEl.innerText = activePct + '%';

    } catch (err) {
        console.error('Challenges fetch error:', err);
    }
});