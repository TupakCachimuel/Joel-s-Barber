/* ==========================================================================
   JOEL BARBER SHOP 21 — Interacciones (Vanilla JS)
   --------------------------------------------------------------------------
   Módulos:
   01. Utilidades
   02. Preloader + entrada del hero + contadores
   03. Scroll: barra de progreso, navbar, parallax (rAF)
   04. Navegación: indicador deslizante + scroll spy + menú móvil
   05. Pestañas de servicios con indicador y transición
   06. Spotlight (glow que sigue al cursor)
   07. Tilt 3D + parallax del collage
   08. Botones: ripple táctil
   09. Selección de servicio + toast + scroll al formulario
   10. Toasts
   11. Galería + Lightbox
   12. Acordeón
   13. Reveal on scroll (IntersectionObserver)
   14. Formulario → WhatsApp
   15. WhatsApp flotante (tooltip automático)
   ========================================================================== */

(() => {
  "use strict";

  /* ---------- 01. UTILIDADES ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  const URL_APPS_SCRIPT = "PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT";
  const WHATSAPP_NUMBER = "593978919928"; // Número para botón flotante de chat directo
  const DEFAULT_HORARIOS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

  /* ---------- 02. PRELOADER + HERO ---------- */
  const body = document.body;
  const startTime = performance.now();
  let introDone = false;

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    const wait = Math.max(0, 750 - (performance.now() - startTime)); // duración mínima del intro
    setTimeout(() => {
      body.classList.remove("is-loading");
      // pequeño desfase para que el telón suba antes del stagger del hero
      setTimeout(() => {
        body.classList.add("loaded");
        runCounters();
        updateNavIndicator();
        updateTabIndicator();
      }, 250);
    }, wait);
  }

  window.addEventListener("load", finishIntro);
  setTimeout(finishIntro, 2500); // respaldo si alguna imagen tarda demasiado

  /** Contadores animados del hero (+10, 100%, $5) */
  function runCounters() {
    $$("[data-count]").forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      if (prefersReducedMotion) {
        el.textContent = prefix + target + suffix;
        return;
      }
      const duration = 1600;
      const delay = 700;
      const t0 = performance.now() + delay;
      el.textContent = prefix + "0" + suffix;

      const tick = (now) => {
        const p = Math.min(Math.max((now - t0) / duration, 0), 1);
        const eased = 1 - Math.pow(2, -10 * p); // easeOutExpo
        el.textContent = prefix + Math.round(target * (p === 1 ? 1 : eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- 03. SCROLL (un solo listener + rAF) ---------- */
  const header = $("#navbar");
  const progressBar = $("#scrollProgress");
  const outlineText = $(".hero-outline-text");
  let scrollTicking = false;

  function onScrollFrame() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? y / max : 0;

    progressBar.style.transform = `scaleX(${progress})`;
    header.classList.toggle("scrolled", y > 30);

    // Parallax suave del texto gigante del hero (solo mientras es visible)
    if (outlineText && !prefersReducedMotion && y < window.innerHeight * 1.2) {
      outlineText.style.setProperty("--parallax", `${y * 0.35}px`);
    }
    scrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );
  onScrollFrame();

  /* ---------- 04. NAVEGACIÓN ---------- */
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  const navTabsWrap = $("#navTabs");
  const navTabs = $$(".nav-tab");
  const navIndicator = $("#navIndicator");

  /** Mueve la línea dorada bajo un enlace (translate + scaleX → GPU) */
  function moveIndicatorTo(link) {
    if (!link || !navIndicator) return;
    navIndicator.style.setProperty("--ix", `${link.offsetLeft}px`);
    navIndicator.style.setProperty("--iw", link.offsetWidth);
  }

  function updateNavIndicator() {
    moveIndicatorTo($(".nav-tab.active"));
  }

  function setActiveNav(id) {
    navTabs.forEach((t) => t.classList.toggle("active", t.getAttribute("href") === `#${id}`));
    updateNavIndicator();
  }

  // Previsualización al pasar el mouse
  navTabs.forEach((tab) => {
    tab.addEventListener("mouseenter", () => moveIndicatorTo(tab));
    tab.addEventListener("click", () => {
      setActiveNav(tab.getAttribute("href").slice(1));
      closeMenu();
    });
  });
  navTabsWrap.addEventListener("mouseleave", updateNavIndicator);

  // Scroll spy: marca la sección que cruza el centro de la pantalla
  const spyIds = new Set(navTabs.map((t) => t.getAttribute("href").slice(1)));
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && spyIds.has(entry.target.id)) {
          setActiveNav(entry.target.id);
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("[data-spy]").forEach((s) => spyObserver.observe(s));

  // Menú hamburguesa
  function openMenu() {
    navLinks.classList.add("active");
    menuToggle.classList.add("open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Cerrar menú");
    body.classList.add("menu-open");
  }

  function closeMenu() {
    navLinks.classList.remove("active");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
    body.classList.remove("menu-open");
  }

  menuToggle.addEventListener("click", () => {
    navLinks.classList.contains("active") ? closeMenu() : openMenu();
  });
  $(".nav-cta").addEventListener("click", closeMenu);

  /* ---------- 05. PESTAÑAS DE SERVICIOS ---------- */
  const tabButtons = $$(".tab-btn");
  const tabPanels = $$(".tab-panel");
  const tabIndicator = $("#tabIndicator");
  let tabTimer = null;

  function updateTabIndicator() {
    const active = $(".tab-btn.active");
    if (!active || !tabIndicator) return;
    tabIndicator.style.setProperty("--tx", `${active.offsetLeft}px`);
    tabIndicator.style.setProperty("--tw", `${active.offsetWidth}px`);
  }

  function switchTab(btn) {
    const current = $(".tab-btn.active");
    if (btn === current) return;

    const oldIndex = tabButtons.indexOf(current);
    const newIndex = tabButtons.indexOf(btn);
    const dir = newIndex > oldIndex ? 1 : -1;
    const nextPanel = document.getElementById(btn.dataset.tab);
    const currentPanel = tabPanels.find((p) => !p.hidden);

    // Estado de botones + indicador
    tabButtons.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on);
    });
    updateTabIndicator();
    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    // Cancelar una transición previa si se hace clic rápido
    clearTimeout(tabTimer);
    tabPanels.forEach((p) => {
      p.classList.remove("is-leaving", "is-entering");
      p.style.setProperty("--dir", dir);
    });

    const showNext = () => {
      tabPanels.forEach((p) => (p.hidden = p !== nextPanel));
      nextPanel.classList.add("is-entering");
      tabTimer = setTimeout(() => nextPanel.classList.remove("is-entering"), 1100);
    };

    if (currentPanel && !prefersReducedMotion) {
      currentPanel.classList.add("is-leaving");
      tabTimer = setTimeout(() => {
        currentPanel.classList.remove("is-leaving");
        showNext();
      }, 240);
    } else {
      showNext();
    }
  }

  tabButtons.forEach((btn) => btn.addEventListener("click", () => switchTab(btn)));

  // Navegación con flechas en la barra de pestañas (accesibilidad)
  $("#tabsBar").addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const i = tabButtons.indexOf(document.activeElement);
    if (i < 0) return;
    const next = tabButtons[(i + (e.key === "ArrowRight" ? 1 : -1) + tabButtons.length) % tabButtons.length];
    next.focus();
    switchTab(next);
  });

  /* ---------- 06. SPOTLIGHT ---------- */
  document.addEventListener(
    "pointermove",
    (e) => {
      const card = e.target.closest(".spotlight, .price-item");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
    { passive: true }
  );

  /* ---------- 07. TILT 3D + PARALLAX DEL COLLAGE ---------- */
  const heroMedia = $("#heroMedia");
  const frame = $("#collageFrame");

  if (heroMedia && frame && isFinePointer && !prefersReducedMotion) {
    const layers = $$("[data-depth]", frame).map((el) => ({ el, depth: parseFloat(el.dataset.depth) }));
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let rafId = null;

    const render = () => {
      current.x = lerp(current.x, target.x, 0.1);
      current.y = lerp(current.y, target.y, 0.1);

      frame.style.setProperty("--rx", `${(-current.y * 14).toFixed(2)}deg`);
      frame.style.setProperty("--ry", `${(current.x * 16).toFixed(2)}deg`);
      layers.forEach(({ el, depth }) => {
        el.style.setProperty("--tx", `${(current.x * depth * 0.45).toFixed(2)}px`);
        el.style.setProperty("--ty", `${(current.y * depth * 0.45).toFixed(2)}px`);
      });

      const settled = Math.abs(current.x - target.x) < 0.001 && Math.abs(current.y - target.y) < 0.001;
      if (settled && target.x === 0 && target.y === 0) {
        frame.classList.remove("is-tilting");
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(render);
    };

    const start = () => {
      frame.classList.add("is-tilting");
      if (!rafId) rafId = requestAnimationFrame(render);
    };

    heroMedia.addEventListener("pointermove", (e) => {
      const r = heroMedia.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width - 0.5;
      target.y = (e.clientY - r.top) / r.height - 0.5;
      start();
    });

    heroMedia.addEventListener("pointerleave", () => {
      target.x = 0;
      target.y = 0;
      start();
    });
  }

  /* ---------- 08. RIPPLE EN BOTONES ---------- */
  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn || prefersReducedMotion) return;
    const r = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${e.clientX - r.left}px`;
    ripple.style.top = `${e.clientY - r.top}px`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });

  /* ---------- 10. TOASTS ---------- */
  const toastStack = $("#toastStack");
  const ICONS = { ok: "#i-scissors", error: "#i-close" };

  /**
   * Muestra una notificación flotante.
   * @param {string} title  Título corto
   * @param {string} text   Detalle
   * @param {"ok"|"error"} type
   */
  function showToast(title, text, type = "ok", duration = 3200) {
    // Máximo 3 toasts visibles
    while (toastStack.children.length >= 3) toastStack.firstElementChild.remove();

    const toast = document.createElement("div");
    toast.className = `toast${type === "error" ? " is-error" : ""}`;
    toast.style.setProperty("--dur", `${duration}ms`);
    toast.setAttribute("role", "status");
    toast.innerHTML = `
      <span class="toast-icon"><svg><use href="${ICONS[type]}"/></svg></span>
      <div><strong></strong><p></p></div>
      <span class="toast-bar"></span>`;
    toast.querySelector("strong").textContent = title;
    toast.querySelector("p").textContent = text;
    toastStack.appendChild(toast);

    const remove = () => {
      toast.classList.add("is-out");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    };
    const timer = setTimeout(remove, duration);
    toast.addEventListener("click", () => {
      clearTimeout(timer);
      remove();
    });
  }

  /* ---------- 09. SELECCIÓN DE SERVICIO ---------- */
  const servicioInput = $("#servicio");
  const nombreInput = $("#nombre");
  const telefonoInput = $("#telefono");
  const fechaInput = $("#fecha");
  const horaInput = $("#hora");
  const slotsGrid = $("#slotsGrid");
  const slotStatus = $("#slotStatus");

  function pickService(item) {
    const service = item.dataset.service;
    servicioInput.value = service;
    servicioInput.classList.remove("is-invalid");

    // Feedback visual en la tarjeta
    item.classList.remove("is-picked");
    void item.offsetWidth; // reinicia la animación
    item.classList.add("is-picked");

    showToast("Servicio seleccionado", service);

    $("#contacto").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });

    setTimeout(() => {
      servicioInput.classList.remove("is-flash");
      void servicioInput.offsetWidth;
      servicioInput.classList.add("is-flash");
      // En escritorio, enfoca el siguiente campo vacío
      if (isFinePointer) {
        const next = !nombreInput.value.trim() ? nombreInput : (!fechaInput.value ? fechaInput : telefonoInput);
        next.focus({ preventScroll: true });
      }
    }, 700);
  }

  $$(".price-item[data-service]").forEach((item) => {
    item.addEventListener("click", () => pickService(item));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pickService(item);
      }
    });
  });

  /* ---------- 11. GALERÍA + LIGHTBOX ---------- */
  const galleryCards = $$("#gallery .gallery-card");
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbTitle = $("#lbTitle");
  const lbCat = $("#lbCat");
  const lbCounter = $("#lbCounter");
  let lbIndex = 0;
  let lastFocused = null;

  const galleryData = galleryCards.map((card) => {
    const img = card.querySelector("img");
    return {
      src: img.getAttribute("src"),
      alt: img.getAttribute("alt"),
      title: card.querySelector("h4").textContent,
      cat: card.querySelector(".tag-cat").textContent,
    };
  });

  function fillLightbox(i) {
    const d = galleryData[i];
    lbImg.src = d.src;
    lbImg.alt = d.alt;
    lbTitle.textContent = d.title;
    lbCat.textContent = d.cat;
    lbCounter.textContent = `${String(i + 1).padStart(2, "0")} / ${String(galleryData.length).padStart(2, "0")}`;
  }

  function openLightbox(i) {
    lbIndex = i;
    lastFocused = document.activeElement;
    fillLightbox(i);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    body.classList.add("lb-open");
    setTimeout(() => $("#lbClose").focus(), 50);
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    body.classList.remove("lb-open");
    if (lastFocused) lastFocused.focus({ preventScroll: true });
  }

  function navLightbox(step) {
    const dir = step > 0 ? 1 : -1;
    lbIndex = (lbIndex + step + galleryData.length) % galleryData.length;
    lbImg.style.setProperty("--dir", -dir);
    lbImg.classList.add("is-switching");

    setTimeout(() => {
      fillLightbox(lbIndex);
      lbImg.style.setProperty("--dir", dir);
      const reveal = () => requestAnimationFrame(() => lbImg.classList.remove("is-switching"));
      if (lbImg.complete) reveal();
      else {
        lbImg.addEventListener("load", reveal, { once: true });
        lbImg.addEventListener("error", reveal, { once: true });
      }
    }, 220);
  }

  galleryCards.forEach((card, i) => {
    card.addEventListener("click", () => openLightbox(i));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(i);
      }
    });
  });

  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", () => navLightbox(-1));
  $("#lbNext").addEventListener("click", () => navLightbox(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Swipe en móviles
  let touchX = null;
  lightbox.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) navLightbox(dx < 0 ? 1 : -1);
    touchX = null;
  });

  // Teclado global: Esc / flechas
  document.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") navLightbox(1);
      if (e.key === "ArrowLeft") navLightbox(-1);
      return;
    }
    if (e.key === "Escape" && bookingModal.classList.contains("open")) cerrarModalConfirmacion();
    if (e.key === "Escape" && navLinks.classList.contains("active")) closeMenu();
  });

  /* ---------- 12. ACORDEÓN ---------- */
  const accordionItems = $$(".accordion-item");

  accordionItems.forEach((item) => {
    const headerBtn = item.querySelector(".accordion-header");
    headerBtn.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");
      accordionItems.forEach((i) => {
        i.classList.remove("active");
        i.querySelector(".accordion-header").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("active");
        headerBtn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- 13. REVEAL ON SCROLL ---------- */
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- 14. RESERVAS EN TIEMPO REAL (Google Calendar) ---------- */
  const bookingForm = $("#bookingForm");
  const btnSubmitReserva = $("#btnSubmitReserva");
  const btnSubmitText = $("#btnSubmitText");
  const bookingModal = $("#bookingModal");
  const modalClose = $("#modalClose");
  const btnCerrarModal = $("#btnCerrarModal");
  const modalBackdrop = $("#modalBackdrop");
  const confServicio = $("#confServicio");
  const confFecha = $("#confFecha");
  const confHora = $("#confHora");
  const btnGoogleCalendar = $("#btnGoogleCalendar");

  // Bloquear fechas pasadas en el selector de fecha (zona horaria local Ecuador)
  const hoyObj = new Date();
  const yyyy = hoyObj.getFullYear();
  const mm = String(hoyObj.getMonth() + 1).padStart(2, "0");
  const dd = String(hoyObj.getDate()).padStart(2, "0");
  fechaInput.min = `${yyyy}-${mm}-${dd}`;

  // Formatear fecha legible para el modal (ej: "miércoles, 25 de noviembre de 2026")
  function formatearFecha(fechaStr) {
    if (!fechaStr) return "-";
    const [y, m, d] = fechaStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("es-EC", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  // Generar enlace dinámico a Google Calendar para el cliente
  function generarGoogleCalendarUrl({ nombre, servicio, fecha, hora }) {
    const titulo = `✂️ ${servicio} - Joel Barber Shop 21`;
    const detalles = `Cita agendada para ${nombre}.\nServicio: ${servicio}.\nLugar: Atahualpa y Salinas (Parque La Florida), Otavalo.\nContacto barbero: +593 97 891 9928.`;
    const ubicacion = "Atahualpa y Salinas, Parque La Florida, Otavalo, Ecuador";

    const [hNum, mNum] = hora.split(":").map(Number);
    const endH = String(hNum + 1).padStart(2, "0");
    const endM = String(mNum).padStart(2, "0");

    const startStr = fecha.replace(/-/g, "") + "T" + hora.replace(":", "") + "00";
    const endStr = fecha.replace(/-/g, "") + "T" + endH + endM + "00";

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${startStr}/${endStr}&ctz=America/Guayaquil&details=${encodeURIComponent(detalles)}&location=${encodeURIComponent(ubicacion)}`;
  }

  // Renderizar botones de horarios en la grilla
  function renderSlots(horarios, ocupadas = []) {
    slotsGrid.innerHTML = "";
    horaInput.value = "";

    if (!horarios || horarios.length === 0) {
      slotsGrid.innerHTML = '<p class="slots-empty">No hay turnos configurados para esta fecha.</p>';
      return;
    }

    let disponibles = 0;

    horarios.forEach((h) => {
      const isOccupied = ocupadas.includes(h);
      if (!isOccupied) disponibles++;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `slot-btn${isOccupied ? " occupied" : ""}`;
      btn.dataset.hora = h;
      btn.disabled = isOccupied;
      btn.textContent = isOccupied ? `${h} ✕` : h;
      btn.title = isOccupied ? `Horario ${h} ocupado` : `Seleccionar turno ${h}`;

      if (!isOccupied) {
        btn.addEventListener("click", () => {
          $$(".slot-btn", slotsGrid).forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          horaInput.value = h;
          horaInput.classList.remove("is-invalid");
          slotsGrid.classList.remove("is-invalid");
        });
      }

      slotsGrid.appendChild(btn);
    });

    if (disponibles === 0) {
      slotsGrid.innerHTML = '<p class="slots-empty">Todos los turnos de este día están completos. Por favor selecciona otra fecha.</p>';
      slotStatus.textContent = "Día completo";
    }
  }

  // Consultar disponibilidad en Google Calendar a través de Google Apps Script
  function consultarHorarios(fecha) {
    if (!fecha) {
      slotsGrid.innerHTML = '<p class="slots-empty">Selecciona una fecha para ver los turnos disponibles.</p>';
      slotStatus.textContent = "";
      horaInput.value = "";
      return;
    }

    slotStatus.textContent = "Consultando agenda...";
    slotStatus.className = "slot-status loading";
    slotsGrid.innerHTML = '<p class="slots-loading">⌛ Consultando turnos en Google Calendar...</p>';

    // Si aún no se ha configurado la URL de Apps Script, mostrar horarios por defecto para pruebas
    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT === "PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT") {
      setTimeout(() => {
        slotStatus.textContent = "Turnos disponibles";
        slotStatus.className = "slot-status";
        renderSlots(DEFAULT_HORARIOS, []);
      }, 350);
      return;
    }

    fetch(`${URL_APPS_SCRIPT}?fecha=${encodeURIComponent(fecha)}`)
      .then((res) => res.json())
      .then((data) => {
        slotStatus.className = "slot-status";
        if (!data.ok) {
          throw new Error(data.error || "No se pudo consultar la agenda.");
        }
        slotStatus.textContent = "Elige tu turno";
        renderSlots(data.horarios || DEFAULT_HORARIOS, data.ocupadas || []);
      })
      .catch((err) => {
        console.warn("Aviso en consulta de agenda:", err);
        slotStatus.className = "slot-status";
        slotStatus.textContent = "Turnos estimados";
        renderSlots(DEFAULT_HORARIOS, []);
      });
  }

  fechaInput.addEventListener("change", () => {
    fechaInput.classList.remove("is-invalid");
    consultarHorarios(fechaInput.value);
  });

  // Limpiar errores visuales al tipear
  [nombreInput, telefonoInput, servicioInput].forEach((input) => {
    input.addEventListener("input", () => input.classList.remove("is-invalid"));
  });

  // Modal de confirmación
  function abrirModalConfirmacion(datos) {
    confServicio.textContent = datos.servicio;
    confFecha.textContent = formatearFecha(datos.fecha);
    confHora.textContent = datos.hora;

    const gcalUrl = generarGoogleCalendarUrl(datos);
    btnGoogleCalendar.href = gcalUrl;

    bookingModal.classList.add("open");
    bookingModal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
  }

  function cerrarModalConfirmacion() {
    bookingModal.classList.remove("open");
    bookingModal.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-open");
  }

  [modalClose, btnCerrarModal, modalBackdrop].forEach((el) => {
    if (el) el.addEventListener("click", cerrarModalConfirmacion);
  });

  // Enviar reserva
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = nombreInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const servicio = servicioInput.value.trim();
    const fecha = fechaInput.value.trim();
    const hora = horaInput.value.trim();

    let hayError = false;

    if (!nombre) { nombreInput.classList.add("is-invalid"); hayError = true; }
    if (!telefono) { telefonoInput.classList.add("is-invalid"); hayError = true; }
    if (!servicio) { servicioInput.classList.add("is-invalid"); hayError = true; }
    if (!fecha) { fechaInput.classList.add("is-invalid"); hayError = true; }
    if (!hora) {
      slotsGrid.classList.add("is-invalid");
      hayError = true;
      showToast("Selecciona una hora", "Por favor elige un turno disponible de la lista.", "error");
    }

    if (hayError) {
      showToast("Faltan datos", "Completa todos los campos para agendar tu cita.", "error");
      const firstInvalid = $(".is-invalid", bookingForm);
      if (firstInvalid && firstInvalid.focus) firstInvalid.focus();
      return;
    }

    // Estado cargando en el botón
    btnSubmitReserva.disabled = true;
    btnSubmitText.textContent = "Confirmando en Google Calendar...";

    // Si aún no se configuró la URL de Apps Script, simular confirmación local para previsualización
    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT === "PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT") {
      setTimeout(() => {
        btnSubmitReserva.disabled = false;
        btnSubmitText.textContent = "Confirmar Reserva";
        showToast("¡Turno apartado!", `${servicio} el ${fecha} a las ${hora}`);
        abrirModalConfirmacion({ nombre, telefono, servicio, fecha, hora });
        bookingForm.reset();
        slotsGrid.innerHTML = '<p class="slots-empty">Selecciona una fecha para ver los turnos disponibles.</p>';
        slotStatus.textContent = "";
        horaInput.value = "";
      }, 700);
      return;
    }

    // Envío real a Google Apps Script usando text/plain para evitar errores de preflight CORS
    fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ nombre, telefono, servicio, fecha, hora })
    })
      .then((res) => res.json())
      .then((data) => {
        btnSubmitReserva.disabled = false;
        btnSubmitText.textContent = "Confirmar Reserva";

        if (!data.ok) {
          showToast("Hora no disponible", data.mensaje || "Esa hora acaba de ser reservada. Por favor elige otra.", "error", 4500);
          consultarHorarios(fecha);
          return;
        }

        showToast("¡Cita agendada!", `Te esperamos el ${fecha} a las ${hora}`);
        abrirModalConfirmacion({ nombre, telefono, servicio, fecha, hora });
        bookingForm.reset();
        slotsGrid.innerHTML = '<p class="slots-empty">Selecciona una fecha para ver los turnos disponibles.</p>';
        slotStatus.textContent = "";
        horaInput.value = "";
      })
      .catch((err) => {
        console.error("Error al agendar:", err);
        btnSubmitReserva.disabled = false;
        btnSubmitText.textContent = "Confirmar Reserva";
        showToast("Error de conexión", "No se pudo conectar con la agenda. Intenta de nuevo.", "error", 4500);
      });
  });

  /* ---------- 15. WHATSAPP FLOTANTE ---------- */
  const waFloat = $(".whatsapp-float");
  setTimeout(() => {
    waFloat.classList.add("show-tip");
    setTimeout(() => waFloat.classList.remove("show-tip"), 3500);
  }, 5000);

  /* ---------- RECÁLCULOS EN RESIZE / FUENTES ---------- */
  let resizeRaf = null;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      updateNavIndicator();
      updateTabIndicator();
      if (window.innerWidth > 920) closeMenu();
    });
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      updateNavIndicator();
      updateTabIndicator();
    });
  }
  updateNavIndicator();
  updateTabIndicator();
})();
