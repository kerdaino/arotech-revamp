(() => {
  const HEADER_TARGET_ID = "site-header";
  const FOOTER_TARGET_ID = "site-footer";

  const headerUrl = "/partials/header.html";
  const footerUrl = "/partials/footer.html";

  function normalizePath(pathname) {
    // Remove query/hash already excluded by pathname
    // Ensure it starts with /
    let p = pathname || "/";

    // Cloudflare pages routes: "/about" and "/about/" both possible
    // Normalize: no trailing slash except root
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

    return p;
  }

  function getRouteKey() {
    // Route key should match your hrefs in header/footer
    // Example: "/" "/about" "/services" ...
    return normalizePath(window.location.pathname);
  }

  function setActiveNav(containerEl) {
    const current = getRouteKey();

    // Map current route to href targets (in case you later add nested routes)
    // For now, direct match is enough.
    const links = containerEl.querySelectorAll('a[data-nav][href]');
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;

      // Only handle internal absolute paths ("/about", "/")
      if (!href.startsWith("/")) return;

      const linkPath = normalizePath(href);
      const isActive = (linkPath === current);

      // Add/remove active styling without redesign:
      // We ONLY add a class, your Tailwind already supports class-based styling.
      a.classList.toggle("text-brandBlue", isActive);
      a.classList.toggle("font-semibold", isActive);

      // Keep original hover classes intact; no removals.
      // Optional aria-current for accessibility
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function wireMobileNav(headerRoot) {
    const toggleBtn = headerRoot.querySelector("[data-mobile-toggle]");
    const mobileNav = headerRoot.querySelector("#mobileNav");

    if (!toggleBtn || !mobileNav) return;

    toggleBtn.addEventListener("click", () => {
      mobileNav.classList.toggle("hidden");
    });

    // Close menu when a link is clicked
    mobileNav.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      mobileNav.classList.add("hidden");
    });

    // Close menu on outside click
    document.addEventListener("click", (e) => {
      const clickedInsideHeader = headerRoot.contains(e.target);
      if (!clickedInsideHeader) mobileNav.classList.add("hidden");
    });

    // Close menu on resize to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) mobileNav.classList.add("hidden"); // lg breakpoint
    });
  }

  function setFooterYear(footerRoot) {
    const yearEl = footerRoot.querySelector("[data-year]");
    if (!yearEl) return;
    yearEl.textContent = String(new Date().getFullYear());
  }

  async function injectPartial(url, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return null;

    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      console.error(`Failed to load ${url}:`, res.status);
      return null;
    }

    const html = await res.text();
    target.innerHTML = html;

    // Return the injected root for further wiring
    return target;
  }

  async function initLayout() {
    try {
      const headerRoot = await injectPartial(headerUrl, HEADER_TARGET_ID);
      if (headerRoot) {
        setActiveNav(headerRoot);
        wireMobileNav(headerRoot);
      }

      const footerRoot = await injectPartial(footerUrl, FOOTER_TARGET_ID);
      if (footerRoot) {
        setFooterYear(footerRoot);
      }
    } catch (err) {
      console.error("Layout init error:", err);
    }
  }

  // Run after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLayout);
  } else {
    initLayout();
  }
})();
