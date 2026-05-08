(() => {
  const photos = Array.from(document.querySelectorAll(".photo-card img"));

  if (!photos.length) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .photo-card { cursor: zoom-in; }
    .photo-lightbox {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      padding: 24px;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(6px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 180ms ease;
    }
    .photo-lightbox.is-open {
      opacity: 1;
      pointer-events: auto;
    }
    .photo-lightbox img {
      max-width: min(94vw, 1400px);
      max-height: 88vh;
      width: auto;
      height: auto;
      object-fit: contain;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
    }
    .photo-lightbox button {
      position: fixed;
      border: 0;
      background: transparent;
      color: #fff;
      line-height: 1;
      cursor: pointer;
      display: grid;
      place-items: center;
      text-shadow: 0 2px 14px rgba(0, 0, 0, 0.65);
      transition: opacity 160ms ease;
    }
    .photo-lightbox button:hover {
      opacity: 0.68;
    }
    .lightbox-close {
      top: 18px;
      right: 18px;
      width: 44px;
      height: 44px;
      font-size: 34px;
    }
    .lightbox-nav {
      top: 50%;
      width: 58px;
      height: 92px;
      transform: translateY(-50%);
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 74px;
      font-weight: 300;
    }
    .lightbox-prev {
      left: 14px;
    }
    .lightbox-next {
      right: 14px;
    }
    @media (max-width: 560px) {
      .photo-lightbox {
        padding: 14px;
      }
      .photo-lightbox img {
        max-width: 96vw;
        max-height: 82vh;
      }
      .lightbox-nav {
        width: 46px;
        height: 74px;
        font-size: 54px;
      }
    }
    body.lightbox-open {
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);

  const lightbox = document.createElement("div");
  lightbox.className = "photo-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Expanded photo");
  lightbox.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close expanded photo">&times;</button>
    <button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous photo">&#8249;</button>
    <img alt="">
    <button type="button" class="lightbox-nav lightbox-next" aria-label="Next photo">&#8250;</button>
  `;
  document.body.appendChild(lightbox);

  const fullImage = lightbox.querySelector("img");
  const closeButton = lightbox.querySelector(".lightbox-close");
  const prevButton = lightbox.querySelector(".lightbox-prev");
  const nextButton = lightbox.querySelector(".lightbox-next");
  let activeIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  const showPhoto = (index) => {
    activeIndex = (index + photos.length) % photos.length;
    const photo = photos[activeIndex];
    fullImage.src = photo.dataset.fullSrc || photo.currentSrc || photo.src;
    fullImage.alt = photo.alt || "Expanded photo";
  };

  const close = () => {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    fullImage.removeAttribute("src");
  };

  photos.forEach((photo) => {
    photo.closest(".photo-card").addEventListener("click", () => {
      showPhoto(photos.indexOf(photo));
      lightbox.classList.add("is-open");
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", close);
  prevButton.addEventListener("click", () => showPhoto(activeIndex - 1));
  nextButton.addEventListener("click", () => showPhoto(activeIndex + 1));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      close();
    }
  });
  lightbox.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });
  lightbox.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      showPhoto(activeIndex + (deltaX < 0 ? 1 : -1));
    }
  }, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) {
      return;
    }

    if (event.key === "Escape") {
      close();
    }

    if (event.key === "ArrowLeft") {
      showPhoto(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      showPhoto(activeIndex + 1);
    }
  });
})();
