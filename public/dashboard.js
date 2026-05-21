// Global Configuration
const BUDGETS = {
  weekly: 10.0,   // 40 kg CO2e per week
  monthly: 40.0  // 160 kg CO2e per month
};

let currentRange = 'weekly';

// --- 🛡️ FIXED AUTH HANDSHAKE ---
// Pull your working variables straight out of your browser's local storage storage locker
const token = localStorage.getItem('access_token');
const userId = localStorage.getItem('user_id');

// Global validation verification block
if (!token || !userId) {
  console.warn("⚠️ No active login session found. Charts will render as 0.");
  // window.location.href = './signin.html'; // 🛠️ COMMENTED OUT: Stops the aggressive kicking loop entirely!
}

/**
 * Fetch stats from Python Flask API (Port 5000)
 * Sends the access_token in the Authorization header for validation.
 */
async function fetchStats(range = 'weekly') {
    try {
        // Use the token we already verified at the very top of the script
        if (!token) {
            console.error("❌ Cannot execute backend query: token is empty.");
            return null;
        }

        // Make the request to your Flask API, attaching your real access token cleanly
        const response = await fetch(`http://${window.location.hostname}:5000/stats?range=${range}`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`, 
              'Content-Type': 'application/json'
          }
      });

        if (response.status === 401) {
            console.error("❌ Flask server rejected token with 401: Unauthorized");
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("📊 Successfully fetched data payload:", data);
        
        return data;

    } catch (error) {
        console.error("❌ Failed to fetch dashboard stats from Flask application:", error);
        return null;
    }
}

/**
 * Dynamic calculation and DOM updates
 */
async function updateDashboard(view) {
  currentRange = view;

  // Visual toggle alignment
  const container = document.getElementById('toggle-container');
  if (container) {
    container.classList.remove('is-weekly', 'is-monthly');
    container.classList.add(view === 'weekly' ? 'is-weekly' : 'is-monthly');
  }

  // Request operational dataset
  const stats = await fetchStats(view);
  const budget = BUDGETS[view] || 40;

  // Explicit numeric check to prevent arithmetic evaluation on null fields
  const generated = (stats && typeof stats.total_carbon_generated === 'number' && !isNaN(stats.total_carbon_generated)) 
    ? stats.total_carbon_generated 
    : 0;
    
  const saved = (stats && typeof stats.total_carbon_saved === 'number' && !isNaN(stats.total_carbon_saved)) 
    ? stats.total_carbon_saved 
    : 0;

  // Safe percentage mathematical expressions
  const budgetUsedPct = budget > 0 ? Math.min(Math.round((generated / budget) * 100), 100) : 0;
  const budgetLeftPct = Math.max(100 - budgetUsedPct, 0);
  const kgLeft = Math.max(budget - generated, 0).toFixed(2);
  const trashPct = budgetUsedPct;
  const recyclePct = budget > 0 ? Math.min(Math.round((saved / budget) * 100), 100) : 0;
  
  const timeFrame = view === 'weekly' ? 'left this week' : 'left this month';

  // --- Update Main Progress Ring ---
  const ring = document.getElementById('main-ring');
  if (ring) {
    ring.style.setProperty('--percentage', budgetLeftPct + '%');
  }
  const displayPct = document.getElementById('display-pct');
  if (displayPct) displayPct.innerText = budgetLeftPct + '%';
  
  const displayKg = document.getElementById('display-kg');
  if (displayKg) displayKg.innerText = kgLeft + ' kg CO₂e';
  
  const displayTime = document.getElementById('display-time');
  if (displayTime) displayTime.innerText = timeFrame;

  // --- Update Trash Visual Bar ---
  const trashFill = document.getElementById('trash-bar-fill');
  if (trashFill) {
    trashFill.style.setProperty('--progress', trashPct + '%');
  }
  const trashPctEl = document.getElementById('trash-pct');
  if (trashPctEl) trashPctEl.innerText = trashPct + '%';
  
  const trashKgEl = document.getElementById('trash-kg');
  if (trashKgEl) trashKgEl.innerText = generated.toFixed(2) + ' kg CO₂';

  // --- Update Recycle Visual Bar ---
  const recycleFill = document.getElementById('recycle-bar-fill');
  if (recycleFill) {
    recycleFill.style.setProperty('--progress', recyclePct + '%');
  }
  const recyclePctEl = document.getElementById('recycle-pct');
  if (recyclePctEl) recyclePctEl.innerText = recyclePct + '%';
  
  const recycleKgEl = document.getElementById('recycle-kg');
  if (recycleKgEl) recycleKgEl.innerText = saved.toFixed(2) + ' kg CO₂';
}

/**
 * Initialize event listeners and baseline dashboard load configuration
 */
document.addEventListener("DOMContentLoaded", () => {
  // Execute baseline execution view
  updateDashboard('weekly');

  // Interactive toggle actions
  document.getElementById('btn-weekly')?.addEventListener('click', () => {
    if (currentRange !== 'weekly') updateDashboard('weekly');
  });

  document.getElementById('btn-monthly')?.addEventListener('click', () => {
    if (currentRange !== 'monthly') updateDashboard('monthly');
  });
});