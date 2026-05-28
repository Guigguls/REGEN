// verify.js
 
document.addEventListener("DOMContentLoaded", () => {
  // 1. Extract the master session object saved by your scanner pipeline
  const storedResult = sessionStorage.getItem('scanResult');
  let correctClassification = localStorage.getItem("correctClassification") || "recyclable";
  let itemTitle = localStorage.getItem("scannedItemTitle") || "Scanned Item";
  let dynamicPoints = 10; // Fallback default points
 
  if (storedResult) {
    try {
      const parsedData = JSON.parse(storedResult);
      // Synchronize with active API payload names if available
      if (parsedData.item_name) itemTitle = parsedData.item_name;
      if (parsedData.pointsAwarded) dynamicPoints = parsedData.pointsAwarded;
    } catch (e) {
      console.error("Error breaking down session master payload:", e);
    }
  }
 
  // Save the points temporarily to a variable data property so evaluateAnswer can read it later
  window.currentChallengePoints = dynamicPoints;
 
  // Update the subtitle layout smoothly with FontAwesome clarity
  document.getElementById("verify-subtitle").innerText = `What type of waste is this ${itemTitle.toLowerCase()}?`;
 
  const optionsContainer = document.getElementById("verify-options-container");
 
  // 2. Clear out container to protect original layout before rendering choices
  optionsContainer.innerHTML = "";
 
  const wasteOptions = [
    { text: "Recyclable", icon: "fa-arrows-spin", value: "recyclable", color: "#4caf50" },
    { text: "Non-Recyclable", icon: "fa-dumpster", value: "non-recyclable", color: "#ff9800" }
  ];
 
  // 3. Render the choice buttons cleanly
  wasteOptions.forEach(option => {
    const button = document.createElement("button");
    button.className = "challenge-option-btn";
    
    button.innerHTML = `
      <div class="option-content">
        <i class="fa-solid ${option.icon} option-icon" style="color: ${option.color}"></i>
        <span>${option.text}</span>
      </div>
      <i class="fa-solid fa-circle-question arrow-icon"></i>
    `;
    
    button.onclick = () => evaluateAnswer(option.value, correctClassification);
    optionsContainer.appendChild(button);
  });
});
 
// 4. Evaluate Quiz Mechanics & Apply Live Rewards UI
async function evaluateAnswer(userGuess, correctAnswer) {
  const promptEl = document.getElementById("verify-prompt");
  const optionsContainer = document.getElementById("verify-options-container");
  const trophyContainer = document.querySelector(".trophy-icon-container");
  
  // Extract token strings for database update safety checks
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  const pointsToAward = window.currentChallengePoints || 10;
 
  // Normalize both values to handle "Non-Recyclable" vs "non-recyclable" etc.
  const isCorrect = userGuess.toLowerCase().replace(/[-\s]/g, '') === correctAnswer.toLowerCase().replace(/[-\s]/g, '');
 
  // Clear choices instantly for a clean transition layout
  optionsContainer.innerHTML = "";
 
  if (isCorrect) {
    // SUCCESS VIEW - Points unlocked!
    trophyContainer.innerHTML = '<i class="fa-solid fa-face-smile-beam" style="color: #4caf50; font-size: 4rem;"></i>';
    promptEl.innerText = "Spot on! That's completely correct.";
    
    optionsContainer.innerHTML = `
      <div style="text-align: center; padding: 10px 0;">
        <p style="font-size: 1.3rem; font-weight: bold; color: #2e7d32; margin-bottom: 5px;">+${pointsToAward} REGEN Points!</p>
        <p style="color: #666; font-size: 0.95rem; margin-bottom: 25px;">You nailed the classification layout.</p>
        <button class="challenge-submit-btn" onclick="window.location.href='info.html'" style="width: 100%;">
          View Item Details <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    `;
 
    // 🚀 UPDATED: Send the bonus points data to your Flask/Supabase backend
    if (token && userId) {
      const BASE_URL = window.location.hostname === 'localhost'
          ? 'https://localhost:5000'
          : `https://${window.location.hostname}:5000`;

      fetch(`${BASE_URL}/add-points`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          points: pointsToAward,
          action: 'quiz_bonus',
          reason: "Correctly classified " + localStorage.getItem("scannedItemTitle")
        })
      })
      .then(res => {
        if (!res.ok) console.error("Database failed to save quiz bonus points.");
        else console.log("Quiz bonus points successfully saved!");
      })
      .catch(err => console.error("Network error saving points:", err));
    }
 
  } else {
    // FAILURE / STUDY VIEW - No points, direct to review
    trophyContainer.innerHTML = '<i class="fa-solid fa-circle-info" style="color: #f44336; font-size: 4rem;"></i>';
    promptEl.innerText = "Not quite right this time!";
    
    optionsContainer.innerHTML = `
      <div style="text-align: center; padding: 10px 0;">
        <p style="font-size: 1.2rem; font-weight: bold; color: #c62828; margin-bottom: 5px;">0 Points Awarded</p>
        <p style="color: #666; font-size: 0.95rem; margin-bottom: 25px;">Let's head over to the breakdown page to check why.</p>
        <button class="challenge-submit-btn" onclick="window.location.href='info.html'" style="width: 100%; background: #757575;">
          See Why & Learn More <i class="fa-solid fa-book-open"></i>
        </button>
      </div>
    `;
  }
 
  // Safely hide your cancel/skip option now that user interaction processing is complete
  const cancelBtn = document.getElementById("cancel-btn");
  if (cancelBtn) cancelBtn.style.display = "none";
}