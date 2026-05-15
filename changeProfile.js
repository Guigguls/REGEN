const uploadInput = document.getElementById('profileUpload');
const profileImage = document.getElementById('profileImage');
const placeholder = document.getElementById('avatarPlaceholder');

/* LOAD SAVED IMAGE */
const savedImage = localStorage.getItem('profileImage');

if (savedImage) {
    profileImage.src = savedImage;
    profileImage.style.display = 'block';
    placeholder.style.display = 'none';
}

/* UPLOAD NEW IMAGE */
uploadInput.addEventListener('change', function () {

    const file = this.files[0];

    if (file) {

        const reader = new FileReader();

        reader.onload = function (e) {

            const imageData = e.target.result;

            profileImage.src = imageData;

            profileImage.style.display = 'block';

            placeholder.style.display = 'none';

            /* SAVE IMAGE */
            localStorage.setItem('profileImage', imageData);
        };

        reader.readAsDataURL(file);
    }
});