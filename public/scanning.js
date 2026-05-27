let stream = null;

async function initCamera() {
  const video = document.getElementById('cameraVideo');
  const errorOverlay = document.getElementById('cameraError');
  const errorMsg = document.getElementById('errorMessage');

  // 🌟 FIX 1: Check for unencrypted HTTP network blocks instantly
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    video.classList.add('hidden');
    errorOverlay.classList.remove('hidden');
    errorMsg.textContent = 'Insecure Network Connection (HTTP Block)';
    
    alert(
      "🔒 Browser Security Block:\n\n" +
      "Mobile browsers block hardware cameras over standard http:// local network links.\n\n" +
      "To test your camera on a phone, you must use an HTTPS tunnel (like Ngrok) or use your computer's local browser via 'localhost'."
    );
    return;
  }

  try {
    // 🌟 FIX 2: Optimized parameters using 'ideal' configurations for mobile stability
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: { ideal: 'environment' }, // Points to rear-facing camera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false 
    });
    
    video.srcObject = stream;

    video.onloadedmetadata = function () {
      video.play();
    };

    video.classList.remove('hidden');
    errorOverlay.classList.add('hidden');
  } catch (err) {
    video.classList.add('hidden');
    errorOverlay.classList.remove('hidden');
    console.error("Camera access error details:", err);

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMsg.textContent = 'Camera access denied';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMsg.textContent = 'No camera hardware found';
    } else {
      errorMsg.textContent = 'Unable to access camera: ' + err.message;
    }
  }
}

async function captureImage() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('canvas');

  if (!video.srcObject) {
    alert('Camera is not ready. Please wait a moment and try again.');
    return;
  }

  if (video.videoWidth === 0 || video.videoHeight === 0) {
    alert('Camera feed not ready yet. Please wait a moment and try again.');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataURL = canvas.toDataURL('image/jpeg', 0.9);
  const base64Image = dataURL.split(',')[1];

  if (!base64Image || base64Image.length === 0) {
    alert('Failed to capture image. Please try again.');
    return;
  }

  flashEffect();
  await sendToAPI(base64Image, dataURL, 'image/jpeg');
}

function flashEffect() {
  const video = document.getElementById('cameraVideo');
  video.style.transition = 'opacity 0.1s';
  video.style.opacity = '0';
  setTimeout(() => {
    video.style.opacity = '1';
  }, 150);
}

function uploadFromGallery(event) {
  const file = event.target.files[0];
  if (!file) return;

  const mimeType = file.type || 'image/jpeg';
  const reader = new FileReader();

  reader.onload = function (e) {
    const dataURL = e.target.result;
    const base64Image = dataURL.split(',')[1];

    sendToAPI(base64Image, dataURL, mimeType).catch(() => {
      alert('Could not reach the server. Make sure app.py is running.');
    });
  };

  reader.readAsDataURL(file);
}

async function sendToAPI(base64Image, dataURL, mimeType) {
  const shutterBtn = document.querySelector('.scan-action-shutter');
  const originalContent = shutterBtn.innerHTML;
  shutterBtn.disabled = true;
  shutterBtn.style.opacity = '0.5';

  const token = localStorage.getItem('access_token');
  if (!token) {
    alert('You must be logged in to scan.');
    window.location.replace('signin.html');
    return;
  }

  let success = false; 

  try {
    // This sends the image to your secure Node server
    const response = await fetch(`/api/classify`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image, mime_type: "image/jpeg" })
    });

    if (!response.ok) {
        throw new Error('Server returned error: ' + response.status);
    }

    const result = await response.json();

    sessionStorage.setItem('scanResult', JSON.stringify(result));
    sessionStorage.setItem('capturedImage', dataURL);
    
    success = true; 

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setTimeout(() => {
      window.location.replace('info.html');
    }, 50);

  } catch (err) {
    alert('Could not reach the server. Make sure app.py is running.\n\nDetails: ' + err.message);
  } finally {
    if (!success) {
      shutterBtn.disabled = false;
      shutterBtn.style.opacity = '1';
      shutterBtn.innerHTML = originalContent;
    }
  }
}

function setActiveTab(event) {
  document.querySelectorAll('.scan-tab').forEach(tab => {
    tab.classList.remove('scan-tab-active');
  });
  event.target.classList.add('scan-tab-active');
}

window.addEventListener('load', initCamera);