const mediaContainer = document.getElementById('mediaContainer');
const videoContainer = document.getElementById('videoContainer');
const galleryContainer = document.getElementById('galleryContainer');
const galleryBackground = document.getElementById('galleryBackground');
const galleryThumbnails = document.getElementById('galleryThumbnails');
const tabs = document.querySelectorAll('#tabsHeader .tab'); // Selector reverted to target the tabs within the new ul
const zipInput = document.getElementById('zipInput');
const processZipBtn = document.getElementById('processZipBtn');
const uploadZipModal = new bootstrap.Modal(document.getElementById('uploadZipModal'));


let images = [], videos = [];
let gallerySlideshowIndex = 0;
let gallerySlideshowInterval = null;
let isAnimating = false;

// Add image thumbnail in Images tab
function addImageToImagesTab(media) {
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';

    const img = document.createElement('img');
    img.src = media.url;
    img.classList.add('img-fluid', 'rounded'); // Bootstrap classes
    img.style.width = '250px';
    img.title = media.filename;

    img.onclick = () => {
        const index = images.findIndex(m => m.url === media.url);
        if (index !== -1) openFullscreen(index, 'image');
    };

    wrapper.appendChild(img);
    mediaContainer.appendChild(wrapper);
}

// Add video thumbnail in Videos tab
function addVideoToVideosTab(media) {
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';

    const video = document.createElement('video');
    video.src = media.url;
    video.controls = true;
    video.autoplay = false; // No autoplay in thumbnail
    video.muted = true;
    video.loop = true;
    video.classList.add('img-fluid', 'rounded'); // Bootstrap classes
    video.style.width = '250px';

    video.onclick = () => {
        const index = videos.findIndex(m => m.url === media.url);
        if (index !== -1) openFullscreen(index, 'video');
    };

    wrapper.appendChild(video);
    videoContainer.appendChild(wrapper);
}

// Setup gallery thumbnails and background
function setupGallery() {
    if (images.length === 0) return;

    galleryThumbnails.innerHTML = '';

    images.forEach((media, idx) => {
        const thumb = document.createElement('img');
        thumb.src = media.url;
        thumb.title = media.filename;
        thumb.classList.add('img-thumbnail'); // Bootstrap class for thumbnails
        if (idx === 0) thumb.classList.add('selected');
        thumb.onclick = () => {
            clearInterval(gallerySlideshowInterval);
            gallerySlideshowIndex = idx;
            setGalleryBackground(media.url);
            updateThumbnailSelection(idx);
        };
        galleryThumbnails.appendChild(thumb);
    });

    // Set initial gallery background
    setGalleryBackground(images[0].url);
    updateThumbnailSelection(0);
}

// Update selected thumbnail styling
function updateThumbnailSelection(index) {
    galleryThumbnails.querySelectorAll('img').forEach((img, i) => {
        img.classList.toggle('selected', i === index);
    });
    // Scroll selected thumbnail into view
    const selectedThumb = galleryThumbnails.querySelector('.selected');
    if (selectedThumb) {
        selectedThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// Fade transition for gallery background
function setGalleryBackground(url) {
    if (isAnimating) return;
    isAnimating = true;

    galleryBackground.style.opacity = 0;
    setTimeout(() => {
        galleryBackground.style.backgroundImage = `url('${url}')`;
        galleryBackground.style.opacity = 1;
        setTimeout(() => {
            isAnimating = false;
        }, 1000);
    }, 500);
}

// Start the slideshow in gallery tab
function startGallerySlideshow() {
    if (images.length === 0) return;

    clearInterval(gallerySlideshowInterval);
    setGalleryBackground(images[gallerySlideshowIndex].url);
    updateThumbnailSelection(gallerySlideshowIndex);

    gallerySlideshowInterval = setInterval(() => {
        gallerySlideshowIndex = (gallerySlideshowIndex + 1) % images.length;
        setGalleryBackground(images[gallerySlideshowIndex].url);
        updateThumbnailSelection(gallerySlideshowIndex);
    }, 3000);
}

// Tabs click handling
tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const target = tab.getAttribute('data-tab');

        mediaContainer.classList.remove('active');
        videoContainer.classList.remove('active');
        galleryContainer.classList.remove('active');
        clearInterval(gallerySlideshowInterval);

        if (target === 'imagesTab') {
            mediaContainer.classList.add('active');
        } else if (target === 'videosTab') {
            videoContainer.classList.add('active');
        } else if (target === 'galleryTab') {
            galleryContainer.classList.add('active');
            startGallerySlideshow();
        }
    });
});

