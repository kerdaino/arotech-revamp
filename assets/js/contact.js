(function () {
  const form = document.querySelector("form[data-contact-form]");
  if (!form) return;

  const successBox = document.getElementById("formSuccess");
  const errorBox = document.getElementById("formError");
  const successText = document.querySelector("[data-success-text]");
  const errorText = document.querySelector("[data-error-text]");
  const btn = form.querySelector('button[type="submit"]');

  function hideAll() {
    if (successBox) successBox.classList.add("hidden");
    if (errorBox) errorBox.classList.add("hidden");
    if (errorText) errorText.textContent = "";
  }

  function showSuccess(msg) {
    hideAll();
    if (successText) successText.textContent =
      msg || "Your message has been sent successfully. We will get back to you soon.";
    if (successBox) successBox.classList.remove("hidden");
  }

  function showError(msg) {
    hideAll();
    if (errorText) errorText.textContent = msg || "Failed to send. Please try again.";
    if (errorBox) errorBox.classList.remove("hidden");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAll();

    if (btn) {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent;
      btn.textContent = "Sending...";
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: new FormData(form)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        showSuccess(data.message);
        form.reset();
      } else {
        showError(data.message);
      }
    } catch (err) {
      showError("Network error. Please try again.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || "Send Message";
      }
    }
  });
})();
