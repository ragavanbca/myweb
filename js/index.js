const mediaContainer = $('#mediaContainer');
const videoContainer = $('#videoContainer');
const galleryContainer = $('#galleryContainer');
const galleryBackground = $('#galleryBackground');
const galleryThumbnails = $('#galleryThumbnails');
const tabs = $('#tabsHeader .tab');
const zipInput = $('#zipInput');
const processZipBtn = $('#processZipBtn');

let images = [], videos = [];
let gallerySlideshowIndex = 0;
let gallerySlideshowInterval = null;
let isAnimating = false;

function addImageToImagesTab(media) {
    const wrapper = $('<div>').addClass('media-wrapper');
    const img = $('<img>')
        .attr('src', media.url)
        .addClass('img-fluid rounded')
        .css('width', '235px')
        .attr('title', media.filename)
        .on('click', function () {
            const index = images.findIndex(m => m.url === media.url);
            if (index !== -1) openFullscreen(index, 'image');
        });

    wrapper.append(img);
    mediaContainer.append(wrapper);
}

function addVideoToVideosTab(media) {
    const wrapper = $('<div>').addClass('media-wrapper');
    const video = $('<video>')
        .attr({
            src: media.url,
            controls: true,
            autoplay: true,
            muted: true,
            loop: false
        })
        .addClass('img-fluid rounded')
        .css('width', '235px')
        .on('click', function () {
            const index = videos.findIndex(m => m.url === media.url);
            if (index !== -1) openFullscreen(index, 'video');
        });

    wrapper.append(video);
    videoContainer.append(wrapper);
}

function setupGallery() {
    if (images.length === 0) return;

    galleryThumbnails.empty();

    images.forEach((media, idx) => {
        const thumb = $('<img>')
            .attr('src', media.url)
            .attr('title', media.filename)
            .addClass('img-thumbnail')
            .toggleClass('selected', idx === 0)
            .on('click', function () {
                clearInterval(gallerySlideshowInterval);
                gallerySlideshowIndex = idx;
                setGalleryBackground(media.url);
                updateThumbnailSelection(idx);
            });

        galleryThumbnails.append(thumb);
    });

    setGalleryBackground(images[0].url);
    updateThumbnailSelection(0);
}

function updateThumbnailSelection(index) {
    galleryThumbnails.find('img').each(function (i) {
        $(this).toggleClass('selected', i === index);
    });

    const selectedThumb = galleryThumbnails.find('.selected');
    if (selectedThumb.length) {
        selectedThumb[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function setGalleryBackground(url) {
    if (isAnimating) return;
    isAnimating = true;

    galleryBackground.css('opacity', 0);
    setTimeout(() => {
        galleryBackground.css('background-image', `url('${url}')`);
        galleryBackground.css('opacity', 1);
        setTimeout(() => {
            isAnimating = false;
        }, 1000);
    }, 500);
}

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

tabs.on('click', function (e) {
    e.preventDefault();
    tabs.removeClass('active');
    $(this).addClass('active');

    const target = $(this).data('tab');

    mediaContainer.removeClass('active');
    videoContainer.removeClass('active');
    galleryContainer.removeClass('active');
    clearInterval(gallerySlideshowInterval);

    if (target === 'imagesTab') {
        mediaContainer.addClass('active');
    } else if (target === 'videosTab') {
        videoContainer.addClass('active');
    } else if (target === 'galleryTab') {
        galleryContainer.addClass('active');
        startGallerySlideshow();
    }
});

processZipBtn.on('click', async function () {
    const files = zipInput[0].files;
    if (!files.length) {
        alert('Please select at least one ZIP file.');
        return;
    }

    images = [];
    videos = [];
    mediaContainer.empty();
    videoContainer.empty();
    galleryThumbnails.empty();
    galleryBackground.css({ 'background-image': '', 'opacity': 0 });
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

            if (images.length > 0) {
                $('#imagesCount').text(images.length);
            }

            if (videos.length > 0) {
                $('#videosCount').text(videos.length);
            }

            if (images.length > 0 || videos.length > 0) {
                var count = images.length + videos.length;
                $('#fileCount').text(count);
            }
        } catch (err) {
            console.error(`Error reading ZIP file: ${file.name}`, err);
            alert(`Error reading ZIP file: ${file.name}. Please ensure it's a valid ZIP archive.`);
        }
    }

    setupGallery();

    tabs.removeClass('active');
    $('.tab[data-tab="imagesTab"]').addClass('active');
    mediaContainer.addClass('active');
});

// Fullscreen handling
const fullscreenOverlay = $('#fullscreenOverlay');
const fullscreenImage = $('#fullscreenImage');
const fullscreenVideo = $('#fullscreenVideo');
const fsNextBtn = $('#fsNextBtn');
const fsPrevBtn = $('#fsPrevBtn');
const fsCloseBtn = $('#fsCloseBtn');

let fullscreenIndex = 0;
let fullscreenMediaType = 'image';

function openFullscreen(index, type) {
    fullscreenIndex = index;
    fullscreenMediaType = type;

    if (type === 'image') {
        fullscreenVideo.hide().get(0).pause();
        fullscreenImage.attr('src', images[index].url).show();
    } else if (type === 'video') {
        fullscreenImage.hide();
        fullscreenVideo.attr('src', videos[index].url).show().get(0).play();
    }

    fullscreenOverlay.css('display', 'flex');
}

function closeFullscreen() {
    fullscreenOverlay.hide();
    fullscreenVideo.get(0).pause();
    fullscreenVideo.attr('src', '');
    fullscreenImage.attr('src', '');
}

function showNextMedia() {
    if (fullscreenMediaType === 'image' && images.length) {
        fullscreenIndex = (fullscreenIndex + 1) % images.length;
        fullscreenImage.attr('src', images[fullscreenIndex].url);
    } else if (fullscreenMediaType === 'video' && videos.length) {
        fullscreenIndex = (fullscreenIndex + 1) % videos.length;
        fullscreenVideo.attr('src', videos[fullscreenIndex].url);
        fullscreenVideo.get(0).play();
    }
}

function showPrevMedia() {
    if (fullscreenMediaType === 'image' && images.length) {
        fullscreenIndex = (fullscreenIndex - 1 + images.length) % images.length;
        fullscreenImage.attr('src', images[fullscreenIndex].url);
    } else if (fullscreenMediaType === 'video' && videos.length) {
        fullscreenIndex = (fullscreenIndex - 1 + videos.length) % videos.length;
        fullscreenVideo.attr('src', videos[fullscreenIndex].url);
        fullscreenVideo.get(0).play();
    }
}

fsNextBtn.on('click', function (e) {
    e.stopPropagation();
    showNextMedia();
});
fsPrevBtn.on('click', function (e) {
    e.stopPropagation();
    showPrevMedia();
});
fsCloseBtn.on('click', closeFullscreen);
fullscreenOverlay.on('click', function (e) {
    if (e.target === this) closeFullscreen();
});