// Handle ZIP input and extract media files
processZipBtn.addEventListener('click', async function () {
    const files = zipInput.files;
    if (!files.length) {
        alert('Please select at least one ZIP file.');
        return;
    }

    // Close the modal
    uploadZipModal.hide();

    // Clear previous content
    images = [];
    videos = [];
    mediaContainer.innerHTML = '';
    videoContainer.innerHTML = '';
    galleryThumbnails.innerHTML = '';
    galleryBackground.style.backgroundImage = '';
    galleryBackground.style.opacity = 0;
    clearInterval(gallerySlideshowInterval);

    for (const file of files) {
        const zip = new JSZip();
        try {
            const contents = await zip.loadAsync(file);
            for (const filename of Object.keys(contents.files)) {
                const fileData = contents.files[filename];
                if (fileData.dir) continue;

                const ext = filename.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
                const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);

                if (isImage || isVideo) {
                    const blob = await fileData.async('blob');
                    const url = URL.createObjectURL(blob);
                    const media = { type: isImage ? 'image' : 'video', url, filename };

                    if (isImage) {
                        images.push(media);
                        addImageToImagesTab(media);
                    } else {
                        videos.push(media);
                        addVideoToVideosTab(media);
                    }
                }
            }
        } catch (err) {
            console.error(`Error reading ZIP file: ${file.name}`, err);
            alert(`Error reading ZIP file: ${file.name}. Please ensure it's a valid ZIP archive.`);
        }
    }

    setupGallery();

    // Show images tab by default
    tabs.forEach(t => t.classList.remove('active'));
    // Select the correct "Images" tab in the new navbar structure
    document.querySelector('.tab[data-tab="imagesTab"]').classList.add('active');
    mediaContainer.classList.add('active');
});

// Fullscreen viewer elements
const fullscreenOverlay = document.getElementById('fullscreenOverlay');
const fullscreenImage = document.getElementById('fullscreenImage');
const fullscreenVideo = document.getElementById('fullscreenVideo');
const fsNextBtn = document.getElementById('fsNextBtn');
const fsPrevBtn = document.getElementById('fsPrevBtn');
const fsCloseBtn = document.getElementById('fsCloseBtn');

let fullscreenIndex = 0;
let fullscreenMediaType = 'image'; // 'image' or 'video'

// Open fullscreen for image or video
function openFullscreen(index, type) {
    fullscreenIndex = index;
    fullscreenMediaType = type;

    if (type === 'image') {
        fullscreenVideo.style.display = 'none';
        fullscreenVideo.pause();
        fullscreenImage.style.display = 'block';
        fullscreenImage.src = images[index].url;
    } else if (type === 'video') {
        fullscreenImage.style.display = 'none';
        fullscreenVideo.style.display = 'block';
        fullscreenVideo.src = videos[index].url;
        fullscreenVideo.play();
    }

    fullscreenOverlay.style.display = 'flex';
}

// Close fullscreen viewer
function closeFullscreen() {
    fullscreenOverlay.style.display = 'none';
    fullscreenVideo.pause();
    fullscreenVideo.src = '';
    fullscreenImage.src = '';
}

// Show next media in fullscreen
function showNextMedia() {
    if (fullscreenMediaType === 'image') {
        if (images.length === 0) return;
        fullscreenIndex = (fullscreenIndex + 1) % images.length;
        fullscreenImage.src = images[fullscreenIndex].url;
    } else if (fullscreenMediaType === 'video') {
        if (videos.length === 0) return;
        fullscreenIndex = (fullscreenIndex + 1) % videos.length;
        fullscreenVideo.src = videos[fullscreenIndex].url;
        fullscreenVideo.play();
    }
}

// Show previous media in fullscreen
function showPrevMedia() {
    if (fullscreenMediaType === 'image') {
        if (images.length === 0) return;
        fullscreenIndex = (fullscreenIndex - 1 + images.length) % images.length;
        fullscreenImage.src = images[fullscreenIndex].url;
    } else if (fullscreenMediaType === 'video') {
        if (videos.length === 0) return;
        fullscreenIndex = (fullscreenIndex - 1 + videos.length) % videos.length;
        fullscreenVideo.src = videos[fullscreenIndex].url;
        fullscreenVideo.play();
    }
}

// Event listeners for fullscreen controls
fsNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showNextMedia();
});

fsPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrevMedia();
});

fsCloseBtn.addEventListener('click', () => {
    closeFullscreen();
});

fullscreenOverlay.addEventListener('click', (e) => {
    if (e.target === fullscreenOverlay) {
        closeFullscreen();
    }
});