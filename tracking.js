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

  // Gerador de UUID v4 para deduplicação client/server no Stape sGTM
  function generateEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "cp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
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

  function pushEvent(eventName, extraData) {
    const eventId = (extraData && extraData.event_id) || generateEventId();
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
    const fullName = String(data.nome || data.name || "")
      .trim()
      .replace(/\s+/g, " ");
    const parts = fullName ? fullName.split(" ") : [];
    const firstName = String(data.first_name || parts[0] || "").trim();
    const lastName = String(
      data.last_name !== undefined
        ? data.last_name
        : parts.length > 1
          ? parts.slice(1).join(" ")
          : ""
    ).trim();

    const email = String(data.email || "").trim().toLowerCase();
    let digits = String(data.phone_number || data.whatsapp || "").replace(/\D/g, "");
    if (digits && !digits.startsWith("55")) {
      digits = "55" + digits;
    }

    return {
      email: email,
      phone_number: digits,
      first_name: firstName,
      last_name: lastName,
    };
  }

  function trackPreCheckout(details) {
    const info = details || {};
    const eventId = info.event_id || generateEventId();
    const userData = sanitizeUserData(info.user_data || info);
    const attr = info.attribution || attributionState || {};
    const ctaLocation = info.cta_location || "checkout_cta";
    const trafficSource = info.traffic_source || attr.utm_source || "direto";
    const trafficMedium = info.traffic_medium || attr.utm_medium || "nenhum";
    const trafficCampaign = info.traffic_campaign || attr.utm_campaign || "nenhuma";

    // 1. Evento begin_checkout_treino (contrato GTM Web -> Stape sGTM)
    pushEvent("begin_checkout_treino", {
      event_id: eventId,
      value: TRACKING_CONFIG.product.price,
      currency: TRACKING_CONFIG.product.currency,
      traffic_source: trafficSource,
      traffic_medium: trafficMedium,
      traffic_campaign: trafficCampaign,
      cta_location: ctaLocation,
      user_data: userData,
    });

    // 2. Evento padrão GA4 Ecommerce begin_checkout com mesmo event_id e user_data
    window.dataLayer.push({ ecommerce: null });
    pushEvent("begin_checkout", {
      event_id: eventId,
      cta_location: ctaLocation,
      user_data: userData,
      ecommerce: {
        currency: TRACKING_CONFIG.product.currency,
        value: TRACKING_CONFIG.product.price,
        items: [TRACKING_CONFIG.product],
      },
    });

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
      cta_location: ctaLocation,
    });
  }

  function trackVideo(slotName, title, action) {
    return pushEvent("video_engagement", {
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
            pushEvent("scroll_milestone", { scroll_percent: mark });
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
              pushEvent("section_view", { section_name: sectionName });
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

  // Dispara view_item + observadores assim que o DOM estiver pronto
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
  });

  // API pública para integração com app.js e testes manuais
  window.CPTracking = {
    config: TRACKING_CONFIG,
    generateEventId: generateEventId,
    sanitizeUserData: sanitizeUserData,
    pushEvent: pushEvent,
    trackCta: trackCta,
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
