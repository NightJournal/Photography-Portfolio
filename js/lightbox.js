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
      top: 18px;
      right: 18px;
      width: 44px;
      height: 44px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      background: rgba(0, 0, 0, 0.35);
      color: #fff;
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      display: grid;
      place-items: center;
    }
    .photo-lightbox button:hover {
      background: rgba(255, 255, 255, 0.14);
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
    <button type="button" aria-label="Close expanded photo">&times;</button>
    <img alt="">
  `;
  document.body.appendChild(lightbox);

  const fullImage = lightbox.querySelector("img");
  const closeButton = lightbox.querySelector("button");

  const close = () => {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    fullImage.removeAttribute("src");
  };

  photos.forEach((photo) => {
    photo.closest(".photo-card").addEventListener("click", () => {
      fullImage.src = photo.currentSrc || photo.src;
      fullImage.alt = photo.alt || "Expanded photo";
      lightbox.classList.add("is-open");
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      close();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      close();
    }
  });
})();
