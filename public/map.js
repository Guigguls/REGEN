/**
 * REGEN FINAL INTERACTIVE LOGIC
 * Drag-to-snap menu + Independent list scrolling + Leaflet Map
 */

const sheet = document.getElementById('interactive-sheet');
const handle = document.querySelector('.drag-handle-container');
const listArea = document.querySelector('.nearby-centers');
const wrapper = document.querySelector('.map-page-wrapper');

let isDragging = false;
let startY = 0;
let currentTranslateY = 0;
let draggingTranslateY = 0;

// 1. Position Definitions (Pixels from top)
const getPoints = () => {
    const h = wrapper.offsetHeight;
    return {
        top: h * 0.08,    // Expanded List
        mid: h * 0.50,    // Split View (image_714a9f.png)
        bottom: h * 0.88  // Map Focus
    };
};

// Set initial state
let snap = getPoints();
currentTranslateY = snap.mid;
sheet.style.transform = `translateY(${currentTranslateY}px)`;

// 2. Drag Handlers
const onStart = (e) => {
    // ONLY start dragging if the user touches the gray handle
    if (e.target === handle || handle.contains(e.target)) {
        isDragging = true;
        startY = e.touches ? e.touches[0].clientY : e.clientY;
        sheet.classList.add('no-transition');
        snap = getPoints(); // Refresh for any screen resize
    }
};

const onMove = (e) => {
    if (!isDragging) return;

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startY;
    draggingTranslateY = currentTranslateY + deltaY;

    // Boundary constraints
    if (draggingTranslateY < snap.top) draggingTranslateY = snap.top;
    if (draggingTranslateY > snap.bottom) draggingTranslateY = snap.bottom;

    sheet.style.transform = `translateY(${draggingTranslateY}px)`;

    // Prevent background/whole-page scrolling while dragging the menu
    if (e.cancelable) e.preventDefault();
};

const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    sheet.classList.remove('no-transition');

    // Find closest snap point to where we let go
    const closest = Object.values(snap).reduce((prev, curr) => {
        return Math.abs(curr - draggingTranslateY) < Math.abs(prev - draggingTranslateY) ? curr : prev;
    });

    currentTranslateY = closest;
    sheet.style.transform = `translateY(${currentTranslateY}px)`;
};

// 3. Event Listeners
// Handle only for starting the drag
handle.addEventListener('touchstart', onStart, { passive: false });
handle.addEventListener('mousedown', onStart);

// Window for tracking movement (allows for finger to slide off handle)
window.addEventListener('touchmove', onMove, { passive: false });
window.addEventListener('mousemove', onMove);
window.addEventListener('touchend', onEnd);
window.addEventListener('mouseup', onEnd);

// 4. Scroll Logic
// Explicitly stop dragging if user is interacting with the list cards
listArea.addEventListener('touchstart', () => {
    isDragging = false; 
}, { passive: true });


// 5. Leaflet Map Initialization
setTimeout(() => {
    try {
        const map = L.map('map-display', { 
            zoomControl: false, 
            attributionControl: false 
        }).setView([14.5500, 121.0175], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        // Markers based on image_714a9f.png
        const pointsOfInterest = [
            { name: "Olaso Junk Shop", coords: [14.5520, 121.0150] },
            { name: "Carpel Makati", coords: [14.5560, 121.0210] }
        ];

        pointsOfInterest.forEach(loc => {
            L.marker(loc.coords).addTo(map).bindPopup(`<b>${loc.name}</b>`);
        });

        // User Position Marker
        const userIcon = L.divIcon({
            className: 'user-marker',
            html: `<div style="background:#52ab78; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.2);"></div>`,
            iconSize: [20, 20]
        });
        L.marker([14.5480, 121.0180], { icon: userIcon }).addTo(map);

        // Fix for Leaflet loading in hidden/partial containers
        map.invalidateSize();

    } catch (err) {
        console.error("Map initialization failed. Check Leaflet CDN links.", err);
    }
}, 300);