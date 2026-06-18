/**
 * BuGuBlog — Photo Stack component.
 * Renders a stack of photos with flip-through interaction and lazy loading.
 *
 * @module photo-stack
 */

const VISIBLE_LAYERS = 5;
const POSITION_CLASSES = [
  'pos-top',
  'pos-second',
  'pos-third',
  'pos-fourth',
  'pos-below',
  'pos-hidden',
];

/**
 * Initialise a single photo-stack instance.
 * @param {HTMLElement} container - The `.photo-stack` root element.
 */
export function initPhotoStack(container) {
  const dataEl = container.querySelector('.photo-stack-data');
  if (!dataEl) return;

  /** @type {{ src: string, label: string }[]} */
  let photos;
  try {
    photos = JSON.parse(dataEl.textContent || '[]');
  } catch (_) {
    return;
  }
  if (photos.length === 0) return;

  const stackTrack = container.querySelector('.stack-track');
  const counterEl = container.querySelector('.stack-counter');
  const navPrev = container.querySelector('.stack-nav.prev');
  const navNext = container.querySelector('.stack-nav.next');

  if (!stackTrack) return;

  let currentIndex = 0;
  /** @type {HTMLElement[]} */
  let cardElements = [];
  let isAnimating = false;
  /** @type {Set<number>} */
  const loadedIndices = new Set();

  /* ---------- Build DOM ---------- */
  function createCardElement(photo, index) {
    const card = document.createElement('div');
    card.className = 'stack-card';
    card.setAttribute('data-photo-index', String(index));

    const print = document.createElement('div');
    print.className = 'photo-print';

    const img = document.createElement('img');
    img.className = 'photo-image';
    img.dataset.src = photo.src;
    img.alt = photo.label || ('Photo ' + (index + 1));
    img.draggable = false;

    print.appendChild(img);

    if (photo.label) {
      const caption = document.createElement('span');
      caption.className = 'photo-caption';
      caption.textContent = photo.label;
      print.appendChild(caption);
    }

    card.appendChild(print);
    return card;
  }

  /** Load a single card's image from data-src. */
  function loadCardImage(card) {
    const img = card.querySelector('.photo-image');
    if (!img) return;
    const src = img.dataset.src;
    if (!src || img.src) return;
    img.src = src;
    img.removeAttribute('data-src');
  }

  /** Load images for cards in a range around the current index. */
  function loadRange(centerIndex, count) {
    for (let i = 0; i < count && i < photos.length; i++) {
      const idx = (centerIndex + i) % photos.length;
      if (loadedIndices.has(idx)) continue;
      loadedIndices.add(idx);
      const card = cardElements.find(
        c => parseInt(c.getAttribute('data-photo-index') || '') === idx
      );
      if (card) loadCardImage(card);
    }
  }

  function getVisiblePhotos(topIndex, count) {
    const result = [];
    for (let i = 0; i < count && i < photos.length; i++) {
      const idx = (topIndex + i) % photos.length;
      result.push({ photo: photos[idx], globalIndex: idx });
    }
    return result;
  }

  function assignPositions(topIndex) {
    const visible = getVisiblePhotos(topIndex, Math.min(VISIBLE_LAYERS + 1, photos.length));
    cardElements.forEach(card => {
      POSITION_CLASSES.forEach(cls => card.classList.remove(cls));
      card.classList.add('pos-hidden');
      card.style.pointerEvents = 'none';
      card.style.cursor = 'default';
    });

    visible.forEach((item, i) => {
      const card = cardElements.find(
        c => parseInt(c.getAttribute('data-photo-index') || '') === item.globalIndex
      );
      if (!card) return;
      const posClass = POSITION_CLASSES[Math.min(i, POSITION_CLASSES.length - 1)];
      card.classList.remove('pos-hidden');
      card.classList.add(posClass);
      if (i === 0) {
        card.style.pointerEvents = 'auto';
        card.style.cursor = 'pointer';
      } else {
        card.style.pointerEvents = 'none';
        card.style.cursor = 'default';
      }
    });
  }

  function renderAllCards() {
    stackTrack.innerHTML = '';
    cardElements = [];
    photos.forEach((photo, i) => {
      const card = createCardElement(photo, i);
      cardElements.push(card);
      stackTrack.appendChild(card);
    });
    assignPositions(currentIndex);
  }

  function updateUI() {
    if (counterEl) {
      counterEl.textContent = (currentIndex + 1) + ' / ' + photos.length;
    }
  }

  /* ---------- Flip logic ---------- */
  function flipToNext() {
    if (isAnimating || photos.length <= 1) return;
    isAnimating = true;

    const oldTopCard = cardElements.find(
      c => parseInt(c.getAttribute('data-photo-index') || '') === currentIndex
    );

    if (oldTopCard) {
      oldTopCard.classList.add('animating-out');
      oldTopCard.style.transform = 'translate(140px, 180px) rotate(18deg) scale(0.75)';
      oldTopCard.style.opacity = '0';
      oldTopCard.style.zIndex = '20';
      oldTopCard.style.pointerEvents = 'none';
      oldTopCard.style.cursor = 'default';
    }

    currentIndex = (currentIndex + 1) % photos.length;
    // Preload the next image about to come into view
    loadRange(currentIndex, VISIBLE_LAYERS + 1);

    const onEnd = () => {
      if (oldTopCard) {
        oldTopCard.removeEventListener('transitionend', onEnd);
        oldTopCard.classList.remove('animating-out');
        oldTopCard.style.transform = '';
        oldTopCard.style.opacity = '';
        oldTopCard.style.zIndex = '';
      }
      assignPositions(currentIndex);
      updateUI();
      isAnimating = false;
    };

    if (oldTopCard) {
      oldTopCard.addEventListener('transitionend', onEnd, { once: true });
      setTimeout(() => { if (isAnimating) onEnd(); }, 800);
    } else {
      assignPositions(currentIndex);
      updateUI();
      isAnimating = false;
    }
  }

  function flipToPrev() {
    if (isAnimating || photos.length <= 1) return;
    isAnimating = true;

    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    const incomingCard = cardElements.find(
      c => parseInt(c.getAttribute('data-photo-index') || '') === prevIndex
    );

    if (incomingCard) {
      incomingCard.classList.add('animating-out');
      incomingCard.style.transform = 'translate(-120px, -160px) rotate(-14deg) scale(0.7)';
      incomingCard.style.opacity = '0';
      incomingCard.style.zIndex = '20';
      incomingCard.style.pointerEvents = 'none';
      incomingCard.style.cursor = 'default';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          incomingCard.style.transform = 'translate(0, 0) rotate(0deg) scale(1)';
          incomingCard.style.opacity = '1';
        });
      });
    }

    currentIndex = prevIndex;
    loadRange(currentIndex, VISIBLE_LAYERS + 1);

    const onEnd = () => {
      if (incomingCard) {
        incomingCard.removeEventListener('transitionend', onEnd);
        incomingCard.classList.remove('animating-out');
        incomingCard.style.transform = '';
        incomingCard.style.opacity = '';
        incomingCard.style.zIndex = '';
      }
      assignPositions(currentIndex);
      updateUI();
      isAnimating = false;
    };

    if (incomingCard) {
      incomingCard.addEventListener('transitionend', onEnd, { once: true });
      setTimeout(() => { if (isAnimating) onEnd(); }, 800);
    } else {
      assignPositions(currentIndex);
      updateUI();
      isAnimating = false;
    }
  }

  /* ---------- Events ---------- */
  if (navNext) navNext.addEventListener('click', (e) => { e.stopPropagation(); flipToNext(); });
  if (navPrev) navPrev.addEventListener('click', (e) => { e.stopPropagation(); flipToPrev(); });

  container.addEventListener('click', (e) => {
    if (isAnimating) return;
    if (e.target.closest('.stack-nav')) return;
    if (e.target.closest('.photo-image')) return;
    flipToNext();
  });

  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      flipToNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      flipToPrev();
    }
  });

  /* ---------- Touch ---------- */
  let touchStartX = 0;
  let touchStartY = 0;
  container.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    container.classList.add('touch-active');
  }, { passive: true });
  container.addEventListener('touchend', (e) => {
    container.classList.remove('touch-active');
    if (isAnimating) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < -30) flipToNext();
      else if (dx > 30) flipToPrev();
    }
  });

  container.addEventListener('mouseenter', () => container.classList.add('touch-active'));
  container.addEventListener('mouseleave', () => container.classList.remove('touch-active'));

  /* ---------- Lazy load via IntersectionObserver ---------- */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadRange(currentIndex, VISIBLE_LAYERS + 1);
          observer.unobserve(container);
        }
      });
    },
    { rootMargin: '200px' }
  );
  observer.observe(container);

  /* ---------- Init ---------- */
  renderAllCards();
  updateUI();
}
