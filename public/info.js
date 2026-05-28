window.addEventListener('load', function () {
    const raw = sessionStorage.getItem('scanResult');
    const capturedImage = sessionStorage.getItem('capturedImage');

    if (!raw) return;
    const data = JSON.parse(raw);

    // Header info
    if (capturedImage) document.getElementById('result-img').src = capturedImage;
    document.getElementById('result-title').textContent = data.item_name || '—';
    document.getElementById('result-material').textContent = data.material || '—';
    document.getElementById('result-category').textContent = data.category || '—';

    // Confidence
    const confidenceMap = { high: '95%', medium: '70%', low: '40%' };
    document.getElementById('confidence-badge').textContent = '✓ ' + (confidenceMap[data.confidence] || '—');

    // Disposal badge
    const recyclableBadge = document.getElementById('badge-recyclable');
    const bioBadge = document.getElementById('badge-bio');
    const disposal = data.disposal?.toLowerCase() || '';

    if (disposal.includes('non-recyclable')) {
        recyclableBadge.textContent = 'NON-RECYCLABLE';
        recyclableBadge.classList.remove('badge-recyclable');
        recyclableBadge.classList.add('badge-non-recyclable');
    } else {
        recyclableBadge.textContent = 'RECYCLABLE';
        recyclableBadge.classList.remove('badge-non-recyclable');
        recyclableBadge.classList.add('badge-recyclable');
    }

    // Category badge — biodegradable vs non-biodegradable based on category
    const category = data.category?.toLowerCase() || '';
    const biodegradableCategories = ['organic', 'food', 'paper', 'biodegradable', 'wood'];
    const isBio = biodegradableCategories.some(c => category.includes(c));

    bioBadge.textContent = isBio ? 'BIODEGRADABLE' : 'NON-BIODEGRADABLE';
    bioBadge.classList.toggle('badge-bio', isBio);
    bioBadge.classList.toggle('badge-non-bio', !isBio);

    // Impact & Footprint
    document.getElementById('info-impact').textContent = data.impact || '—';
    document.getElementById('carbon-footprint').textContent = '🌍 ' + (data.carbon_footprint || '—');

    // CONCRETE STEPS WITH EMPTY STATE LOGIC
    renderStepSection('recycle-steps', data.recycle_steps);
    renderStepSection('dispose-steps', data.dispose_steps);

    // Fun Facts
    const facts = data.fun_facts || [];
    document.getElementById('info-did-you-know').innerHTML = data.did_you_know || '—';
    const factList = document.getElementById('fun-facts-list');
    factList.innerHTML = facts.map(f => `<li class="fun-fact-item">💡 ${f}</li>`).join('');
});

function renderStepSection(containerId, steps) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // If AI returns an empty list or no steps
    if (!steps || steps.length === 0) {
        container.innerHTML = `<div class="no-steps-msg">No specific instructions available for this item.</div>`;
        return;
    }

    steps.forEach((step, i) => {
        const isHidden = i >= 2 ? 'hidden' : ''; 
        container.innerHTML += `
            <div class="step-item ${isHidden}">
                <div class="step-number">${i + 1}</div>
                <span>${step}</span>
            </div>`;
    });

    if (steps.length > 2) {
        const btn = document.createElement('button');
        btn.className = 'learn-more-toggle';
        btn.textContent = 'Learn more ↓';
        btn.onclick = () => {
            const items = container.querySelectorAll('.step-item');
            const isExpanding = btn.textContent.includes('more');
            items.forEach((item, idx) => { if(idx >= 2) item.classList.toggle('hidden'); });
            btn.textContent = isExpanding ? 'Show less ↑' : 'Learn more ↓';
        };
        container.after(btn);
    }
}

function toggleFacts() {
    const list = document.getElementById('fun-facts-list');
    const btn = document.getElementById('learn-more-btn');
    const isHidden = list.classList.toggle('hidden');
    btn.textContent = isHidden ? 'Learn more ↓' : 'Show less ↑';
}