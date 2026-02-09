/* Gemini Architect — DOM Observer utilities */
(function (GA) {

  /**
   * Wait for a DOM element to appear.
   * @param {string} selector
   * @param {number} timeout  ms (default 15 000)
   * @returns {Promise<Element>}
   */
  GA.waitForElement = function (selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      if (timeout > 0) {
        setTimeout(() => {
          observer.disconnect();
          reject(new Error(`[GA] waitForElement timeout: ${selector}`));
        }, timeout);
      }
    });
  };

  /**
   * Observe sidebar for child-list changes (chat items added/removed).
   * Calls `callback` at most once per 250 ms.
   */
  GA.onSidebarChange = function (callback) {
    let timer = null;
    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        callback();
      }, 250);
    });

    // Start observing once sidebar exists
    GA.waitForElement('nav, [role="navigation"], aside').then(sidebar => {
      observer.observe(sidebar, { childList: true, subtree: true });
    }).catch(() => {
      // Fallback: observe body
      observer.observe(document.body, { childList: true, subtree: true });
    });

    return observer;
  };

  /**
   * Detect SPA URL changes (popstate + polling).
   * Calls `callback(newUrl)` whenever the path changes.
   */
  GA.onUrlChange = function (callback) {
    let lastHref = location.href;

    const check = () => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        callback(lastHref);
      }
    };

    window.addEventListener('popstate', check);

    // Also catch pushState / replaceState
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function () {
      origPush.apply(this, arguments);
      check();
    };
    history.replaceState = function () {
      origReplace.apply(this, arguments);
      check();
    };

    // Polling fallback for edge cases
    setInterval(check, 1000);
  };

})(window.GeminiArchitect);
