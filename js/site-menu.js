(() => {
  const instagramUrl = "https://www.instagram.com/hhanley.explore_/";
  const scriptSource = document.currentScript?.getAttribute("src") || "";
  const rootPath = scriptSource.replace(/js\/site-menu\.js$/, "");
  const contactUrl = `${rootPath}contact.html`;
  const instagramIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="17" cy="7" r="1" fill="currentColor"/>
    </svg>
  `;
  const emailIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <path d="M5 8l7 5 7-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  document.querySelectorAll(".directory-panel").forEach((panel) => {
    if (panel.querySelector(".menu-socials")) {
      return;
    }

    const socials = document.createElement("div");
    socials.className = "menu-socials";
    socials.innerHTML = `
      <a class="menu-social-link instagram-link" href="${instagramUrl}" target="_blank" rel="noopener" aria-label="Instagram">${instagramIcon}</a>
      <a class="menu-social-link email-link" href="${contactUrl}" aria-label="Get in Touch">${emailIcon}</a>
    `;
    panel.appendChild(socials);
  });
})();
