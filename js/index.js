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
    // Determine width based on screen size
    const videoWidth = window.innerWidth <= 600 ? '75px' : '235px';

    const img = $('<img>')
        .attr('src', media.url)
        .addClass('img-fluid rounded')
        .css('width', videoWidth)
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
    // Determine width based on screen size
    const videoWidth = window.innerWidth <= 600 ? '75px' : '235px';

    const video = $('<video>')
        .attr({
            src: media.url,
            controls: true,
            autoplay: true,
            muted: true,
            loop: false
        })
        .addClass('img-fluid rounded')
        .css('width', videoWidth)
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


// Pagination variables
let imagesPage = 1, videosPage = 1;
const IMAGES_PER_PAGE = 20, VIDEOS_PER_PAGE = 10;

// Pagination controls (add these elements in your HTML as needed)
const imagesPagination = $('#imagesPagination');
const videosPagination = $('#videosPagination');

function renderImagesPage(page = 1) {
    mediaContainer.empty();
    const start = (page - 1) * IMAGES_PER_PAGE;
    const end = start + IMAGES_PER_PAGE;
    images.slice(start, end).forEach(addImageToImagesTab);
    renderImagesPagination();
}

function renderVideosPage(page = 1) {
    videoContainer.empty();
    const start = (page - 1) * VIDEOS_PER_PAGE;
    const end = start + VIDEOS_PER_PAGE;
    videos.slice(start, end).forEach(addVideoToVideosTab);
    renderVideosPagination();
}
function renderImagesPagination() {
    imagesPagination.empty();
    const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);
    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = $('<button>')
        .addClass('page-btn btn-light px-1')
        .prop('disabled', imagesPage === 1)
        .text('Prev')
        .on('click', function () {
            if (imagesPage > 1) {
                imagesPage--;
                renderImagesPage(imagesPage);
            }
        });
    imagesPagination.append(prevBtn);

    // Page numbers (show max 5)
    let startPage = Math.max(1, imagesPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    for (let i = startPage; i <= endPage; i++) {
        const btn = $('<button>')
            .addClass('page-btn btn-light px-1')
            .toggleClass('active', i === imagesPage)
            .text(i)
            .on('click', function () {
                imagesPage = i;
                renderImagesPage(imagesPage);
            });
        imagesPagination.append(btn);
    }

    // Next button
    const nextBtn = $('<button>')
        .addClass('page-btn btn-light px-1')
        .prop('disabled', imagesPage === totalPages)
        .text('Next')
        .on('click', function () {
            if (imagesPage < totalPages) {
                imagesPage++;
                renderImagesPage(imagesPage);
            }
        });
    imagesPagination.append(nextBtn);
}

function renderVideosPagination() {
    videosPagination.empty();
    const totalPages = Math.ceil(videos.length / VIDEOS_PER_PAGE);
    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = $('<button>')
        .addClass('page-btn  btn-light px-1')
        .prop('disabled', videosPage === 1)
        .text('Prev')
        .on('click', function () {
            if (videosPage > 1) {
                videosPage--;
                renderVideosPage(videosPage);
            }
        });
    videosPagination.append(prevBtn);

    // Page numbers (show max 5)
    let startPage = Math.max(1, videosPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    for (let i = startPage; i <= endPage; i++) {
        const btn = $('<button>')
            .addClass('page-btn  btn-light px-1')
            .toggleClass('active', i === videosPage)
            .text(i)
            .on('click', function () {
                videosPage = i;
                renderVideosPage(videosPage);
            });
        videosPagination.append(btn);
    }

    // Next button
    const nextBtn = $('<button>')
        .addClass('page-btn  btn-light px-1')
        .prop('disabled', videosPage === totalPages)
        .text('Next')
        .on('click', function () {
            if (videosPage < totalPages) {
                videosPage++;
                renderVideosPage(videosPage);
            }
        });
    videosPagination.append(nextBtn);
}

processZipBtn.on('click', async function () {
    const files = zipInput[0].files;
    if (!files.length) {
        alert('Please select at least one ZIP file.');
        return;
    }

    images = [];
    videos = [];
    imagesPage = 1;
    videosPage = 1;
    mediaContainer.empty();
    videoContainer.empty();
    imagesPagination.empty();
    videosPagination.empty();
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
                    } else {
                        videos.push(media);
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

    renderImagesPage(imagesPage);
    renderVideosPage(videosPage);
    setupGallery();

    tabs.removeClass('active');
    $('.tab[data-tab="imagesTab"]').addClass('active');
    mediaContainer.addClass('active');
});

// When switching tabs, re-render the correct page
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
        renderImagesPage(imagesPage);
        mediaContainer.addClass('active');
        $('#imagesPagination').removeClass('d-none');
    } else if (target === 'videosTab') {
        renderVideosPage(videosPage);
        videoContainer.addClass('active');
        $('#imagesPagination').addClass('d-none');
        $('#videosPagination').removeClass('d-none');
    } else if (target === 'galleryTab') {
        galleryContainer.addClass('active');
        startGallerySlideshow();
    }
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