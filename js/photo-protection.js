(() => {
  const protectedSelectors = [
    "img",
    ".photo-card",
    ".category-card",
    ".trip-photo",
    ".hero-visual",
    ".page-banner",
    ".hero-media"
  ];

  const protectedSelector = protectedSelectors.join(",");

  const protectImages = () => {
    document.querySelectorAll("img").forEach((image) => {
      image.setAttribute("draggable", "false");
      image.setAttribute("oncontextmenu", "return false");
    });
  };

  protectImages();

  document.addEventListener("contextmenu", (event) => {
    if (event.target.closest(protectedSelector)) {
      event.preventDefault();
    }
  });

  document.addEventListener("dragstart", (event) => {
    if (event.target.closest(protectedSelector)) {
      event.preventDefault();
    }
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const isSaveShortcut = (event.metaKey || event.ctrlKey) && ["s", "u", "p"].includes(key);

    if (isSaveShortcut) {
      event.preventDefault();
    }
  });
})();
