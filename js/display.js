// Display Wall — Real-time Image Grid (4200 × 1512)

const WALL_WIDTH = 4200;
const WALL_HEIGHT = 1512;
const ASPECT = WALL_WIDTH / WALL_HEIGHT; // ~2.778

const emptyState = document.getElementById('emptyState');
const qrCorner = document.getElementById('qrCorner'); // We'll hide this now since no mobile

// Hide QR corner since we manage via local folder now
if (qrCorner) qrCorner.style.display = 'none';

const displayScaler = document.getElementById('displayScaler');
// All 5 image zones: 3 pillars + 2 top zones above walkways
const zones = [
  document.getElementById('pillar1'),
  document.getElementById('topZone1'),
  document.getElementById('pillar2'),
  document.getElementById('topZone2'),
  document.getElementById('pillar3')
];

let currentImages = [];
let currentIndex = 0;
let slideshowInterval = null;
const SLIDE_DURATION_MS = 3000; // 3 seconds per image

// ── Shuffle Array (Fisher-Yates) ───────────────
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ── Scale display to fit browser window ─────────
function scaleToFit() {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const scaleX = winW / WALL_WIDTH;
  const scaleY = winH / WALL_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  displayScaler.style.transform = `scale(${scale})`;

  const scaledW = WALL_WIDTH * scale;
  const scaledH = WALL_HEIGHT * scale;
  const offsetX = (winW - scaledW) / 2;
  const offsetY = (winH - scaledH) / 2;
  displayScaler.style.marginLeft = offsetX + 'px';
  displayScaler.style.marginTop = offsetY + 'px';
}

window.addEventListener('resize', scaleToFit);
scaleToFit();

// ── Slideshow Logic ─────────────────────────────
function startSlideshow() {
  if (slideshowInterval) clearInterval(slideshowInterval);
  slideshowInterval = setInterval(showNextSlide, SLIDE_DURATION_MS);
  showNextSlide();
}

function showNextSlide() {
  if (currentImages.length === 0) return;

  // 5 zones = 5 images at a time
  for (let i = 0; i < 5; i++) {
    const container = zones[i];
    const imgData = currentImages[(currentIndex + i) % currentImages.length];

    const existingSlides = container.querySelectorAll('.slide');
    existingSlides.forEach(slide => {
      slide.classList.remove('active'); // Fade it out
      setTimeout(() => slide.remove(), 1600); // Remove after fade completes
    });

    const newSlide = document.createElement('div');
    newSlide.className = 'slide';

    const imgEl = document.createElement('img');
    imgEl.src = imgData.url;
    imgEl.alt = 'Wall photo';
    imgEl.draggable = false;

    newSlide.appendChild(imgEl);
    container.appendChild(newSlide);

    void newSlide.offsetWidth;
    newSlide.classList.add('active'); // Fade it in
  }

  // Advance by 5 for next tick
  currentIndex += 5;

  // If we reached the end, reshuffle and start over
  if (currentIndex >= currentImages.length) {
    shuffleArray(currentImages);
    currentIndex = 0;
  }
}

// ── Render Data ─────────────────────────────────
function updateData(images) {
  const count = images.length;
  currentImages = images;

  if (count === 0) {
    emptyState.classList.remove('hidden');
    zones.forEach(z => z.innerHTML = '');
    if (slideshowInterval) clearInterval(slideshowInterval);
    return;
  }

  emptyState.classList.add('hidden');

  // Initial shuffle
  shuffleArray(currentImages);

  // If slideshow isn't running or pillars are empty, start it
  if (count > 0 && (!slideshowInterval || zones[0].children.length === 0)) {
    currentIndex = 0;
    startSlideshow();
  }
}

// ── Local File Reading Logic ──────────────────────
const folderInput = document.getElementById('folderInput');
const setFolderBtn = document.getElementById('setFolderBtn');
const folderError = document.getElementById('folderError');

if (setFolderBtn && folderInput) {
  // Clicking the big button clicks the hidden file input
  setFolderBtn.addEventListener('click', () => {
    folderInput.click();
  });

  // When files are selected
  folderInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);

    // Filter only images
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      folderError.textContent = 'No images found in that folder!';
      folderError.style.display = 'block';
      return;
    }

    folderError.style.display = 'none';

    // Create a local URL for each image
    const images = imageFiles.map((file, index) => ({
      id: index,
      url: URL.createObjectURL(file),
      timestamp: Date.now()
    }));

    // Start slideshow
    updateData(images);
  });
}

// ── Fullscreen Toggle ───────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.key === '1') {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
});
