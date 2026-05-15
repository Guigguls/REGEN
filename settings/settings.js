document.addEventListener("DOMContentLoaded", () => {
  const locationToggle = document.getElementById("locationToggle");

  locationToggle.addEventListener("change", async () => {
    if (locationToggle.checked) {
      // Location ON → request device geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            alert(`Location enabled. Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`);
          },
          (err) => {
            alert("Unable to retrieve location: " + err.message);
          }
        );
      } else {
        alert("Geolocation not supported on this device.");
      }
    } else {
      // Location OFF → disable usage
      alert("Location disabled.");
      // Here you can clear stored location data or stop location-based features
    }
  });
});
