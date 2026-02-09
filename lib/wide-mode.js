/* Gemini Architect — Wide Mode toggle */
(function (GA) {

  GA.initWideMode = function (headerContainer) {
    if (document.getElementById('ga-wide-toggle')) return;

    const btn = document.createElement('button');
    btn.id = 'ga-wide-toggle';
    btn.className = 'ga-wide-toggle';
    btn.title = 'Toggle wide mode (Alt+Shift+W)';

    async function updateState() {
      const settings = await GA.getSettings();
      const active = !!settings.wideMode;
      btn.classList.toggle('active', active);
      btn.innerHTML = active
        ? '\u2194\uFE0F Wide'
        : '\u2194\uFE0F Wide';
      document.body.classList.toggle('ga-wide-mode', active);
    }

    btn.addEventListener('click', async () => {
      const settings = await GA.getSettings();
      await GA.updateSetting('wideMode', !settings.wideMode);
      updateState();
    });

    headerContainer.insertBefore(btn, headerContainer.firstChild);
    updateState();

    // Listen for external changes (e.g. shortcut toggle)
    GA.on('settingsChanged', updateState);
  };

  // Expose toggle for shortcuts
  GA.toggleWideMode = async function () {
    const settings = await GA.getSettings();
    await GA.updateSetting('wideMode', !settings.wideMode);
  };

})(window.GeminiArchitect);
