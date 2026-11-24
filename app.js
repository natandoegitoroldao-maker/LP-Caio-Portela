/**
 * ============================================================================
 * TREINO EXPRESS — CAIO PORTELA
 * Interações de UX, Simulador do App MFIT, Modais e Comportamento
 * ============================================================================
 */

(function initApp() {
  "use strict";

  const tracking = window.CPTracking;

  // Ano automático no rodapé
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // ==========================================================================
  // 1. PROGRESSO DE LEITURA, HEADER E BARRA FIXA MOBILE
  // ==========================================================================
  const scrollProgress = document.getElementById("scrollProgress");
  const siteHeader = document.getElementById("siteHeader");
  const mobileStickyBar = document.getElementById("mobileStickyBar");

  function handleScrollUI() {
    const scrollY = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollY / docHeight) * 100) : 0;

    if (scrollProgress) {
      scrollProgress.style.width = pct + "%";
    }

    if (siteHeader) {
      siteHeader.classList.toggle("is-scrolled", scrollY > 24);
    }

    if (mobileStickyBar) {
      const showSticky = scrollY > 520;
      mobileStickyBar.classList.toggle("is-visible", showSticky);
      mobileStickyBar.setAttribute("aria-hidden", showSticky ? "false" : "true");
    }
  }

  window.addEventListener("scroll", handleScrollUI, { passive: true });
  handleScrollUI();

  // ==========================================================================
  // 2. REVELAÇÃO SUAVE DE ELEMENTOS NO SCROLL
  // ==========================================================================
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -30px 0px" }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // ==========================================================================
  // 3. ALTERNADOR DE CONTRASTE COMPORTAMENTAL (SEÇÃO 2)
  // ==========================================================================
  const contrastTabs = document.querySelectorAll("[data-contrast-tab]");
  const contrastPanels = document.querySelectorAll("[data-contrast-panel]");

  contrastTabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const target = btn.getAttribute("data-contrast-tab");

      contrastTabs.forEach(function (t) {
        const active = t === btn;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });

      contrastPanels.forEach(function (panel) {
        const match = panel.getAttribute("data-contrast-panel") === target;
        panel.classList.toggle("is-active", match);
        panel.hidden = !match;
      });

      if (tracking) {
        tracking.pushEvent("contrast_tab_switch", { tab: target });
      }
    });
  });

  // ==========================================================================
  // 4. SIMULADOR INTERATIVO DO APP MFIT PERSONAL (SEÇÃO 3)
  // ==========================================================================
  const MFIT_SESSIONS = {
    a: {
      meta: "Inferiores & Glúteo",
      duration: "~35 min",
      exercises: [
        {
          name: "Agachamento Guiado ou Livre",
          sets: "3× 8–10 reps • 90s",
          tip: "Descida controlada em 3s para máxima ativação muscular sem sobrecarregar articulações.",
        },
        {
          name: "Elevação Pélvica",
          sets: "3× 10–12 reps • 75s",
          tip: "Pausa de 1s no topo para preservar e esculpir o tônus de glúteos.",
        },
        {
          name: "Leg Press 45° ou Horizontal",
          sets: "3× 10 reps • 90s",
          tip: "Amplitude segura — funciona em academia comercial ou condomínio.",
        },
        {
          name: "Cadeira ou Mesa Flexora",
          sets: "3× 10–12 reps • 60s",
          tip: "Movimento cadenciado para firmeza posterior de coxa.",
        },
      ],
    },
    b: {
      meta: "Superiores & Braços",
      duration: "~30 min",
      exercises: [
        {
          name: "Puxada Aberta na Polia",
          sets: "3× 10 reps • 75s",
          tip: "Escápulas encaixadas antes de puxar para postura e costas firmes.",
        },
        {
          name: "Supino Reto com Halteres",
          sets: "3× 10 reps • 75s",
          tip: "Cotovelos em leve diagonal para proteger ombros e maximizar estímulo.",
        },
        {
          name: "Remada Baixa Neutra",
          sets: "3× 10–12 reps • 60s",
          tip: "Tronco firme sem balançar: qualidade acima de volume exagerado.",
        },
        {
          name: "Tríceps Corda + Bíceps",
          sets: "2× 12 reps • 45s",
          tip: "Combinação enxuta para firmeza de braços sem alongar o treino.",
        },
      ],
    },
    c: {
      meta: "Corpo Inteiro & Core",
      duration: "~32 min",
      exercises: [
        {
          name: "Afundo com Halteres",
          sets: "3× 10/lado • 60s",
          tip: "Pernas, glúteos e estabilidade com alto retorno metabólico.",
        },
        {
          name: "Desenvolvimento Sentado",
          sets: "3× 10 reps • 60s",
          tip: "Tronco alinhado e controle total na descida.",
        },
        {
          name: "Stiff com Halteres",
          sets: "3× 10 reps • 75s",
          tip: "Coluna neutra e foco em posterior de coxa e glúteo.",
        },
        {
          name: "Prancha Isométrica Técnica",
          sets: "3× 35–45s • 45s",
          tip: "Ativação profunda de abdômen e proteção lombar.",
        },
      ],
    },
  };

  const appTabs = document.querySelectorAll("[data-app-tab]");
  const appMetaEl = document.getElementById("appSessionMeta");
  const appListEl = document.getElementById("appExerciseList");

  function renderMfitSession(key) {
    const data = MFIT_SESSIONS[key];
    if (!data || !appListEl || !appMetaEl) return;

    appMetaEl.innerHTML =
      "<span>" + data.meta + "</span><span>" + data.duration + "</span>";

    appListEl.innerHTML = "";
    data.exercises.forEach(function (ex) {
      const li = document.createElement("li");
      li.className = "app-exercise-item";
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");
      li.innerHTML =
        '<div class="ex-info">' +
        "<strong>" + ex.name + "</strong>" +
        "<span>" + ex.sets + "</span>" +
        "</div>" +
        '<span class="ex-play-pill">▶ Vídeo</span>';

      function openPreview() {
        openMediaModal(
          ex.name + " — Prévia Técnica (App MFIT)",
          '<div class="modal-placeholder-box">' +
          "<h4>Vídeo Demonstrativo do Caio Portela no App MFIT</h4>" +
          "<p><strong>Prescrição ilustrativa:</strong> " + ex.sets + "</p>" +
          '<p style="margin-top:10px;"><strong>Foco técnico do protocolo:</strong> ' + ex.tip + "</p>" +
          '<p style="margin-top:14px;font-size:0.82rem;opacity:0.8;">No aplicativo MFIT Personal você assiste à execução completa em vídeo, registra suas cargas e acompanha o cronômetro de descanso.</p>' +
          "</div>"
        );
        if (tracking) {
          tracking.pushEvent("mfit_preview_exercise_click", {
            exercise_name: ex.name,
            session_tab: key,
          });
        }
      }

      li.addEventListener("click", openPreview);
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPreview();
        }
      });

      appListEl.appendChild(li);
    });
  }

  appTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const key = tab.getAttribute("data-app-tab");
      appTabs.forEach(function (t) {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      renderMfitSession(key);
    });
  });

  renderMfitSession("a");

  // ==========================================================================
  // 5. MODAIS DE VÍDEO (VSL + DEPOIMENTOS) E MODAIS LEGAIS
  // ==========================================================================
  const mediaModal = document.getElementById("mediaModal");
  const mediaModalTitle = document.getElementById("mediaModalTitle");
  const mediaModalBody = document.getElementById("mediaModalBody");

  function openMediaModal(title, htmlContent) {
    if (!mediaModal || !mediaModalTitle || !mediaModalBody) return;
    mediaModalTitle.textContent = title;
    mediaModalBody.innerHTML = htmlContent;
    mediaModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach(function (modal) {
      modal.hidden = true;
    });
    if (mediaModalBody) {
      // Interrompe reprodução de vídeo/iframe ao fechar
      mediaModalBody.innerHTML = "";
    }
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".modal-backdrop").forEach(function (backdrop) {
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeAllModals();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllModals();
  });

  // Disparo para VSL e Cards de Depoimento
  function buildVideoPlayerHtml(src, slotName, title, isVertical) {
    if (!src) {
      return (
        '<div class="modal-placeholder-box">' +
        "<h4>Espaço de Vídeo Pronto para Publicação (" + slotName + ")</h4>" +
        "<p>Para ativar este vídeo real, basta preencher o atributo <code>data-video-src</code> no elemento <code>" +
        slotName +
        "</code> no arquivo <code>index.html</code> com o caminho do seu arquivo <code>.mp4</code> ou URL de embed (PandaVideo, Vimeo ou YouTube).</p>" +
        "</div>"
      );
    }

    const cls = isVertical ? "modal-video-embed is-vertical" : "modal-video-embed";

    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(src)) {
      return (
        '<video class="' + cls + '" controls autoplay playsinline src="' +
        src +
        '">Seu navegador não suporta vídeo HTML5.</video>'
      );
    }

    return (
      '<iframe class="' + cls + '" src="' +
      src +
      '" title="' +
      title +
      '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>'
    );
  }

  function bindVideoTrigger(el) {
    if (!el) return;
    const container = el.closest("[data-asset-slot]") || el;
    const slotName = container.getAttribute("data-asset-slot") || "video";
    const src = (container.getAttribute("data-video-src") || "").trim();
    const title = container.getAttribute("data-video-title") || "Vídeo";
    const isVertical = container.classList.contains("video-card");

    function handleOpen() {
      openMediaModal(title, buildVideoPlayerHtml(src, slotName, title, isVertical));
      if (tracking) {
        tracking.trackVideo(slotName, title, "open_modal");
      }
    }

    el.addEventListener("click", handleOpen);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
    });
  }

  bindVideoTrigger(document.getElementById("vslTrigger"));
  document.querySelectorAll(".video-card").forEach(bindVideoTrigger);

  // ==========================================================================
  // 6. MODAL DE PRÉ-CHECKOUT (5 CAMPOS MFIT) + REDIRECIONAMENTO ASAAS
  // ==========================================================================
  const DEFAULT_ASAAS_CHECKOUT_URL = "https://www.asaas.com/000/c/yljexk5ex47hm4ff";
  const ATTRIBUTION_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fbclid",
    "gclid",
    "gbraid",
    "wbraid",
  ];

  const checkoutModal = document.getElementById("modal-treino-express");
  const preCheckoutForm = document.getElementById("form-pre-checkout");
  const leadNomeInput = document.getElementById("lead-nome");
  const leadEmailInput = document.getElementById("lead-email");
  const leadWhatsappInput = document.getElementById("lead-whatsapp");
  const leadNascimentoInput = document.getElementById("lead-nascimento");
  const leadGeneroSelect = document.getElementById("lead-genero");
  const preCheckoutErrorEl = document.getElementById("precheckoutError");
  const submitLeadBtn = document.getElementById("btn-submit-lead");
  const defaultSubmitBtnHtml = submitLeadBtn ? submitLeadBtn.innerHTML : "";

  let activeCheckoutCtaLocation = "checkout_cta";
  let isSubmittingPreCheckout = false;

  function clearPreCheckoutError() {
    if (preCheckoutErrorEl) {
      preCheckoutErrorEl.textContent = "";
      preCheckoutErrorEl.hidden = true;
    }
    [
      leadNomeInput,
      leadEmailInput,
      leadWhatsappInput,
      leadNascimentoInput,
      leadGeneroSelect,
    ].forEach(function (field) {
      if (field) field.classList.remove("is-invalid");
    });
  }

  function showPreCheckoutError(message, field) {
    clearPreCheckoutError();
    if (field) {
      field.classList.add("is-invalid");
      field.focus();
    }
    if (preCheckoutErrorEl) {
      preCheckoutErrorEl.textContent = message;
      preCheckoutErrorEl.hidden = false;
    }
  }

  function resetSubmitButtonState() {
    isSubmittingPreCheckout = false;
    if (submitLeadBtn) {
      submitLeadBtn.disabled = false;
      if (defaultSubmitBtnHtml) {
        submitLeadBtn.innerHTML = defaultSubmitBtnHtml;
      }
    }
  }

  function formatDateInput(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  }

  function formatPhoneInput(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
      digits = digits.slice(2);
    }
    digits = digits.slice(0, 11);
    if (digits.length === 0) return "";
    if (digits.length <= 2) return "(" + digits;
    if (digits.length <= 6) {
      return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
    }
    if (digits.length <= 10) {
      return (
        "(" +
        digits.slice(0, 2) +
        ") " +
        digits.slice(2, 6) +
        "-" +
        digits.slice(6)
      );
    }
    return (
      "(" +
      digits.slice(0, 2) +
      ") " +
      digits.slice(2, 7) +
      "-" +
      digits.slice(7)
    );
  }

  function isValidBirthDate(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || "").trim());
    if (!match) return false;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const currentYear = new Date().getFullYear();

    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    if (year < 1920 || year > currentYear - 10) return false;

    const dateObj = new Date(year, month - 1, day);
    return (
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day
    );
  }

  function getSessionAttribution() {
    const result = {};
    const fallback =
      tracking && typeof tracking.getAttribution === "function"
        ? tracking.getAttribution() || {}
        : {};
    const fallbackLastTouch = fallback.last_touch || {};

    ATTRIBUTION_KEYS.forEach(function (key) {
      let val = "";
      try {
        val = window.sessionStorage.getItem(key) || "";
      } catch (_) {
        val = "";
      }
      if (!val) {
        val = fallback[key] || fallbackLastTouch[key] || "";
      }
      result[key] = String(val || "").trim();
    });

    return result;
  }

  function generateEventIdFallback(prefix = "evt") {
    if (tracking && typeof tracking.generateEventId === "function") {
      return tracking.generateEventId(prefix);
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  function normalizeUserDataFallback(fullName, email, phone, birthDate, gender) {
    if (tracking && typeof tracking.normalizeUserData === "function") {
      return tracking.normalizeUserData(fullName, email, phone, birthDate, gender);
    }
    const cleanName = (fullName || "").trim().toLowerCase();
    const nameParts = cleanName ? cleanName.split(/\s+/) : [];
    const fn = nameParts[0] || "";
    const ln = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    let cleanPhone = (phone || "").replace(/\D/g, "");
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = "55" + cleanPhone;
    }

    let db = "";
    const rawBirthDate = String(birthDate || "").trim();
    const dateDigits = rawBirthDate.replace(/\D/g, "");
    if (dateDigits.length === 8) {
      if (
        !rawBirthDate.includes("/") &&
        /^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/.test(dateDigits)
      ) {
        db = dateDigits;
      } else {
        const dd = dateDigits.substring(0, 2);
        const mm = dateDigits.substring(2, 4);
        const yyyy = dateDigits.substring(4, 8);
        db = `${yyyy}${mm}${dd}`;
      }
    }

    let ge = "";
    const gClean = (gender || "").trim().toLowerCase();
    if (gClean.startsWith("f")) ge = "f";
    if (gClean.startsWith("m")) ge = "m";

    return {
      em: (email || "").trim().toLowerCase(),
      ph: cleanPhone,
      fn: fn,
      ln: ln,
      db: db,
      ge: ge,
      country: "br",
    };
  }

  function trackOpenCheckoutModal(ctaLocation) {
    const location = ctaLocation || activeCheckoutCtaLocation || "checkout_cta";
    if (tracking && typeof tracking.trackOpenCheckoutModal === "function") {
      return tracking.trackOpenCheckoutModal(location);
    }
    const eventId = generateEventIdFallback("modal");
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "open_checkout_modal",
      event_id: eventId,
      cta_location: location,
    });
    return eventId;
  }

  function handleCheckoutSubmit(formData, asaasCheckoutUrl) {
    const userData = normalizeUserDataFallback(
      formData.nome,
      formData.email,
      formData.whatsapp,
      formData.nascimento,
      formData.genero
    );
    const eventId = generateEventIdFallback("chk");
    const attribution = getSessionAttribution();
    const trafficSource = attribution.utm_source || "direto";
    const trafficMedium = attribution.utm_medium || "nenhum";
    const trafficCampaign = attribution.utm_campaign || "nenhuma";

    // Persiste no localStorage para eventual uso futuro na sessão
    try {
      window.localStorage.setItem("cp_user_data", JSON.stringify(userData));
    } catch (_) {
      // Fallback silencioso
    }

    // Monta URL oficial do Asaas com dados do lead, event_id e atribuição
    let finalUrl = asaasCheckoutUrl || DEFAULT_ASAAS_CHECKOUT_URL;
    try {
      const checkoutUrl = new URL(finalUrl);
      checkoutUrl.searchParams.set("name", formData.nome);
      checkoutUrl.searchParams.set("email", userData.em);
      checkoutUrl.searchParams.set("event_id", eventId);

      ATTRIBUTION_KEYS.forEach(function (key) {
        if (attribution[key] && !checkoutUrl.searchParams.has(key)) {
          checkoutUrl.searchParams.set(key, attribution[key]);
        }
      });

      finalUrl = checkoutUrl.toString();
    } catch (_) {
      // Fallback para URL base caso URL API falhe
    }

    // Controle de redirecionamento: aguarda no mínimo 400ms + conclusão das tags
    // do GTM (com teto de segurança de 900ms) para evitar que /g/collect seja cancelado
    let hasRedirected = false;
    let minDelayDone = false;
    let gtmCallbacksDone = !window.google_tag_manager;

    function redirectToAsaas() {
      if (hasRedirected) return;
      hasRedirected = true;
      window.location.href = finalUrl;
    }

    function onGtmEventsComplete() {
      gtmCallbacksDone = true;
      if (minDelayDone) {
        redirectToAsaas();
      }
    }

    // 1. Dispara begin_checkout_treino + begin_checkout (GA4/Meta) no dataLayer
    if (tracking && typeof tracking.trackPreCheckout === "function") {
      tracking.trackPreCheckout({
        event_id: eventId,
        cta_location: activeCheckoutCtaLocation,
        traffic_source: trafficSource,
        traffic_medium: trafficMedium,
        traffic_campaign: trafficCampaign,
        attribution: attribution,
        nome: formData.nome,
        email: formData.email,
        whatsapp: formData.whatsapp,
        nascimento: formData.nascimento,
        genero: formData.genero,
        user_data: userData,
        eventCallback: onGtmEventsComplete,
        eventTimeout: 600,
      });
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "begin_checkout_treino",
        event_id: eventId,
        value: 197.9,
        currency: "BRL",
        traffic_source: trafficSource,
        traffic_medium: trafficMedium,
        traffic_campaign: trafficCampaign,
        cta_location: activeCheckoutCtaLocation,
        email: userData.em,
        phone: userData.ph,
        first_name: userData.fn,
        last_name: userData.ln,
        birth_date: userData.db,
        gender: userData.ge,
        user_data: userData,
        eventCallback: onGtmEventsComplete,
        eventTimeout: 600,
      });
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: "begin_checkout",
        event_id: eventId,
        value: 197.9,
        currency: "BRL",
        cta_location: activeCheckoutCtaLocation,
        email: userData.em,
        phone: userData.ph,
        first_name: userData.fn,
        last_name: userData.ln,
        birth_date: userData.db,
        gender: userData.ge,
        user_data: userData,
        ecommerce: {
          currency: "BRL",
          value: 197.9,
          items: [
            {
              item_id: "treino-express-caio-portela",
              item_name: "Treino Express - Caio Portela (App MFIT)",
              item_brand: "Caio Portela",
              item_category: "Treinamento Online",
              price: 197.9,
              currency: "BRL",
              quantity: 1,
            },
          ],
        },
      });
    }

    // 2. Webhook opcional Google Apps Script (Planilha) com keepalive
    const webhookUrl =
      tracking && tracking.config && tracking.config.appsScriptWebhookUrl
        ? String(tracking.config.appsScriptWebhookUrl).trim()
        : "";

    if (webhookUrl && typeof window.fetch === "function") {
      try {
        window
          .fetch(webhookUrl, {
            method: "POST",
            mode: "no-cors",
            keepalive: true,
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              nome: formData.nome,
              email: userData.em,
              whatsapp: userData.ph,
              nascimento: formData.nascimento,
              genero: formData.genero,
              event_id: eventId,
              cta_location: activeCheckoutCtaLocation,
              utm_source: attribution.utm_source,
              utm_medium: attribution.utm_medium,
              utm_campaign: attribution.utm_campaign,
              utm_content: attribution.utm_content,
              utm_term: attribution.utm_term,
              fbclid: attribution.fbclid,
              gclid: attribution.gclid,
              gbraid: attribution.gbraid,
              wbraid: attribution.wbraid,
              submitted_at: new Date().toISOString(),
            }),
          })
          .catch(function () { });
      } catch (_) {
        // Não bloqueia o redirecionamento em caso de falha de rede
      }
    }

    // 3. Mantém a janela mínima de 400ms (e callback do GTM até 900ms) antes de redirecionar ao Asaas
    window.setTimeout(function () {
      minDelayDone = true;
      if (gtmCallbacksDone) {
        redirectToAsaas();
      }
    }, 400);

    window.setTimeout(redirectToAsaas, 900);
  }

  function abrirModalTreino(ctaLocation) {
    if (!checkoutModal) return;

    activeCheckoutCtaLocation =
      typeof ctaLocation === "string" && ctaLocation.trim()
        ? ctaLocation.trim()
        : "checkout_cta";

    closeAllModals();
    clearPreCheckoutError();
    resetSubmitButtonState();

    checkoutModal.hidden = false;
    document.body.style.overflow = "hidden";

    trackOpenCheckoutModal(activeCheckoutCtaLocation);

    if (leadNomeInput) {
      window.requestAnimationFrame(function () {
        leadNomeInput.focus();
      });
    }
  }

  function fecharModalTreino() {
    closeAllModals();
  }

  window.abrirModalTreino = abrirModalTreino;
  window.fecharModalTreino = fecharModalTreino;

  // Restaura botão se o usuário voltar do checkout pelo histórico (bfcache)
  window.addEventListener("pageshow", function () {
    resetSubmitButtonState();
    clearPreCheckoutError();
  });

  if (leadNascimentoInput) {
    leadNascimentoInput.addEventListener("input", function () {
      leadNascimentoInput.value = formatDateInput(leadNascimentoInput.value);
      clearPreCheckoutError();
    });
  }

  if (leadWhatsappInput) {
    leadWhatsappInput.addEventListener("input", function () {
      leadWhatsappInput.value = formatPhoneInput(leadWhatsappInput.value);
      clearPreCheckoutError();
    });
  }

  [leadNomeInput, leadEmailInput, leadGeneroSelect].forEach(function (field) {
    if (!field) return;
    field.addEventListener("input", clearPreCheckoutError);
    field.addEventListener("change", clearPreCheckoutError);
  });

  if (preCheckoutForm) {
    preCheckoutForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (isSubmittingPreCheckout) return;

      const nome = String(leadNomeInput ? leadNomeInput.value : "")
        .trim()
        .replace(/\s+/g, " ");
      const email = String(leadEmailInput ? leadEmailInput.value : "")
        .trim()
        .toLowerCase();
      let whatsappDigits = String(
        leadWhatsappInput ? leadWhatsappInput.value : ""
      ).replace(/\D/g, "");
      if (
        (whatsappDigits.length === 12 || whatsappDigits.length === 13) &&
        whatsappDigits.startsWith("55")
      ) {
        whatsappDigits = whatsappDigits.slice(2);
      }
      const nascimento = String(
        leadNascimentoInput ? leadNascimentoInput.value : ""
      ).trim();
      const genero = String(leadGeneroSelect ? leadGeneroSelect.value : "").trim();

      // Validações client-side dos 5 campos obrigatórios do MFIT
      if (!nome || nome.length < 2) {
        showPreCheckoutError("Informe seu nome completo para criar seu acesso.", leadNomeInput);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        showPreCheckoutError("Informe um e-mail válido para receber seu login do app.", leadEmailInput);
        return;
      }

      if (
        whatsappDigits.length < 10 ||
        whatsappDigits.length > 11 ||
        Number(whatsappDigits.slice(0, 2)) < 11
      ) {
        showPreCheckoutError("Informe um WhatsApp válido com DDD (10 ou 11 dígitos).", leadWhatsappInput);
        return;
      }

      if (!isValidBirthDate(nascimento)) {
        showPreCheckoutError("Informe uma data de nascimento válida no formato DD/MM/AAAA.", leadNascimentoInput);
        return;
      }

      if (genero !== "Masculino" && genero !== "Feminino") {
        showPreCheckoutError("Selecione seu gênero para completar o cadastro no MFIT.", leadGeneroSelect);
        return;
      }

      // Trava o botão e delega normalização, eventos e redirecionamento
      clearPreCheckoutError();
      isSubmittingPreCheckout = true;
      if (submitLeadBtn) {
        submitLeadBtn.disabled = true;
        submitLeadBtn.textContent = "Redirecionando...";
      }

      const baseCheckoutUrl =
        tracking && tracking.config && tracking.config.checkoutUrl
          ? String(tracking.config.checkoutUrl).trim()
          : DEFAULT_ASAAS_CHECKOUT_URL;

      handleCheckoutSubmit(
        {
          nome: nome,
          email: email,
          whatsapp: whatsappDigits,
          nascimento: nascimento,
          genero: genero,
        },
        baseCheckoutUrl || DEFAULT_ASAAS_CHECKOUT_URL
      );
    });
  }

  // Vincula CTAs de navegação e abertura do modal nos botões de compra (.js-checkout-link)
  document.querySelectorAll("[data-track-cta]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      const location = btn.getAttribute("data-track-cta") || "unknown";
      const isCheckout = btn.classList.contains("js-checkout-link");

      if (isCheckout) {
        e.preventDefault();
        abrirModalTreino(location);
        return;
      }

      if (tracking) {
        tracking.trackCta(location, false);
      }
    });
  });

  // ==========================================================================
  // 7. ACCORDION DE FAQ
  // ==========================================================================
  document.querySelectorAll(".faq-question").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const item = btn.closest(".faq-item");
      const answer = item ? item.querySelector(".faq-answer") : null;
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      // Fecha outros itens abertos para manter leitura limpa
      document.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("is-open");
          const q = openItem.querySelector(".faq-question");
          const a = openItem.querySelector(".faq-answer");
          if (q) q.setAttribute("aria-expanded", "false");
          if (a) a.hidden = true;
        }
      });

      if (item && answer) {
        item.classList.toggle("is-open", !isOpen);
        btn.setAttribute("aria-expanded", !isOpen ? "true" : "false");
        answer.hidden = isOpen;

        if (!isOpen && tracking) {
          tracking.pushEvent("faq_expand", {
            question: btn.textContent.trim().slice(0, 80),
          });
        }
      }
    });
  });

  // ==========================================================================
  // 8. MODAIS LEGAIS (GOOGLE ADS & LGPD COMPLIANCE)
  // ==========================================================================
  const legalModal = document.getElementById("legalModal");
  const legalModalTitle = document.getElementById("legalModalTitle");
  const legalModalBody = document.getElementById("legalModalBody");

  const LEGAL_CONTENT = {
    privacidade: {
      title: "Política de Privacidade (LGPD)",
      html:
        "<h4>1. Coleta e Finalidade dos Dados</h4>" +
        "<p>Respeitamos a sua privacidade conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Coletamos dados de navegação e medição de campanhas (como identificadores de clique e parâmetros UTM) e, no formulário de pré-checkout, os dados cadastrais necessários para criação e liberação do seu acesso no aplicativo MFIT Personal: nome completo, e-mail, WhatsApp, data de nascimento e gênero.</p>" +
        "<h4>2. Cookies e Medição de Desempenho</h4>" +
        "<p>Utilizamos cookies próprios e ferramentas de mensuração server-side para avaliar o desempenho de anúncios e a jornada até o pagamento e liberação no aplicativo MFIT. Você pode gerenciar ou revogar seu consentimento a qualquer momento clicando em “Cookies” no rodapé.</p>" +
        "<h4>3. Compartilhamento e Segurança</h4>" +
        "<p>Não vendemos ou cedemos seus dados pessoais a terceiros. Seus dados cadastrais são utilizados exclusivamente para operacionalizar seu acesso ao aplicativo MFIT Personal e mensuração segura de campanhas. Os dados financeiros de pagamento são processados exclusivamente no ambiente criptografado da plataforma de checkout parceira (Asaas).</p>" +
        "<h4>4. Direitos do Titular</h4>" +
        "<p>Você pode solicitar confirmação, correção ou exclusão de dados pelos canais oficiais de atendimento de Caio Portela.</p>",
    },
    termos: {
      title: "Termos de Uso — Treino Express",
      html:
        "<h4>1. Natureza do Programa</h4>" +
        "<p>O Treino Express é um programa digital de orientação de treinamento físico entregue via aplicativo MFIT Personal, com acesso vitalício ao protocolo contratado, desenvolvido pelo treinador Caio Portela.</p>" +
        "<h4>2. Responsabilidade e Saúde</h4>" +
        "<p>A prática de exercícios físicos exige aptidão clínica. Este material tem caráter estritamente educativo e de condicionamento físico e não substitui avaliação médica, fisioterapêutica ou nutricional individualizada.</p>" +
        "<h4>3. Propriedade Intelectual</h4>" +
        "<p>Todo o conteúdo do Treino Express — incluindo estrutura de treinos, textos, marca e vídeos demonstrativos — é de uso pessoal e intransferível do aluno inscrito, sendo proibida a reprodução ou revenda sem autorização prévia.</p>" +
        "<h4>4. Resultados Individuais</h4>" +
        "<p>Os resultados físicos dependem de fatores individuais como aderência aos treinos, sono, alimentação e histórico pessoal, não havendo garantia de resultados idênticos entre alunos.</p>",
    },
  };

  document.querySelectorAll("[data-open-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const key = btn.getAttribute("data-open-modal");
      const doc = LEGAL_CONTENT[key];
      if (!doc || !legalModal || !legalModalTitle || !legalModalBody) return;
      legalModalTitle.textContent = doc.title;
      legalModalBody.innerHTML = doc.html;
      legalModal.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });

  // ==========================================================================
  // 9. BANNER LGPD + GOOGLE CONSENT MODE v2
  // ==========================================================================
  const consentBanner = document.getElementById("consentBanner");
  const consentAcceptBtn = document.getElementById("consentAcceptBtn");
  const consentEssentialBtn = document.getElementById("consentEssentialBtn");
  const reopenConsentBtn = document.getElementById("reopenConsentBtn");

  if (consentBanner && tracking && !tracking.hasSavedConsent()) {
    setTimeout(function () {
      consentBanner.hidden = false;
    }, 1200);
  }

  if (consentAcceptBtn) {
    consentAcceptBtn.addEventListener("click", function () {
      if (tracking) tracking.updateConsent(true);
      if (consentBanner) consentBanner.hidden = true;
    });
  }

  if (consentEssentialBtn) {
    consentEssentialBtn.addEventListener("click", function () {
      if (tracking) tracking.updateConsent(false);
      if (consentBanner) consentBanner.hidden = true;
    });
  }

  if (reopenConsentBtn) {
    reopenConsentBtn.addEventListener("click", function () {
      if (consentBanner) consentBanner.hidden = false;
    });
  }
})();
