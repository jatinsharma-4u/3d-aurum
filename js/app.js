(function () {
  "use strict";

  var T = window.TOUR;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(pointer: coarse)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger) && !reduced;
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  var ICON_360 = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="3.6" ry="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var ICON_AREA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 15v5h-5M4 4l7 7M20 20l-7-7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  // Panoramas cover ~200° x 112°, so the viewer must stay inside these bounds
  var HALF_H = T.haov / 2, HALF_V = T.vaov / 2;

  // Widest horizontal FOV that keeps the vertical FOV inside the image on this screen shape.
  // Tall phone screens need a much narrower hfov, otherwise black bars appear top and bottom.
  var WIDEST = 120; // widest comfortable view; wider starts to look fish-eyed
  function maxHfovFor(el) {
    if (!el.clientWidth || !el.clientHeight) return 100; // hidden/not laid out yet
    var aspect = el.clientWidth / Math.max(el.clientHeight, 1);
    var v = (T.vaov - 10) * Math.PI / 360;
    return Math.min(WIDEST, 2 * Math.atan(Math.tan(v) * aspect) * 180 / Math.PI);
  }
  function fitViewer(v, el, wanted) {
    if (!v || !el.clientWidth || !el.clientHeight) return;
    var max = maxHfovFor(el);
    v.setHfovBounds([Math.min(40, max), max]);
    v.setHfov(Math.min(wanted || v.getHfov(), max), false);
  }

  /* =========================================================
     Smooth scroll (Lenis) wired into GSAP ScrollTrigger
     ========================================================= */
  var lenis = null;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis && !isTouch) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -70 });
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href").length < 2) return;
    var el = document.querySelector(a.getAttribute("href"));
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
  });

  /* =========================================================
     Nav: transparent over hero, solid after; hides on scroll down
     ========================================================= */
  var nav = $("#nav"), bar = $("#mobileBar"), hero = $("#hero");
  var lastY = 0, tourOpen = false;
  function onScroll() {
    var y = window.scrollY, past = y > hero.offsetHeight - 80;
    nav.classList.toggle("solid", y > 40);
    nav.classList.toggle("hide", y > lastY && y > hero.offsetHeight && !tourOpen);
    bar.classList.toggle("show", past);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // Highlight the nav link of the section in view
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        $$(".nav-links a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["residence", "rooms", "tour360", "plan", "faq"].forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
  }

  /* =========================================================
     Rooms grid
     ========================================================= */
  var WIDE = { living: 1, balcony: 1 };
  $("#roomGrid").innerHTML = T.order.map(function (id) {
    var r = T.rooms[id];
    return '<button class="room' + (WIDE[id] ? " wide" : "") + '" data-open-tour="' + id + '" aria-label="Open ' + r.title + ' in 360°">' +
      '<img src="' + (WIDE[id] ? r.image.replace("panos/", "panos/card/") : r.thumb) + '" alt="" loading="lazy" decoding="async">' +
      '<span class="room-badge">' + ICON_360 + '360° view</span>' +
      '<span class="room-panel"><span><span class="room-name">' + r.title + '</span><span class="room-area">' + ICON_AREA + r.area + '</span></span>' +
      '<span class="room-go">' + ARROW + '</span></span></button>';
  }).join("");
  // Upgrade narrow cards to the sharp image once near the viewport
  if ("IntersectionObserver" in window) {
    var sharpIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var img = $("img", e.target), full = T.rooms[e.target.dataset.openTour].image.replace("panos/", "panos/card/");
        if (img.getAttribute("src") !== full) { var hi = new Image(); hi.onload = function () { img.src = full; }; hi.src = full; }
        sharpIO.unobserve(e.target);
      });
    }, { rootMargin: "300px" });
    $$(".room").forEach(function (c) { sharpIO.observe(c); });
  }

  /* =========================================================
     Floor plan (shared by the section and the tour mini-map)
     ========================================================= */
  var PLAN = [
    { id: "balcony",  x: 20,  y: 20,  w: 170, h: 46 },
    { id: "living",   x: 20,  y: 66,  w: 170, h: 122 },
    { id: "dining",   x: 190, y: 66,  w: 100, h: 84 },
    { id: "kitchen",  x: 290, y: 66,  w: 90,  h: 84 },
    { id: "master",   x: 20,  y: 188, w: 170, h: 92 },
    { id: "bathroom", x: 190, y: 188, w: 80,  h: 46 },
    { id: "bedroom2", x: 270, y: 188, w: 110, h: 92 }
  ];
  var SHORT = { living: "LIVING", dining: "DINING", kitchen: "KITCHEN", master: "MASTER BED", bedroom2: "BEDROOM 2", bathroom: "BATH", balcony: "BALCONY" };

  function planSVG() {
    var s = '<svg viewBox="0 0 400 300" role="group" aria-label="2 BHK floor plan">';
    s += '<g class="fp-furn" aria-hidden="true">' +
      '<rect x="34" y="120" width="70" height="26" rx="4"/><rect x="34" y="120" width="22" height="56" rx="4"/><rect x="120" y="128" width="40" height="22" rx="3"/>' +
      '<rect x="212" y="88" width="56" height="34" rx="4"/><circle cx="222" cy="82" r="4"/><circle cx="258" cy="82" r="4"/><circle cx="222" cy="128" r="4"/><circle cx="258" cy="128" r="4"/>' +
      '<rect x="300" y="74" width="72" height="12" rx="2"/><rect x="318" y="104" width="44" height="18" rx="2"/>' +
      '<rect x="52" y="206" width="62" height="56" rx="4"/><rect x="150" y="196" width="30" height="76" rx="2"/>' +
      '<rect x="300" y="208" width="52" height="48" rx="4"/><rect x="278" y="262" width="34" height="12" rx="2"/>' +
      '<rect x="62" y="30" width="34" height="22" rx="4"/><circle cx="130" cy="42" r="10"/></g>';
    PLAN.forEach(function (r) {
      var room = T.rooms[r.id], cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      s += '<g class="fp-room" data-room="' + r.id + '" tabindex="0" role="button" aria-label="Open ' + room.title + ' in 360°">' +
        '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h + '"/>' +
        '<text x="' + cx + '" y="' + (cy - 1) + '">' + SHORT[r.id] + '</text>' +
        '<text class="fp-dim" x="' + cx + '" y="' + (cy + 11) + '">' + room.area + '</text></g>';
    });
    s += '<g class="fp-static" aria-hidden="true"><text x="285" y="172">PASSAGE</text><text x="230" y="260">BATH 2</text></g>';
    s += '<g class="fp-walls" aria-hidden="true">' +
      '<path d="M20 66H112M138 66H190M190 66V150M290 66V150M190 150H380M20 188H120M150 188H190V280M190 234H270M270 188V280M190 188H220M246 188H270M300 188H380"/>' +
      '<rect class="outer" x="20" y="20" width="360" height="260" rx="2"/></g>';
    s += '<g aria-hidden="true"><path class="fp-door" d="M112 66a26 26 0 0 1 26 0M120 188a30 30 0 0 0 30 0M220 188a26 26 0 0 0 26 0M270 188h30"/></g>';
    s += "</svg>";
    return s;
  }
  $("#planBig").innerHTML = planSVG();
  $("#miniPlan").innerHTML = planSVG();
  $("#planList").innerHTML = T.order.map(function (id) {
    return '<li><button data-open-tour="' + id + '" data-room-hl="' + id + '"><span>' + T.rooms[id].title + '</span><b>' + T.rooms[id].area + '</b></button></li>';
  }).join("");

  // Cross-highlight list rows and plan rooms
  function hl(id, on) {
    $$('#planBig .fp-room[data-room="' + id + '"], #planList [data-room-hl="' + id + '"]').forEach(function (el) { el.classList.toggle("hl", on); });
  }
  $$("#planList [data-room-hl], #planBig .fp-room").forEach(function (el) {
    var id = el.dataset.roomHl || el.dataset.room;
    el.addEventListener("mouseenter", function () { hl(id, true); });
    el.addEventListener("mouseleave", function () { hl(id, false); });
    el.addEventListener("focus", function () { hl(id, true); });
    el.addEventListener("blur", function () { hl(id, false); });
  });
  function markPlan(id) { $$(".fp-room").forEach(function (g) { g.classList.toggle("active", g.dataset.room === id); }); }

  /* =========================================================
     Design accordion (tabs)
     ========================================================= */
  var accItems = $$("#designList .acc-item");
  var dImg = $("#designImg"), dText = $("#designText");
  function selectAcc(btn) {
    accItems.forEach(function (b) { b.setAttribute("aria-selected", b === btn ? "true" : "false"); b.tabIndex = b === btn ? 0 : -1; });
    dImg.classList.add("swap");
    var next = new Image();
    next.onload = function () { dImg.src = btn.dataset.img; dImg.alt = btn.firstChild.textContent; requestAnimationFrame(function () { dImg.classList.remove("swap"); }); };
    next.src = btn.dataset.img;
    dText.textContent = btn.dataset.text;
  }
  accItems.forEach(function (b, i) {
    b.tabIndex = i === 0 ? 0 : -1;
    b.addEventListener("click", function () { selectAcc(b); });
    b.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = accItems[(i + d + accItems.length) % accItems.length];
      n.focus(); selectAcc(n);
    });
  });

  /* =========================================================
     Amenities gallery
     ========================================================= */
  var G = [
    { t: "Rooftop infinity pool", d: "A 25-metre edge pool on the 22nd floor with sunset loungers and a skyline view." },
    { t: "Grand double-height lobby", d: "Travertine, walnut and a sculptural brass chandelier welcome you home every evening." },
    { t: "Landscaped arrival plaza", d: "A reflecting pool, olive trees and palm-lined walkways at the tower entrance." }
  ];
  var gi = 0, gTimer = null, slides = $$(".g-slide"), thumbs = $$(".g-thumb");
  function showSlide(i) {
    gi = (i + G.length) % G.length;
    slides.forEach(function (s, k) { s.classList.toggle("active", k === gi); });
    thumbs.forEach(function (b, k) { b.classList.toggle("active", k === gi); b.setAttribute("aria-selected", k === gi ? "true" : "false"); });
    $("#gTitle").textContent = G[gi].t; $("#gText").textContent = G[gi].d; $("#gIdx").textContent = gi + 1;
  }
  function autoplay(on) {
    clearInterval(gTimer);
    if (on && !reduced) gTimer = setInterval(function () { showSlide(gi + 1); }, 6000);
  }
  $("#gPrev").addEventListener("click", function () { showSlide(gi - 1); autoplay(true); });
  $("#gNext").addEventListener("click", function () { showSlide(gi + 1); autoplay(true); });
  thumbs.forEach(function (b) { b.addEventListener("click", function () { showSlide(+b.dataset.i); autoplay(true); }); });
  var gal = $("#gallery");
  gal.addEventListener("mouseenter", function () { autoplay(false); });
  gal.addEventListener("mouseleave", function () { autoplay(true); });
  gal.addEventListener("focusin", function () { autoplay(false); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { autoplay(es[0].isIntersecting); }, { threshold: .3 }).observe(gal);
  }
  var sx = null;
  gal.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  gal.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) { showSlide(gi + (dx < 0 ? 1 : -1)); autoplay(true); }
  });

  /* FAQ: keep one open at a time */
  $$(".faq details").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) $$(".faq details").forEach(function (o) { if (o !== d) o.open = false; });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* =========================================================
     Lead form with inline validation
     ========================================================= */
  var form = $("#leadForm");
  function check(input) {
    var err = $("#" + input.getAttribute("aria-describedby")), msg = "";
    if (input.name === "name" && input.value.trim().length < 2) msg = "Please enter your name.";
    if (input.name === "phone" && input.value.replace(/\D/g, "").length < 10) msg = "Enter a 10-digit mobile number, e.g. 98765 43210.";
    err.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  [form.name, form.phone].forEach(function (inp) {
    inp.addEventListener("blur", function () { if (inp.value) check(inp); });
    inp.addEventListener("input", function () { if (inp.getAttribute("aria-invalid") === "true") check(inp); });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var okName = check(form.name), okPhone = check(form.phone);
    if (!okName) { form.name.focus(); return; }
    if (!okPhone) { form.phone.focus(); return; }
    var btn = $("#formBtn");
    btn.disabled = true; btn.textContent = "Sending…";
    // Demo only: connect to Formspree / Google Sheets / CRM for real leads
    setTimeout(function () {
      $("#formMsg").textContent = "Thank you, " + form.name.value.trim().split(" ")[0] + "! We'll call you within one working day.";
      form.reset(); btn.disabled = false; btn.textContent = "Request a call back";
    }, 700);
  });

  /* Footer newsletter (demo only) */
  var news = $("#newsForm");
  news.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(news.email.value.trim());
    $("#newsMsg").textContent = ok ? "You're subscribed. We'll only email you about launches and visit days." : "Please enter a valid email, e.g. name@gmail.com.";
    news.email.setAttribute("aria-invalid", ok ? "false" : "true");
    if (ok) news.reset(); else news.email.focus();
  });

  /* =========================================================
     Statement words + count-up numbers
     ========================================================= */
  $$(".reveal-words").forEach(function (p) {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
  });
  function countUp(el) {
    var end = +el.dataset.count, sep = el.dataset.sep, t0 = null, dur = 1400;
    var fmt = function (n) { return sep ? n.toLocaleString("en-IN") : String(n); };
    if (reduced) { el.textContent = fmt(end); return; }
    (function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(end * e));
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  if ("IntersectionObserver" in window) {
    var cIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cIO.unobserve(e.target); } });
    }, { threshold: .6 });
    $$("[data-count]").forEach(function (el) { cIO.observe(el); });
  } else { $$("[data-count]").forEach(function (el) { el.textContent = el.dataset.count; }); }

  /* =========================================================
     Scroll animations (GSAP)
     ========================================================= */
  if (hasGsap) {
    // Hero intro
    gsap.from("#heroImg", { scale: 1.18, duration: 2.2, ease: "power3.out" });
    gsap.from(".hero-word .hw span", { yPercent: 110, duration: 1.3, ease: "power4.out", stagger: .07, delay: .15 });
    gsap.from(".hero-bottom > *", { y: 30, opacity: 0, duration: 1, ease: "power3.out", stagger: .1, delay: .55 });

    // Hero scroll: image drifts slower, brand word lifts away
    gsap.to("#heroMedia", { yPercent: 14, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-word", { yPercent: -40, opacity: 0, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "60% top", scrub: true } });

    // Statement: words turn from grey to ink as you scroll
    var words = $$(".reveal-words .w");
    ScrollTrigger.create({
      trigger: ".statement-text", start: "top 80%", end: "bottom 45%", scrub: true,
      onUpdate: function (st) {
        var n = Math.round(st.progress * words.length);
        words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
      }
    });

    // Generic fade-up reveals, staggered per group
    function rise(sel, opts) {
      $$(sel).forEach(function (group) {
        var self = opts && opts.self;
        gsap.from(self ? group : group.children, Object.assign({
          y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: .08,
          scrollTrigger: { trigger: group, start: "top 85%" }
        }, opts || {}));
      });
    }
    rise(".sec-head");
    rise(".trio");
    rise(".stats");
    rise(".room-grid");
    rise(".acc");
    rise(".faq-list");
    rise(".amen-list");
    rise(".plan-card", { self: true, y: 60 });
    rise(".design-view", { self: true });

    // Rounded media frames expand gently into place
    [".live-frame", ".gallery", ".cta-card"].forEach(function (sel) {
      gsap.fromTo(sel, { clipPath: "inset(6% 4% 6% 4% round 36px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 36px)", ease: "none",
        scrollTrigger: { trigger: sel, start: "top 95%", end: "top 35%", scrub: true }
      });
    });
    gsap.fromTo(".cta-bg", { yPercent: -8, scale: 1.16 }, { yPercent: 8, scale: 1.16, ease: "none", scrollTrigger: { trigger: ".cta-card", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".f-word", { yPercent: 40, opacity: 0, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ".footer", start: "top 80%" } });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  } else {
    $$(".reveal-words .w").forEach(function (w) { w.classList.add("on"); });
  }

  /* =========================================================
     Opened by double-click (file://)? Browsers block normal image
     files in WebGL there, so load the embedded copies instead.
     ========================================================= */
  var isFile = location.protocol === "file:";
  var panoReady = null;
  function whenPanos(cb) {
    if (!isFile || window.PANO_DATA) { cb(); return; }
    if (!panoReady) {
      panoReady = [];
      var s = document.createElement("script");
      s.src = "js/panos-data.js";
      s.onload = function () { panoReady.forEach(function (f) { f(); }); };
      document.head.appendChild(s);
    }
    panoReady.push(cb);
  }
  function panoSrc(id) { return isFile && window.PANO_DATA ? window.PANO_DATA[id] : T.rooms[id].image; }

  /* =========================================================
     Live 360 preview (desktop: draggable; touch: auto-pan only,
     so the page still scrolls normally under your thumb)
     ========================================================= */
  var previewViewer = null;
  function initPreview() {
    if (previewViewer || !window.pannellum) return;
    if (isFile && !window.PANO_DATA) { whenPanos(initPreview); return; }
    previewViewer = pannellum.viewer("previewPano", {
      type: "equirectangular", panorama: panoSrc("living"), autoLoad: true,
      haov: T.haov, vaov: T.vaov, minYaw: -HALF_H, maxYaw: HALF_H, minPitch: -HALF_V, maxPitch: HALF_V,
      avoidShowingBackground: true, showControls: false, compass: false,
      hfov: 95, pitch: -2, yaw: -40,
      mouseZoom: false, keyboardZoom: false, draggable: !isTouch, friction: .12,
      autoRotate: reduced ? 0 : -4, autoRotateInactivityDelay: 2500
    });
    var pp = $("#previewPano");
    fitViewer(previewViewer, pp, 95);
    window.addEventListener("resize", function () { fitViewer(previewViewer, pp, 95); });
    previewViewer.on("load", function () { fitViewer(previewViewer, pp, 95); $("#previewFrame").classList.add("ready"); });
    if (isTouch) $("#previewPano").style.pointerEvents = "none";
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es, o) {
      if (es[0].isIntersecting) { initPreview(); o.disconnect(); }
    }, { rootMargin: "300px" }).observe($("#previewFrame"));
  }

  /* =========================================================
     Full-screen 360 tour
     ========================================================= */
  var tourEl = $("#tour"), viewer = null, current = T.firstScene;
  var autoRotate = !isTouch && !reduced, lastFocus = null;

  $("#roomStrip").innerHTML = T.order.map(function (id) {
    var r = T.rooms[id];
    return '<button class="strip-item" data-room="' + id + '"><img src="' + r.thumb + '" alt="" loading="lazy"><span>' + r.title + "</span></button>";
  }).join("");

  function linkTooltip(div, args) {
    div.innerHTML = '<span class="hs-pill"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></i>' + args.label + "</span>";
  }
  function infoTooltip(div) { div.innerHTML = '<span class="hs-dot"></span>'; }

  function buildScenes() {
    var scenes = {};
    Object.keys(T.rooms).forEach(function (id) {
      var r = T.rooms[id], hs = [];
      r.links.forEach(function (l) {
        hs.push({
          type: "info", yaw: l.yaw, pitch: l.pitch, cssClass: "hs-link",
          createTooltipFunc: linkTooltip, createTooltipArgs: { label: l.label || T.rooms[l.to].title },
          clickHandlerFunc: function () { walkTo(l.to, l.yaw, l.pitch); }
        });
      });
      r.info.forEach(function (n) {
        hs.push({ type: "info", yaw: n.yaw, pitch: n.pitch, cssClass: "hs-info", createTooltipFunc: infoTooltip, clickHandlerFunc: function () { showInfo(n); } });
      });
      scenes[id] = { panorama: panoSrc(id), title: r.title, yaw: r.yaw, hotSpots: hs };
    });
    return scenes;
  }

  function initViewer(startId) {
    loader(true);
    viewer = pannellum.viewer("pano", {
      default: {
        firstScene: startId, type: "equirectangular",
        haov: T.haov, vaov: T.vaov,
        minYaw: -HALF_H, maxYaw: HALF_H, minPitch: -HALF_V, maxPitch: HALF_V,
        avoidShowingBackground: true, autoLoad: true, showControls: false, compass: false,
        hfov: WIDEST, minHfov: 30, maxHfov: WIDEST, pitch: 0,
        mouseZoom: true, keyboardZoom: true,
        friction: .12, sceneFadeDuration: 0,
        autoRotate: autoRotate ? -2 : 0, autoRotateInactivityDelay: 4000
      },
      scenes: buildScenes()
    });
    window.tourViewer = viewer; // handy for debugging in the console
    var pano = $("#pano");
    fitViewer(viewer, pano, WIDEST);
    window.addEventListener("resize", function () { fitViewer(viewer, pano); });
    viewer.on("load", function () {
      fitViewer(viewer, pano, WIDEST);
      loader(false); preloadNeighbours(current);
      arrive();
    });
    viewer.on("scenechange", setRoom);
    viewer.on("mousedown", hideHint);
    viewer.on("touchstart", hideHint);
    viewer.on("error", function () { loader(false); $("#tourError").hidden = false; });
  }

  /* ---------- Walking: move forward into a doorway, step back out ----------
     A real walk-through needs a 3D scan; here each standing point is a
     panorama, and the move between them is sold with a dolly-zoom + crossfade. */
  var walking = false, trail = [], walkTimer = null;
  function homeHfov() { return maxHfovFor($("#pano")); }

  function walkTo(id, yaw, pitch, back) {
    if (!viewer || walking || id === current) return;
    walking = true; hideInfo();
    viewer.stopAutoRotate();
    if (!back) trail.push(current);
    // "Flash" cut: blur + warm light burst, swap the room while the screen is bright, then reveal
    var pano = $("#pano"), flash = $("#tourFlash");
    if (yaw != null) viewer.lookAt(Math.max(pitch, -12) * .3, yaw, viewer.getHfov(), 200);
    pano.classList.add("moving");
    flash.classList.add("on");
    clearTimeout(walkTimer);
    setTimeout(function () {
      viewer.loadScene(id, 0, T.rooms[id].yaw, homeHfov());
      // safety net: never stay stuck behind the flash if the load event is missed
      walkTimer = setTimeout(function () { if (walking) arrive(); }, 2500);
    }, reduced ? 0 : 210);
  }
  function arrive() {
    clearTimeout(walkTimer);
    walking = false;
    $("#pano").classList.remove("moving");
    $("#tourFlash").classList.remove("on");
    if (autoRotate) viewer.startAutoRotate(-2);
  }

  // Forward: walk through a doorway you are facing, otherwise step closer (zoom).
  function stepForward() {
    if (!viewer || walking) return;
    var yaw = viewer.getYaw(), best = null;
    T.rooms[current].links.forEach(function (l) {
      var d = Math.abs(((l.yaw - yaw + 540) % 360) - 180);
      if (d < 35 && (!best || d < best.d)) best = { l: l, d: d };
    });
    if (best) walkTo(best.l.to, best.l.yaw, best.l.pitch);
    else viewer.setHfov(Math.max(30, viewer.getHfov() - 22), 450);
  }
  // Back: step back out of a zoom, otherwise retrace your last move.
  function stepBack() {
    if (!viewer || walking) return;
    var home = homeHfov();
    if (viewer.getHfov() < home - 4) { viewer.setHfov(Math.min(home, viewer.getHfov() + 22), 450); return; }
    var prev = trail.pop();
    if (prev) walkTo(prev, null, null, true);
  }

  function roomOf(id) { return T.rooms[id].room || id; }

  function setRoom(id) {
    current = id;
    var r = T.rooms[id], base = roomOf(id);
    $("#tourRoom").textContent = r.title;
    $("#tourArea").textContent = r.area + (r.view ? " · " + r.view : "");
    $("#tourCount").textContent = (T.order.indexOf(base) + 1) + " / " + T.order.length;
    hideInfo(); markPlan(base);
    $$(".strip-item").forEach(function (b) {
      if (b.dataset.room === base) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    var a = $('.strip-item[data-room="' + base + '"]');
    if (a) a.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  var preloaded = {};
  function preloadNeighbours(id) {
    T.rooms[id].links.forEach(function (l) {
      if (preloaded[l.to]) return;
      preloaded[l.to] = true; if (!isFile) new Image().src = T.rooms[l.to].image;
    });
  }

  function goTo(id) { if (viewer && id !== current) walkTo(id, null, null); }

  function openTour(id) {
    id = T.rooms[id] ? id : T.firstScene;
    lastFocus = document.activeElement;
    tourOpen = true;
    tourEl.classList.add("open"); tourEl.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    if (lenis) lenis.stop();
    if (previewViewer) previewViewer.stopAutoRotate();
    $("#tourHint").classList.remove("hide");
    if (!history.state || !history.state.tour) history.pushState({ tour: true }, "", "#tour");
    if (!viewer) { current = id; loader(true); whenPanos(function () { initViewer(current); }); setRoom(id); }
    else if (id !== current) { trail = []; walkTo(id, null, null); }
    else setRoom(id);
    setTimeout(function () { $("#btnClose").focus(); }, 60);
    setTimeout(hideHint, 4500);
  }

  function closeTour(fromPop) {
    if (!tourOpen) return;
    tourOpen = false;
    tourEl.classList.remove("open"); tourEl.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    if (lenis) lenis.start();
    if (viewer) {
      viewer.stopAutoRotate();
      if (viewer.isOrientationActive()) { viewer.stopOrientation(); $("#btnGyro").setAttribute("aria-pressed", "false"); }
    }
    if (previewViewer && !reduced) previewViewer.startAutoRotate(-4);
    if (document.fullscreenElement) document.exitFullscreen();
    if (!fromPop && history.state && history.state.tour) history.back();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  function loader(on) { $("#tourLoader").classList.toggle("show", on); }
  function hideHint() { $("#tourHint").classList.add("hide"); }
  function showInfo(n) {
    $("#infoTitle").textContent = n.title; $("#infoText").textContent = n.text;
    var box = $("#tourInfo"); box.hidden = false;
    box.style.animation = "none"; void box.offsetWidth; box.style.animation = "";
  }
  function hideInfo() { $("#tourInfo").hidden = true; }

  /* Delegated clicks */
  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open-tour]");
    if (opener) { e.preventDefault(); openTour(opener.dataset.openTour); return; }
    var fp = e.target.closest(".fp-room");
    if (fp) {
      if (tourOpen) { goTo(fp.dataset.room); $("#miniPlan").hidden = true; $("#btnPlan").setAttribute("aria-pressed", "false"); }
      else openTour(fp.dataset.room);
      return;
    }
    var si = e.target.closest(".strip-item");
    if (si) goTo(si.dataset.room);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && tourOpen) { closeTour(); return; }
    if (tourOpen && !e.target.closest("input, textarea")) {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") { e.preventDefault(); stepForward(); return; }
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") { e.preventDefault(); stepBack(); return; }
    }
    var fp = e.target.closest && e.target.closest(".fp-room");
    if (fp && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fp.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
    // keep keyboard focus inside the tour dialog
    if (e.key === "Tab" && tourOpen) {
      var f = $$("button", tourEl).filter(function (b) { return b.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.addEventListener("popstate", function () { closeTour(true); });

  $("#btnClose").addEventListener("click", function () { closeTour(); });
  $("#infoClose").addEventListener("click", hideInfo);
  $("#btnPlan").addEventListener("click", function () {
    var mp = $("#miniPlan"); mp.hidden = !mp.hidden;
    this.setAttribute("aria-pressed", mp.hidden ? "false" : "true");
  });

  var rotBtn = $("#btnRotate");
  rotBtn.setAttribute("aria-pressed", autoRotate ? "true" : "false");
  rotBtn.addEventListener("click", function () {
    if (!viewer) return;
    autoRotate = !autoRotate;
    if (autoRotate) viewer.startAutoRotate(-2); else viewer.stopAutoRotate();
    rotBtn.setAttribute("aria-pressed", autoRotate ? "true" : "false");
  });

  var fullBtn = $("#btnFull");
  if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) fullBtn.hidden = true;
  fullBtn.addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (tourEl.requestFullscreen) tourEl.requestFullscreen().catch(function () {});
    else if (tourEl.webkitRequestFullscreen) tourEl.webkitRequestFullscreen();
  });

  var gyroBtn = $("#btnGyro");
  if (isTouch && "DeviceOrientationEvent" in window) gyroBtn.hidden = false;
  gyroBtn.addEventListener("click", function () {
    if (!viewer) return;
    if (viewer.isOrientationActive()) { viewer.stopOrientation(); gyroBtn.setAttribute("aria-pressed", "false"); return; }
    var start = function () {
      viewer.stopAutoRotate(); autoRotate = false; rotBtn.setAttribute("aria-pressed", "false");
      viewer.startOrientation(); gyroBtn.setAttribute("aria-pressed", "true"); hideHint();
    };
    // iOS 13+ needs an explicit permission prompt from a tap
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(function (s) { if (s === "granted") start(); }).catch(function () {});
    } else start();
  });

  onScroll();
  if (location.hash === "#tour") { history.replaceState(null, "", location.pathname); openTour(T.firstScene); }
})();
