document.addEventListener("DOMContentLoaded", () => {
  
  // --- A. Gather Elements for Storage Triggers ---
  const dailyReminderToggle = document.getElementById("dailyReminderToggle");
  const challengeAlertsToggle = document.getElementById("challengeAlertsToggle");
  const milestoneToggle = document.getElementById("milestoneToggle");
  const ecoStatsToggle = document.getElementById("ecoStatsToggle");
  const contrastToggle = document.getElementById("contrastToggle");
  const screenReaderToggle = document.getElementById("screenReaderToggle");
  const locationToggle = document.getElementById("locationToggle");
  const clearCacheBtn = document.getElementById("clearCacheBtn");

  // --- B. Initial Load Check: Read Saved Values from browser ---
  if (dailyReminderToggle)   dailyReminderToggle.checked   = localStorage.getItem("dailyReminder") !== "false"; // Default true
  if (challengeAlertsToggle) challengeAlertsToggle.checked = localStorage.getItem("challengeAlerts") !== "false"; // Default true
  if (milestoneToggle)       milestoneToggle.checked       = localStorage.getItem("milestoneUpdates") !== "false"; // Default true
  if (ecoStatsToggle)        ecoStatsToggle.checked        = localStorage.getItem("shareEcoStats") === "true"; // Default false
  if (contrastToggle)        contrastToggle.checked        = localStorage.getItem("highContrast") === "true"; // Default false
  if (screenReaderToggle)    screenReaderToggle.checked    = localStorage.getItem("screenReader") === "true"; // Default false
  if (locationToggle)        locationToggle.checked        = localStorage.getItem("locationTracking") === "true"; // Default false

  // --- C. Event Listeners: Watch toggles and remember options ---
  if (dailyReminderToggle) {
    dailyReminderToggle.addEventListener("change", () => {
      localStorage.setItem("dailyReminder", dailyReminderToggle.checked);
    });
  }

  if (challengeAlertsToggle) {
    challengeAlertsToggle.addEventListener("change", () => {
      localStorage.setItem("challengeAlerts", challengeAlertsToggle.checked);
    });
  }

  if (milestoneToggle) {
    milestoneToggle.addEventListener("change", () => {
      localStorage.setItem("milestoneUpdates", milestoneToggle.checked);
    });
  }

  if (ecoStatsToggle) {
    ecoStatsToggle.addEventListener("change", () => {
      localStorage.setItem("shareEcoStats", ecoStatsToggle.checked);
    });
  }

  if (contrastToggle) {
    contrastToggle.addEventListener("change", () => {
      localStorage.setItem("highContrast", contrastToggle.checked);
    });
  }

  if (screenReaderToggle) {
    screenReaderToggle.addEventListener("change", () => {
      localStorage.setItem("screenReader", screenReaderToggle.checked);
    });
  }

  // --- D. Progress Reset/Cache Clearing Trigger ---
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener("click", () => {
      const confirmClear = confirm("Are you sure you want to clear your local progress cache? This resets your logged carbon stats.");
      if (confirmClear) {
        // Remove tracking keys used across your app
        localStorage.removeItem("userCarbonStreak");
        localStorage.removeItem("totalItemsRecycled");
        alert("Local progress cache cleared successfully!");
      }
    });
  }

  // --- E. Your Original Geolocation Functional Logic ---
  if (locationToggle) {
    locationToggle.addEventListener("change", async () => {
      localStorage.setItem("locationTracking", locationToggle.checked);
      if (locationToggle.checked) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              alert(`Location enabled. Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`);
            },
            (err) => {
              alert("Unable to retrieve location: " + err.message);
              locationToggle.checked = false;
              localStorage.setItem("locationTracking", false);
            }
          );
        } else {
          alert("Geolocation not supported on this device.");
          locationToggle.checked = false;
        }
      } else {
        alert("Location disabled.");
      }
    });
  }

  // --- F. Accordion Row Expand/Collapse Actions ---
  const triggers = document.querySelectorAll(".accordion-trigger");
  triggers.forEach(trigger => {
    trigger.addEventListener("click", () => {
      const targetId = trigger.getAttribute("data-target");
      const targetPanel = document.getElementById(targetId);
      const isOpen = trigger.classList.contains("active");

      // Closes open sister panels
      triggers.forEach(otherTrigger => {
        otherTrigger.classList.remove("active");
        const otherPanel = document.getElementById(otherTrigger.getAttribute("data-target"));
        if (otherPanel) {
          otherPanel.style.maxHeight = null;
        }
      });

      if (!isOpen) {
        trigger.classList.add("active");
        targetPanel.style.maxHeight = targetPanel.scrollHeight + "px";
      } else {
        trigger.classList.remove("active");
        targetPanel.style.maxHeight = null;
      }
    });
  });
});

// Navigation Route Backtrack
function goBack() {
  window.history.back();
}