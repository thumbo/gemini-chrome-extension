/* Gemini Architect — Copy Conversation */
(function (GA) {

  // --------------- Extract messages ---------------
  function getConversationText() {
    // Find all message containers in the main content area
    // Gemini uses turn-based containers with user/model messages
    const messages = [];

    // Strategy 1: Look for message containers with role indicators
    const turns = document.querySelectorAll(
      '[data-turn-role], .conversation-turn, [class*="turn"], [class*="message-content"]'
    );

    if (turns.length > 0) {
      for (const turn of turns) {
        const role = turn.getAttribute('data-turn-role') ||
          (turn.classList.contains('user') || turn.querySelector('[data-is-user]') ? 'user' : 'model');
        const label = role === 'user' ? 'You' : 'Gemini';
        const text = turn.innerText.trim();
        if (text) messages.push(`${label}:\n${text}`);
      }
    }

    // Strategy 2: Fallback — find alternating message blocks in main content
    if (messages.length === 0) {
      const main = document.querySelector('main, [role="main"], .chat-container');
      if (main) {
        // Look for query/response patterns
        const queries = main.querySelectorAll(
          '[class*="query"], [class*="prompt"], [class*="user-message"], [data-message-author="user"]'
        );
        const responses = main.querySelectorAll(
          '[class*="response"], [class*="model-response"], [data-message-author="model"], .markdown-body'
        );

        // If structured elements found, pair them
        if (queries.length > 0 || responses.length > 0) {
          const all = [...main.querySelectorAll(
            '[class*="query"], [class*="prompt"], [class*="user-message"], [class*="response"], [class*="model-response"], .markdown-body'
          )];
          for (const el of all) {
            const cls = el.className.toLowerCase();
            const isUser = cls.includes('query') || cls.includes('prompt') || cls.includes('user');
            const label = isUser ? 'You' : 'Gemini';
            const text = el.innerText.trim();
            if (text) messages.push(`${label}:\n${text}`);
          }
        }
      }
    }

    // Strategy 3: Last resort — grab all text from main area
    if (messages.length === 0) {
      const main = document.querySelector('main, [role="main"]');
      if (main) {
        return main.innerText.trim();
      }
    }

    return messages.join('\n\n---\n\n');
  }

  function getLastResponse() {
    // Find the last model/Gemini response
    const responses = document.querySelectorAll(
      '[data-turn-role="model"], .model-response, [class*="response"]:not([class*="user"]), .markdown-body'
    );

    if (responses.length > 0) {
      return responses[responses.length - 1].innerText.trim();
    }

    // Fallback: last large text block in main
    const main = document.querySelector('main, [role="main"]');
    if (main) {
      const blocks = main.querySelectorAll('div, p, pre');
      for (let i = blocks.length - 1; i >= 0; i--) {
        const text = blocks[i].innerText.trim();
        if (text.length > 50) return text;
      }
    }

    return '';
  }

  // --------------- Copy to clipboard ---------------
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }
  }

  // --------------- Init button in header ---------------
  GA.initCopyConversation = function (headerContainer) {
    if (document.getElementById('ga-copy-convo-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'ga-copy-convo-btn';
    btn.className = 'ga-copy-convo-btn';
    btn.innerHTML = '\uD83D\uDCCB Copy Chat';
    btn.title = 'Copy entire conversation (Alt+Shift+A)';

    btn.addEventListener('click', async () => {
      const text = getConversationText();
      if (!text) {
        GA.showToast('No conversation to copy');
        return;
      }
      const ok = await copyToClipboard(text);
      GA.showToast(ok ? 'Conversation copied!' : 'Failed to copy');
    });

    headerContainer.appendChild(btn);
  };

  // Expose for shortcuts
  GA.copyConversation = async function () {
    const text = getConversationText();
    if (!text) {
      GA.showToast('No conversation to copy');
      return;
    }
    const ok = await copyToClipboard(text);
    GA.showToast(ok ? 'Conversation copied!' : 'Failed to copy');
  };

  GA.copyLastResponse = async function () {
    const text = getLastResponse();
    if (!text) {
      GA.showToast('No response to copy');
      return;
    }
    const ok = await copyToClipboard(text);
    GA.showToast(ok ? 'Last response copied!' : 'Failed to copy');
  };

})(window.GeminiArchitect);
