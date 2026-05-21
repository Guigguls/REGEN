let stream = null;

async function initCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' },
      audio: false 
    });
    const video = document.getElementById('cameraVideo');
    video.srcObject = stream;

    video.onloadedmetadata = function () {
      video.play();
    };

    video.classList.remove('hidden');
    document.getElementById('cameraError').classList.add('hidden');
  } catch (err) {
    document.getElementById('cameraVideo').classList.add('hidden');
    document.getElementById('cameraError').classList.remove('hidden');
    const errorMsg = document.getElementById('errorMessage');
    if (err.name === 'NotAllowedError') {
      errorMsg.textContent = 'Camera access denied';
    } else if (err.name === 'NotFoundError') {
      errorMsg.textContent = 'No camera found';
    } else {
      errorMsg.textContent = 'Unable to access camera';
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

  // Get the logged in user's token
  const token = localStorage.getItem('access_token');
  if (!token) {
    alert('You must be logged in to scan.');
    window.location.href = 'login.html';
    return;
  }

  try {
    // Change 'localhost:5000' to use the dynamic hostname
    const response = await fetch(`http://${window.location.hostname}:5000/classify`, {
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

    window.location.href = 'info.html';

  } catch (err) {
    alert('Could not reach the server. Make sure app.py is running.\n\nDetails: ' + err.message);
  } finally {
    shutterBtn.disabled = false;
    shutterBtn.style.opacity = '1';
    shutterBtn.innerHTML = originalContent;
  }
}

function setActiveTab(event) {
  document.querySelectorAll('.scan-tab').forEach(tab => {
    tab.classList.remove('scan-tab-active');
  });
  event.target.classList.add('scan-tab-active');
}

window.addEventListener('load', initCamera);