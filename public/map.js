document.addEventListener("DOMContentLoaded", async () => {
    await requireAuth();

    const sheet = document.getElementById('interactive-sheet');
    const handle = document.querySelector('.drag-handle-container');
    const listArea = document.querySelector('.nearby-centers');
    const wrapper = document.querySelector('.map-page-wrapper');

    let isDragging = false;
    let startY = 0;
    let currentTranslateY = 0;
    let draggingTranslateY = 0;

    const getPoints = () => {
        const h = wrapper.offsetHeight;
        return {
            top: h * 0.08,
            mid: h * 0.50,
            bottom: h * 0.88
        };
    };

    const updateScrollArea = () => {
        const handleHeight = document.querySelector('.drag-handle-container').offsetHeight;
        const titleHeight = document.querySelector('.nearby-title').offsetHeight;
        const subtitleHeight = document.querySelector('.nearby-subtitle').offsetHeight;
        const visibleSheetHeight = sheet.offsetHeight - currentTranslateY;
        const availableScroll = visibleSheetHeight - handleHeight - titleHeight - subtitleHeight - 70;
        const centerList = document.querySelector('.center-list');
        centerList.style.maxHeight = `${availableScroll}px`;
        centerList.style.overflowY = 'scroll';
    };

    let snap = getPoints();
    currentTranslateY = snap.mid;
    sheet.style.transform = `translateY(${currentTranslateY}px)`;
    setTimeout(updateScrollArea, 50);

    const onStart = (e) => {
        if (e.target === handle || handle.contains(e.target)) {
            isDragging = true;
            startY = e.touches ? e.touches[0].clientY : e.clientY;
            sheet.classList.add('no-transition');
            snap = getPoints();
        }
    };

    const onMove = (e) => {
        if (!isDragging) return;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = clientY - startY;
        draggingTranslateY = currentTranslateY + deltaY;
        if (draggingTranslateY < snap.top) draggingTranslateY = snap.top;
        if (draggingTranslateY > snap.bottom) draggingTranslateY = snap.bottom;
        sheet.style.transform = `translateY(${draggingTranslateY}px)`;
        if (e.cancelable) e.preventDefault();
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        sheet.classList.remove('no-transition');
        const closest = Object.values(snap).reduce((prev, curr) => {
            return Math.abs(curr - draggingTranslateY) < Math.abs(prev - draggingTranslateY) ? curr : prev;
        });
        currentTranslateY = closest;
        sheet.style.transform = `translateY(${currentTranslateY}px)`;
        updateScrollArea();
    };

    handle.addEventListener('touchstart', onStart, { passive: false });
    handle.addEventListener('mousedown', onStart);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('mouseup', onEnd);

    listArea.addEventListener('touchstart', (e) => {
        isDragging = false;
    }, { passive: true });

    listArea.addEventListener('touchmove', (e) => {
        const atTop = listArea.scrollTop === 0;
        const atBottom = listArea.scrollHeight - listArea.scrollTop <= listArea.clientHeight + 1;
        const scrollingDown = e.touches[0].clientY < startY;
        const scrollingUp = e.touches[0].clientY > startY;

        if ((atTop && scrollingUp) || (atBottom && scrollingDown)) {
            return;
        }
        e.stopPropagation();
    }, { passive: true });


    // ─── Map State ────────────────────────────────────────────────────────────────

    let map;
    let userMarker;
    let facilityMarkers = [];
    const centerList = document.querySelector('.center-list');

    const increments = [2000, 5000, 10000, 20000];
    const keywords = [
        'junk shop',
        'materials recovery facility',
        'MRF recycling',
        'scrap shop',
        'recycling center',
        'waste disposal facility'
    ];

    let radiusIndex = 0;
    let currentUserLat = 0;
    let currentUserLon = 0;


    // ─── Helpers ──────────────────────────────────────────────────────────────────

    function metersToKm(meters) {
        return meters >= 1000
            ? (meters / 1000).toFixed(1) + ' km'
            : Math.round(meters) + ' m';
    }

    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function parseFeature(place) {
        if (!place.location) return null;

        const name = place.displayName?.text || 'Unnamed Facility';
        if (!name || name.length < 2) return null;

        const relevantTerms = /recycl|junk|scrap|mrf|material|recovery|waste|salvage|basura|eco|disposal/i;
        const types = place.types || [];
        const isRelevantType = types.some(t =>
            t.includes('recycl') || t.includes('waste') || t.includes('scrap')
        );
        if (!relevantTerms.test(name) && !isRelevantType) return null;

        let type = 'Recycling Facility';
        if (types.includes('recycling_center')) type = 'Recycling Centre';
        else if (types.includes('storage')) type = 'Waste Storage';
        else if (name.toLowerCase().includes('junk')) type = 'Junk Shop';
        else if (name.toLowerCase().includes('mrf') || name.toLowerCase().includes('recovery')) type = 'Materials Recovery Facility';
        else if (name.toLowerCase().includes('scrap')) type = 'Scrap Shop';

        return {
            name,
            type,
            lat: place.location.latitude,
            lon: place.location.longitude,
            address: place.formattedAddress || '',
            placeId: place.name || name
        };
    }

    function renderCenters(facilities, userLat, userLon) {
        centerList.innerHTML = '';

        facilities.forEach(f => {
            const dist = getDistance(userLat, userLon, f.lat, f.lon);
            const card = document.createElement('div');
            card.className = 'center-item-card';
            card.innerHTML = `
                <div class="center-icon-circle"><div class="inner-dot"></div></div>
                <div class="center-details">
                    <h3>${f.name}</h3>
                    <p>${f.type}</p>
                    ${f.address ? `<p style="font-size:0.75rem; color:#888; margin:2px 0 0;">${f.address}</p>` : ''}
                </div>
                <div class="center-distance">${metersToKm(dist)}</div>
            `;
            card.addEventListener('click', () => {
                map.panTo({ lat: f.lat, lng: f.lon });
                map.setZoom(17);
            });
            centerList.appendChild(card);
        });
    }

    function renderMoreButton() {
        const existing = document.getElementById('load-more-btn');
        if (existing) existing.remove();

        if (radiusIndex >= increments.length - 1) return;

        const nextKm = (increments[radiusIndex + 1] / 1000).toFixed(0);
        const btn = document.createElement('button');
        btn.id = 'load-more-btn';
        btn.textContent = `Search wider (${nextKm}km)`;
        btn.style.cssText = `
            display: block;
            width: calc(100% - 40px);
            margin: 12px 20px 20px;
            padding: 12px;
            background: #f0fff4;
            border: 2px solid #52ab78;
            border-radius: 12px;
            color: #063b31;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
        `;
        btn.addEventListener('click', async () => {
            btn.textContent = 'Searching...';
            btn.disabled = true;
            radiusIndex++;
            const radius = increments[radiusIndex];
            const km = (radius / 1000).toFixed(0);

            try {
                const facilities = await searchAtRadius(currentUserLat, currentUserLon, radius);
                if (facilities.length > 0) {
                    placeMarkers(facilities);
                    renderCenters(facilities, currentUserLat, currentUserLon);
                    renderMoreButton();
                } else {
                    btn.textContent = `Nothing at ${km}km, trying next...`;
                    btn.disabled = false;
                    if (radiusIndex < increments.length - 1) {
                        setTimeout(() => btn.click(), 800);
                    } else {
                        btn.textContent = 'No more results found';
                    }
                }
            } catch (err) {
                console.error('Search failed:', err);
                btn.textContent = 'Search failed — tap to retry';
                btn.disabled = false;
                radiusIndex--;
            }
        });

        centerList.appendChild(btn);
    }

    async function searchPlaces(lat, lon, radius, keyword) {
        const params = new URLSearchParams({ lat, lon, radius, keyword });
        const res = await fetch(`/api/maps/places?${params}`);
        const data = await res.json();
        return data.results || [];
    }

    async function searchAtRadius(lat, lon, radius) {
        const results = await Promise.all(
            keywords.map(kw => searchPlaces(lat, lon, radius, kw))
        );
        const allResults = results.flat();
        console.log('📦 Raw results:', allResults.length);
        return allResults
            .map(parseFeature)
            .filter(Boolean)
            .filter((f, i, arr) => arr.findIndex(x => x.placeId === f.placeId) === i)
            .filter(f => getDistance(lat, lon, f.lat, f.lon) <= radius)
            .sort((a, b) => getDistance(lat, lon, a.lat, a.lon) - getDistance(lat, lon, b.lat, b.lon));
    }

    function placeMarkers(facilities) {
        facilityMarkers.forEach(m => m.setMap(null));
        facilityMarkers = [];
        facilities.forEach(f => {
            const marker = new google.maps.Marker({
                position: { lat: f.lat, lng: f.lon },
                map,
                title: f.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#063b31',
                    fillOpacity: 1,
                    strokeColor: 'white',
                    strokeWeight: 2
                }
            });
            const infoWindow = new google.maps.InfoWindow({
                content: `<b>${f.name}</b><br><small>${f.type}</small>${f.address ? `<br><small>${f.address}</small>` : ''}`
            });
            marker.addListener('click', () => infoWindow.open(map, marker));
            facilityMarkers.push(marker);
        });
    }

    async function fetchFacilities(lat, lon) {
        currentUserLat = lat;
        currentUserLon = lon;
        radiusIndex = 0;

        centerList.innerHTML = `<p style="color:#888; font-size:0.9rem; text-align:center; margin-top:20px;">Searching nearby...</p>`;

        try {
            const facilities = await searchAtRadius(lat, lon, increments[0]);

            if (facilities.length > 0) {
                placeMarkers(facilities);
                renderCenters(facilities, lat, lon);
                renderMoreButton();
                return;
            }

            const firstKm = (increments[0] / 1000).toFixed(0);
            centerList.innerHTML = `<p style="color:#888; font-size:0.9rem; text-align:center; margin-top:20px;">No facilities found within ${firstKm}km.</p>`;
            renderMoreButton();

        } catch (err) {
            console.error('fetchFacilities error:', err);
            centerList.innerHTML = `<p style="color:#888; font-size:0.9rem; text-align:center; margin-top:20px;">Something went wrong. Please try again.</p>`;
        }
    }


    // ─── Map Init ─────────────────────────────────────────────────────────────────

    async function initMap() {
        const keyRes = await fetch('/api/maps/key');
        const { key } = await keyRes.json();

        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        map = new google.maps.Map(document.getElementById('map-display'), {
            center: { lat: 14.5500, lng: 121.0175 },
            zoom: 15,
            disableDefaultUI: true,
            styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
            ]
        });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    map.setCenter({ lat: latitude, lng: longitude });
                    userMarker = new google.maps.Marker({
                        position: { lat: latitude, lng: longitude },
                        map,
                        title: 'You are here',
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: '#52ab78',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 3
                        }
                    });
                    fetchFacilities(latitude, longitude);
                },
                (error) => {
                    console.warn('Geolocation denied:', error.message);
                    centerList.innerHTML = `<p style="color:#888; font-size:0.9rem; text-align:center; margin-top:20px;">Location access denied.<br>Enable location to find nearby facilities.</p>`;
                }
            );
        } else {
            centerList.innerHTML = `<p style="color:#888; font-size:0.9rem;">Geolocation not supported.</p>`;
        }
    }

    initMap();
});