(() => {
  const form = document.querySelector(".contact-form");
  const recipient = "hho.explore@gmail.com";

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const data = new FormData(form);
    const firstName = data.get("first-name").trim();
    const lastName = data.get("last-name").trim();
    const email = data.get("email").trim();
    const subject = data.get("subject").trim();
    const message = data.get("message").trim();
    const body = [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      "",
      message
    ].join("\n");

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
