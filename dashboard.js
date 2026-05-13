/* --- REPLACE ENTIRE JS CONTENT WITH THIS --- */

const dashboardData = {
    weekly: {
        percentage: "82%",
        kgLeft: "32 kg CO₂e",
        timeFrame: "left this week",
        trash: { pct: "15%", kg: "12 kg CO₂" },
        recycle: { pct: "5%", kg: "2 kg CO₂" }
    },
    monthly: {
        percentage: "64%",
        kgLeft: "128 kg CO₂e",
        timeFrame: "left this month",
        trash: { pct: "35%", kg: "80 kg CO₂" },
        recycle: { pct: "10%", kg: "8 kg CO₂" }
    }
};

const container = document.getElementById('toggle-container');
const slider = document.getElementById('slider-bg');
let isDragging = false;
let startX = 0;

function updateDashboard(view) {
    const d = dashboardData[view];
    
    // Update Toggle UI
    container.classList.remove('is-weekly', 'is-monthly');
    container.classList.add(view === 'weekly' ? 'is-weekly' : 'is-monthly');

    // Update Main Circle
    const ring = document.getElementById('main-ring');
    ring.style.setProperty('--percentage', d.percentage);
    document.getElementById('display-pct').innerText = d.percentage;
    document.getElementById('display-kg').innerText = d.kgLeft;
    document.getElementById('display-time').innerText = d.timeFrame;

    // Update Trash Bar
    const trashFill = document.getElementById('trash-bar-fill');
    trashFill.style.setProperty('--progress', d.trash.pct);
    document.getElementById('trash-pct').innerText = d.trash.pct;
    document.getElementById('trash-kg').innerText = d.trash.kg;

    // Update Recycle Bar
    const recycleFill = document.getElementById('recycle-bar-fill');
    recycleFill.style.setProperty('--progress', d.recycle.pct);
    document.getElementById('recycle-pct').innerText = d.recycle.pct;
    document.getElementById('recycle-kg').innerText = d.recycle.kg;
}

// --- DRAG LOGIC ---
container.addEventListener('mousedown', startDrag);
container.addEventListener('touchstart', startDrag);

function startDrag(e) {
    isDragging = true;
    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    slider.style.transition = 'none'; 
}

window.addEventListener('mousemove', drag);
window.addEventListener('touchmove', drag);

function drag(e) {
    if (!isDragging) return;
    const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX;
    
    if (diff > 50) {
        updateDashboard('monthly');
        stopDrag();
    } else if (diff < -50) {
        updateDashboard('weekly');
        stopDrag();
    }
}

window.addEventListener('mouseup', stopDrag);
window.addEventListener('touchend', stopDrag);

function stopDrag() {
    isDragging = false;
    slider.style.transition = ''; 
}

// Initial Load
window.onload = () => updateDashboard('monthly');