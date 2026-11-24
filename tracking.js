/**
 * ============================================================================
 * TREINO EXPRESS — CAIO PORTELA
 * Módulo de Rastreamento: Stape.io (sGTM Server-Side) + Google Ads (Campanha)
 * ============================================================================
 *
 * COMO ATIVAR QUANDO TIVER OS IDs:
 * 1. Preencha `stapeCustomDomain` com o subdomínio configurado no Stape
 *    (ex: "https://metrics.caioportela.com.br").
 * 2. Preencha `gtmWebId` com o ID do contêiner Web do GTM (ex: "GTM-XXXXXXX").
 * 3. `checkoutUrl` já está apontando para o checkout oficial no Asaas.
 * 4. Opcional: preencha `appsScriptWebhookUrl` com a URL do Web App do Google
 *    Apps Script para salvar os leads do pré-checkout automaticamente na planilha.
 *
 * DICA DE TESTE:
 * Adicione `?debug_tracking=1&gclid=TESTE123&utm_source=google&utm_campaign=barra_recreio`
 * na URL e abra o Console do navegador para ver todos os eventos e cookies.
 * ============================================================================
 */

(function initCPTracking(window, document) {
  "use strict";

  const TRACKING_CONFIG = {
    // 1) Domínio próprio configurado no Stape.io (sem barra no final)
    // Exemplo: "https://metrics.caioportela.com.br"
    stapeCustomDomain: "",

    // 2) ID do contêiner Web do Google Tag Manager
    // Exemplo: "GTM-XXXXXXX"
    gtmWebId: "",

    // 3) Caminho do loader (use "/gtm.js" padrão ou o caminho do Stape Custom Loader)
    stapeLoaderPath: "/gtm.js",

    // 4) Link oficial de checkout no Asaas (decorado automaticamente com dados,
    //    event_id, gclid, gbraid, wbraid, fbclid e UTMs no pré-checkout)
    checkoutUrl: "https://www.asaas.com/000/c/yljexk5ex47hm4ff",

    // 4b) Webhook opcional do Google Apps Script para salvar leads na planilha
    appsScriptWebhookUrl: "", // Cole a URL do Web App do Google Apps Script quando quiser salvar automático

    // 5) Dados fixos do produto para eventos GA4 / Google Ads Ecommerce
    product: {
      item_id: "treino-express-caio-portela",
      item_name: "Treino Express - Caio Portela (App MFIT)",
      item_brand: "Caio Portela",
      item_category: "Treinamento Online",
      price: 197.90,
      currency: "BRL",
      quantity: 1,
    },

    // 6) Janela de persistência first-party para Google Ads (90 dias)
    cookieDays: 90,

    // 7) Ativar logs no console (também ativa automaticamente via ?debug_tracking=1)
    debug: false,
  };

  // Parâmetros de campanha Google Ads (incluindo ValueTrack) + Meta/UTM
  const TRACKED_PARAMS = [
    "gclid",
    "gbraid",
    "wbraid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "campaign_id",
    "adgroup_id",
    "creative_id",
    "keyword",
    "matchtype",
    "device",
    "network",
    "placement",
    "fbclid",
  ];

  const STORAGE_KEYS = {
    lastTouch: "cp_attr_last",
    firstTouch: "cp_attr_first",
    consent: "cp_consent_v2",
    userData: "cp_user_data",
  };

  const urlParams = new URLSearchParams(window.location.search);
  const isDebug =
    TRACKING_CONFIG.debug || urlParams.get("debug_tracking") === "1";

  function logDebug(label, payload) {
    if (!isDebug) return;
    console.log(
      "%c[CP Tracking]%c " + label,
      "background:#C5983D;color:#0B0B0D;font-weight:700;padding:2px 6px;border-radius:4px;",
      "color:#E5B962;font-weight:600;",
      payload || ""
    );
  }

  // 1. Gera um ID único para desduplicação entre Pixel Web e CAPI Server
  function generateEventId(prefix = "evt") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // 2. Normaliza dados primários no padrão exigido pela Meta (EMQ > 9.0) e GA4
  function normalizeUserData(fullName, email, phone, birthDate, gender) {
    const cleanName = (fullName || "").trim().toLowerCase();
    const nameParts = cleanName ? cleanName.split(/\s+/) : [];
    const fn = nameParts[0] || "";
    const ln = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    let cleanPhone = (phone || "").replace(/\D/g, "");
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = "55" + cleanPhone;
    }

    // Normaliza DD/MM/AAAA para YYYYMMDD (padrão Meta CAPI/Pixel)
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

    // Normaliza Gênero para 'f' ou 'm' (padrão Meta CAPI/Pixel)
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

  // Utilitários de Cookie First-Party (acessível no servidor Stape via HTTP header)
  function setCookie(name, value, days) {
    try {
      const maxAge = days * 24 * 60 * 60;
      const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie =
        encodeURIComponent(name) +
        "=" +
        encodeURIComponent(value) +
        "; path=/; max-age=" +
        maxAge +
        "; SameSite=Lax" +
        secureFlag;
    } catch (_) {
      // Ignora em ambientes sem suporte a cookies (ex: file:// restrito)
    }
  }

  function getCookie(name) {
    try {
      const target = encodeURIComponent(name) + "=";
      const parts = document.cookie.split(";");
      for (let i = 0; i < parts.length; i++) {
        const c = parts[i].trim();
        if (c.indexOf(target) === 0) {
          return decodeURIComponent(c.substring(target.length));
        }
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  function safeStorageGet(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(key, obj) {
    try {
      window.localStorage.setItem(key, JSON.stringify(obj));
    } catch (_) {
      // Fallback silencioso
    }
  }

  // ==========================================================================
  // 1. INICIALIZAÇÃO DO DATALAYER + GOOGLE CONSENT MODE v2
  // ==========================================================================
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  function getSavedConsent() {
    const saved = safeStorageGet(STORAGE_KEYS.consent);
    if (saved && typeof saved.marketing === "boolean") {
      return saved;
    }
    return null;
  }

  function initConsentMode() {
    const saved = getSavedConsent();
    const status = saved && saved.marketing ? "granted" : "denied";

    // Padrão Google Consent Mode v2 (LGPD friendly — atualiza imediatamente após escolha)
    window.gtag("consent", "default", {
      ad_storage: saved ? status : "granted",
      ad_user_data: saved ? status : "granted",
      ad_personalization: saved ? status : "granted",
      analytics_storage: saved ? status : "granted",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500,
    });

    // Ativa URL passthrough para manter sinais do Google Ads mesmo se cookies forem recusados
    window.gtag("set", "url_passthrough", true);
    logDebug("Consent Mode v2 inicializado", { saved: saved || "default_brasil" });
  }

  function updateConsent(marketingGranted) {
    const state = marketingGranted ? "granted" : "denied";
    const payload = {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    };

    window.gtag("consent", "update", payload);
    safeStorageSet(STORAGE_KEYS.consent, {
      marketing: Boolean(marketingGranted),
      updatedAt: new Date().toISOString(),
    });
    setCookie(STORAGE_KEYS.consent, marketingGranted ? "all" : "essential", 180);

    pushEvent("consent_updated", {
      consent_choice: marketingGranted ? "all" : "essential",
    });
  }

  // ==========================================================================
  // 2. CAPTURA E PERSISTÊNCIA DE ATRIBUIÇÃO DE CAMPANHA (GOOGLE ADS)
  // ==========================================================================
  function captureAttribution() {
    const incoming = {};
    let hasCampaignData = false;

    TRACKED_PARAMS.forEach(function (param) {
      const value = urlParams.get(param);
      if (value) {
        incoming[param] = value.trim();
        hasCampaignData = true;
      }
    });

    const existingLast = safeStorageGet(STORAGE_KEYS.lastTouch) || {};
    const existingFirst = safeStorageGet(STORAGE_KEYS.firstTouch);

    let lastTouch = existingLast;

    if (hasCampaignData) {
      lastTouch = Object.assign({}, incoming, {
        landing_page: window.location.href,
        referrer: document.referrer || "direct",
        captured_at: new Date().toISOString(),
      });

      safeStorageSet(STORAGE_KEYS.lastTouch, lastTouch);
      setCookie(STORAGE_KEYS.lastTouch, JSON.stringify(lastTouch), TRACKING_CONFIG.cookieDays);

      // Cookies individuais de clique para leitura imediata no Stape sGTM
      if (incoming.gclid) setCookie("_cp_gclid", incoming.gclid, TRACKING_CONFIG.cookieDays);
      if (incoming.gbraid) setCookie("_cp_gbraid", incoming.gbraid, TRACKING_CONFIG.cookieDays);
      if (incoming.wbraid) setCookie("_cp_wbraid", incoming.wbraid, TRACKING_CONFIG.cookieDays);
      if (incoming.fbclid) setCookie("_cp_fbclid", incoming.fbclid, TRACKING_CONFIG.cookieDays);
      if (incoming.utm_campaign) {
        setCookie("_cp_utm_campaign", incoming.utm_campaign, TRACKING_CONFIG.cookieDays);
      }

      if (!existingFirst) {
        safeStorageSet(STORAGE_KEYS.firstTouch, lastTouch);
        setCookie(STORAGE_KEYS.firstTouch, JSON.stringify(lastTouch), TRACKING_CONFIG.cookieDays);
      }
    } else if (!existingLast.landing_page) {
      lastTouch = {
        landing_page: window.location.href,
        referrer: document.referrer || "direct",
        captured_at: new Date().toISOString(),
      };
      safeStorageSet(STORAGE_KEYS.lastTouch, lastTouch);
    }

    const summary = {
      last_touch: lastTouch,
      first_touch: existingFirst || lastTouch,
      gclid: lastTouch.gclid || getCookie("_cp_gclid") || "",
      gbraid: lastTouch.gbraid || getCookie("_cp_gbraid") || "",
      wbraid: lastTouch.wbraid || getCookie("_cp_wbraid") || "",
      fbclid: lastTouch.fbclid || getCookie("_cp_fbclid") || "",
      utm_source: lastTouch.utm_source || "",
      utm_medium: lastTouch.utm_medium || "",
      utm_campaign: lastTouch.utm_campaign || "",
      utm_term: lastTouch.utm_term || "",
      utm_content: lastTouch.utm_content || "",
    };

    logDebug("Atribuição Google Ads / Campanha", summary);
    return summary;
  }

  // ==========================================================================
  // 3. CARREGADOR DO GTM VIA DOMÍNIO PRÓPRIO DO STAPE (sGTM)
  // ==========================================================================
  function loadStapeGTM() {
    const gtmId = (TRACKING_CONFIG.gtmWebId || "").trim();
    if (!gtmId) {
      logDebug(
        "GTM/Stape em standby (sem IDs configurados ainda). Todos os eventos já estão sendo emitidos no window.dataLayer."
      );
      return;
    }

    const baseDomain = (TRACKING_CONFIG.stapeCustomDomain || "").trim().replace(/\/+$/, "");
    const loaderPath = TRACKING_CONFIG.stapeLoaderPath || "/gtm.js";
    const scriptHost = baseDomain || "https://www.googletagmanager.com";
    const scriptUrl = scriptHost + loaderPath + "?id=" + encodeURIComponent(gtmId);

    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = scriptUrl;
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    logDebug("Contêiner GTM carregado via Stape", { scriptUrl: scriptUrl });
  }

  // ==========================================================================
  // 4. EMISSOR PADRONIZADO DE EVENTOS (DATALAYER + DEDUPLICAÇÃO EVENT_ID)
  // ==========================================================================
  let attributionState = null;

  function pushEvent(eventName, extraData, eventIdPrefix) {
    const eventId =
      (extraData && extraData.event_id) || generateEventId(eventIdPrefix || "evt");
    const payload = Object.assign(
      {
        event: eventName,
        event_id: eventId,
        event_timestamp: new Date().toISOString(),
        page_path: window.location.pathname,
        page_title: document.title,
        attribution: {
          gclid: attributionState ? attributionState.gclid : "",
          gbraid: attributionState ? attributionState.gbraid : "",
          wbraid: attributionState ? attributionState.wbraid : "",
          fbclid: attributionState ? attributionState.fbclid : "",
          utm_source: attributionState ? attributionState.utm_source : "",
          utm_medium: attributionState ? attributionState.utm_medium : "",
          utm_campaign: attributionState ? attributionState.utm_campaign : "",
          utm_term: attributionState ? attributionState.utm_term : "",
          utm_content: attributionState ? attributionState.utm_content : "",
        },
      },
      extraData || {}
    );

    window.dataLayer.push(payload);
    logDebug("Evento -> " + eventName, payload);
    return eventId;
  }

  function sanitizeUserData(raw) {
    const data = raw || {};
    const fullName =
      data.nome ||
      data.name ||
      [data.fn || data.first_name || "", data.ln || data.last_name || ""]
        .filter(Boolean)
        .join(" ");
    const email = data.em || data.email || "";
    const phone = data.ph || data.phone_number || data.whatsapp || "";
    const birthDate = data.db || data.nascimento || data.birth_date || "";
    const gender = data.ge || data.genero || data.gender || "";
    return normalizeUserData(fullName, email, phone, birthDate, gender);
  }

  function trackOpenCheckoutModal(ctaLocation) {
    return pushEvent("open_checkout_modal", {
      event_id: generateEventId("modal"),
      cta_location: ctaLocation || "checkout_cta",
    });
  }

  function trackPreCheckout(details) {
    const info = details || {};
    const eventId = info.event_id || generateEventId("chk");
    const userData = sanitizeUserData(
      Object.assign({}, info, info.user_data || {})
    );
    const attr = info.attribution || attributionState || {};
    const ctaLocation = info.cta_location || "checkout_cta";
    const trafficSource = info.traffic_source || attr.utm_source || "direto";
    const trafficMedium = info.traffic_medium || attr.utm_medium || "nenhum";
    const trafficCampaign = info.traffic_campaign || attr.utm_campaign || "nenhuma";
    const hasCallback = typeof info.eventCallback === "function";
    const eventTimeout = Number(info.eventTimeout) || 600;
    let remainingCallbacks = hasCallback ? 2 : 0;

    // Persiste no localStorage para eventual uso futuro na sessão
    safeStorageSet(STORAGE_KEYS.userData, userData);

    function createStepCallback() {
      if (!hasCallback) return null;
      let fired = false;
      return function () {
        if (fired) return;
        fired = true;
        remainingCallbacks -= 1;
        if (remainingCallbacks <= 0) {
          info.eventCallback();
        }
      };
    }

    // 1. Evento begin_checkout_treino (aciona CE - Begin Checkout Treino no GTM Web)
    const treinoPayload = {
      event_id: eventId,
      value: TRACKING_CONFIG.product.price,
      currency: TRACKING_CONFIG.product.currency,
      traffic_source: trafficSource,
      traffic_medium: trafficMedium,
      traffic_campaign: trafficCampaign,
      cta_location: ctaLocation,
      // Campos na raiz para leitura imediata pelas suas DLVs atuais
      email: userData.em,
      phone: userData.ph,
      first_name: userData.fn,
      last_name: userData.ln,
      birth_date: userData.db,
      gender: userData.ge,
      // Objeto estruturado para Enhanced Conversions / GA4 / Stape CAPI
      user_data: userData,
    };
    if (hasCallback) {
      treinoPayload.eventCallback = createStepCallback();
      treinoPayload.eventTimeout = eventTimeout;
    }
    pushEvent("begin_checkout_treino", treinoPayload);

    // 2. Evento padrão GA4 Ecommerce / Meta begin_checkout com mesmo event_id e user_data
    window.dataLayer.push({ ecommerce: null });
    const ga4Payload = {
      event_id: eventId,
      value: TRACKING_CONFIG.product.price,
      currency: TRACKING_CONFIG.product.currency,
      cta_location: ctaLocation,
      // Campos na raiz para leitura imediata pelas suas DLVs atuais
      email: userData.em,
      phone: userData.ph,
      first_name: userData.fn,
      last_name: userData.ln,
      birth_date: userData.db,
      gender: userData.ge,
      // Objeto estruturado para Enhanced Conversions / GA4 / Stape CAPI
      user_data: userData,
      ecommerce: {
        currency: TRACKING_CONFIG.product.currency,
        value: TRACKING_CONFIG.product.price,
        items: [TRACKING_CONFIG.product],
      },
    };
    if (hasCallback) {
      ga4Payload.eventCallback = createStepCallback();
      ga4Payload.eventTimeout = eventTimeout;
    }
    pushEvent("begin_checkout", ga4Payload);

    return {
      event_id: eventId,
      user_data: userData,
    };
  }

  // ==========================================================================
  // 5. DECORADOR AUTOMÁTICO DE LINK DE CHECKOUT (REPASSE DE GCLID + UTMS)
  // ==========================================================================
  function decorateCheckoutUrl(rawUrl, eventId) {
    const target = (rawUrl || TRACKING_CONFIG.checkoutUrl || "").trim();
    if (!target || target === "#checkout") return "";

    try {
      const url = new URL(target, window.location.origin);
      const source = (attributionState && attributionState.last_touch) || {};

      TRACKED_PARAMS.forEach(function (param) {
        if (source[param] && !url.searchParams.has(param)) {
          url.searchParams.set(param, source[param]);
        }
      });

      if (eventId) {
        url.searchParams.set("cp_event_id", eventId);
      }

      return url.toString();
    } catch (_) {
      return target;
    }
  }

  function trackCta(ctaLocation, isCheckout) {
    if (isCheckout) {
      // Limpa objeto ecommerce anterior (boa prática GA4 / sGTM)
      window.dataLayer.push({ ecommerce: null });

      const eventId = pushEvent("begin_checkout", {
        event_id: generateEventId("chk"),
        value: TRACKING_CONFIG.product.price,
        currency: TRACKING_CONFIG.product.currency,
        cta_location: ctaLocation,
        ecommerce: {
          currency: TRACKING_CONFIG.product.currency,
          value: TRACKING_CONFIG.product.price,
          items: [TRACKING_CONFIG.product],
        },
      });

      return eventId;
    }

    return pushEvent("cta_click", {
      event_id: generateEventId("eng"),
      cta_location: ctaLocation,
    });
  }

  function trackVideo(slotName, title, action) {
    return pushEvent("video_engagement", {
      event_id: generateEventId("eng"),
      video_slot: slotName,
      video_title: title,
      video_action: action || "play_click",
    });
  }

  // ==========================================================================
  // 6. RASTREAMENTO AUTOMÁTICO DE PROFUNDIDADE DE SCROLL & SEÇÕES
  // ==========================================================================
  function bindAutoEngagementTracking() {
    // 6.1 Marcos de Scroll (25%, 50%, 75%, 90%)
    const milestones = [25, 50, 75, 90];
    const reached = new Set();

    window.addEventListener(
      "scroll",
      function () {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;
        const percent = Math.round((window.scrollY / docHeight) * 100);

        milestones.forEach(function (mark) {
          if (percent >= mark && !reached.has(mark)) {
            reached.add(mark);
            pushEvent("scroll_milestone", {
              event_id: generateEventId("eng"),
              scroll_percent: mark,
              scroll_depth: mark,
            });
          }
        });
      },
      { passive: true }
    );

    // 6.2 Visualização de Seções Estratégicas
    if ("IntersectionObserver" in window) {
      const seenSections = new Set();
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            const sectionName = entry.target.getAttribute("data-track-section");
            if (sectionName && !seenSections.has(sectionName)) {
              seenSections.add(sectionName);
              pushEvent("section_view", {
                event_id: generateEventId("eng"),
                section_name: sectionName,
              });
            }
          });
        },
        { threshold: 0.35 }
      );

      document.querySelectorAll("[data-track-section]").forEach(function (el) {
        observer.observe(el);
      });
    }
  }

  // ==========================================================================
  // BOOTSTRAP IMEDIATO (NO <HEAD>)
  // ==========================================================================
  initConsentMode();
  attributionState = captureAttribution();
  loadStapeGTM();

  pushEvent("lp_attribution_ready", {
    has_gclid: Boolean(attributionState.gclid || attributionState.gbraid || attributionState.wbraid),
  });

  // Dispara view_item + observadores + meta_pageview assim que o DOM estiver pronto
  document.addEventListener("DOMContentLoaded", function () {
    window.dataLayer.push({ ecommerce: null });
    pushEvent("view_item", {
      ecommerce: {
        currency: TRACKING_CONFIG.product.currency,
        value: TRACKING_CONFIG.product.price,
        items: [TRACKING_CONFIG.product],
      },
    });

    bindAutoEngagementTracking();

    pushEvent("meta_pageview", {
      event_id: generateEventId("pv"),
    });
  });

  // API pública para integração com app.js e testes manuais
  window.CPTracking = {
    config: TRACKING_CONFIG,
    generateEventId: generateEventId,
    normalizeUserData: normalizeUserData,
    sanitizeUserData: sanitizeUserData,
    pushEvent: pushEvent,
    trackCta: trackCta,
    trackOpenCheckoutModal: trackOpenCheckoutModal,
    trackPreCheckout: trackPreCheckout,
    trackVideo: trackVideo,
    decorateCheckoutUrl: decorateCheckoutUrl,
    updateConsent: updateConsent,
    hasSavedConsent: function () {
      return getSavedConsent() !== null;
    },
    getAttribution: function () {
      return attributionState;
    },
  };
})(window, document);
