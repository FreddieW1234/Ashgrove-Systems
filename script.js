/* =========================================================
   Ashgrove Systems — interactions
   GSAP + ScrollTrigger + Lenis (all optional: the page works
   without them, and all motion respects prefers-reduced-motion).
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var hasST = hasGsap && typeof window.ScrollTrigger !== "undefined";
  var hasLenis = typeof window.Lenis !== "undefined";

  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var header = document.querySelector(".site-header");
  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- smooth scrolling (Lenis) ---------- */
  var lenis = null;
  if (hasLenis && !reduceMotion) {
    document.documentElement.style.scrollBehavior = "auto";
    lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", function () { if (hasST) ScrollTrigger.update(); });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  function scrollToHash(hash) {
    var target = hash === "#top" ? document.body : document.querySelector(hash);
    if (!target) return false;
    var offset = -(header ? header.offsetHeight : 0) + 1;
    if (lenis) {
      lenis.scrollTo(target, {
        offset: offset, duration: 1.2,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
      });
    } else {
      var top = target.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    }
    return true;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var hash = a.getAttribute("href");
      if (!hash || hash === "#") return;
      closeNav();
      if (scrollToHash(hash)) {
        e.preventDefault();
        if (history.pushState) history.pushState(null, "", hash);
      }
    });
  });

  /* ---------- header state + mobile nav ---------- */
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeNav() {
    if (!header || !navToggle) return;
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
    window.addEventListener("resize", function () { if (window.innerWidth > 960) closeNav(); });
  }

  /* ---------- active nav link ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll("a")) : [];
  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        navLinks.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === id); });
      });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- copy email ---------- */
  var copyBtn = document.getElementById("copyEmail");
  if (copyBtn) {
    var label = copyBtn.querySelector(".copy-label");
    var resetTimer;
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email") || "";
      var done = function () {
        copyBtn.classList.add("is-copied");
        if (label) label.textContent = "Copied";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
          copyBtn.classList.remove("is-copied");
          if (label) label.textContent = "Copy";
        }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(function () { fallbackCopy(email, done); });
      } else {
        fallbackCopy(email, done);
      }
    });
  }
  function fallbackCopy(text, cb) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    cb();
  }

  /* ---------- hero order-flow animation ---------- */
  var flow = document.getElementById("flow");
  var steps = flow ? Array.prototype.slice.call(flow.querySelectorAll(".flow-step")) : [];
  var packet = document.getElementById("flowPacket");
  var railFill = document.getElementById("flowRailFill");
  var rail = flow ? flow.querySelector(".flow-rail") : null;
  var flowTl = null;

  function setStatus(step, state) {
    var s = step.querySelector(".flow-status");
    if (!s) return;
    s.textContent = s.getAttribute(state === "done" ? "data-done" : "data-idle");
  }

  function resetFlow() {
    steps.forEach(function (st) { st.classList.remove("is-active", "is-done"); setStatus(st, "idle"); });
  }

  function buildFlow() {
    if (!flow || !steps.length || !packet || !rail) return;
    if (flowTl) { flowTl.kill(); flowTl = null; }
    resetFlow();

    if (reduceMotion || !hasGsap) {
      // Static end state: everything done.
      steps.forEach(function (st) { st.classList.add("is-done"); setStatus(st, "done"); });
      return;
    }

    var railRect = rail.getBoundingClientRect();
    var ys = steps.map(function (st) {
      var icon = st.querySelector(".flow-icon").getBoundingClientRect();
      return icon.top + icon.height / 2 - railRect.top;
    });
    var railH = railRect.height || 1;

    gsap.set(packet, { y: ys[0], opacity: 0 });
    gsap.set(railFill, { scaleY: 0 });

    flowTl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, defaults: { ease: "power2.inOut" } });
    flowTl.to(packet, { opacity: 1, duration: 0.3 });

    steps.forEach(function (st, i) {
      var activate = function () {
        steps.forEach(function (o, j) {
          o.classList.toggle("is-active", j === i);
          if (j < i) { o.classList.add("is-done"); setStatus(o, "done"); }
        });
        setStatus(st, "done");
      };
      if (i > 0) {
        flowTl.to(packet, { y: ys[i], duration: 0.75 });
        flowTl.to(railFill, { scaleY: ys[i] / railH, duration: 0.75 }, "<");
      }
      flowTl.call(activate);
      flowTl.to({}, { duration: 0.9 });
    });

    flowTl.call(function () {
      steps.forEach(function (o) { o.classList.remove("is-active"); o.classList.add("is-done"); });
    });
    flowTl.to(packet, { opacity: 0, duration: 0.4 }, "+=0.6");
    flowTl.to(railFill, { scaleY: 0, duration: 0.6, ease: "power2.in" }, "<");
    flowTl.call(resetFlow);
    flowTl.set(packet, { y: ys[0] });
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildFlow, 180);
  });

  /* ---------- entrance + scroll animations ---------- */
  function initMotion() {
    if (!hasGsap || reduceMotion) { buildFlow(); return; }

    // Hero entrance
    var heroItems = gsap.utils.toArray("[data-hero]").filter(function (el) {
      return !el.classList.contains("hero-title") && !el.classList.contains("hero-visual");
    });
    var lines = gsap.utils.toArray(".hero-title .line > span");
    var tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: buildFlow });
    tl.from(heroItems, { y: 28, opacity: 0, duration: 0.9, stagger: 0.12 }, 0.1);
    tl.from(lines, { yPercent: 110, duration: 1.1, stagger: 0.1, ease: "power4.out" }, 0.15);
    tl.from(".hero-visual", { y: 50, opacity: 0, scale: 0.96, duration: 1.2, ease: "power3.out" }, 0.4);

    if (!hasST) return;

    // Generic reveals
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.from(el, {
        y: 40, opacity: 0, duration: 1, ease: "power3.out", clearProps: "transform,willChange",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    // Step line fill
    var stepFill = document.getElementById("stepLineFill");
    if (stepFill) {
      gsap.to(stepFill, {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 60%", scrub: 0.6 }
      });
    }

    // Background glow parallax
    gsap.to(".glow-1", { yPercent: 30, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 1 } });
    gsap.to(".glow-2", { yPercent: -25, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 1 } });

    // Hero visual drifts slightly as you leave the hero
    gsap.to(".hero-visual", { y: -40, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });

  }

  /* ---------- cursor-tracked glow + tilt on cards ---------- */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".service-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });

    if (hasGsap) {
      document.querySelectorAll(".about-card").forEach(function (el) {
        var setRX = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
        var setRY = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
        gsap.set(el, { transformPerspective: 1200 });
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          setRX(-py * 6); setRY(px * 8);
        });
        el.addEventListener("pointerleave", function () { setRX(0); setRY(0); });
      });
    }
  }

  /* ---------- go ---------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initMotion, initMotion);
  } else {
    initMotion();
  }
})();
