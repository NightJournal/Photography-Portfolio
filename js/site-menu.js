(() => {
  const instagramUrl = "https://www.instagram.com/hhanley.explore_/";
  const instagramIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="17" cy="7" r="1" fill="currentColor"/>
    </svg>
  `;

  document.querySelectorAll(".directory-panel").forEach((panel) => {
    if (panel.querySelector(".instagram-link")) {
      return;
    }

    const link = document.createElement("a");
    link.className = "instagram-link";
    link.href = instagramUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", "Instagram");
    link.innerHTML = instagramIcon;
    panel.appendChild(link);
  });
})();
