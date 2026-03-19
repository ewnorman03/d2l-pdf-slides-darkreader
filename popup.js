/// Extension popup functionality.

// Style id {@see content.js}
const STYLE_ID = 'pdf-dark-reader-injected-style';

// Inject into hmtl
function injectedEnable(styleId, cssUrl) {

  // Already injected into html
  if (document.getElementById(styleId)) return true;

  // Not already injected, create link element to dark-mode.css and inject into html head
  const link = document.createElement('link');
  link.id = styleId;
  link.rel = 'stylesheet';
  link.href = cssUrl;
  document.head.appendChild(link);
  return true;
}

// Remove dark mode css <link> 
function injectedDisable(styleId) {
  const e = document.getElementById(styleId);
  if (e) e.remove();
  return false;
}

// Check if injected
function injectedIsEnabled(styleId) {
  return !!document.getElementById(styleId);
}

// Popup state, used for popup style and toggle bools
let isDarkMode   = false;
let isPersistent = false;

// Popup ui references
const btn              = document.getElementById('toggleBtn');
const btnIcon          = document.getElementById('btnIcon');
const btnText          = document.getElementById('btnText');
const status           = document.getElementById('status');
const persistentToggle = document.getElementById('persistentToggle');

// Update popui based on dark vs light mode
function setDarkUI(dark) {
  isDarkMode = dark;
  if (dark) {
    btn.className   = 'on';
    btnIcon.textContent = '☀️';
    btnText.textContent = 'Disable Dark Mode';
    status.textContent  = 'Dark mode is active on this tab.';
  } else {
    btn.className   = 'off';
    btnIcon.textContent = '🌑';
    btnText.textContent = 'Enable Dark Mode';
    status.textContent  = 'Dark mode is off.';
  }
}

// Helper - get active tab
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Allow dark mode to run in all frames on a webpage, since each
// page of a PDF is a different frame.
async function scriptInAllFrames(tab, func, args) {
  return chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func,
    args,
  });
}

// Initialization -> fetch persisten state and check current tab
async function init() {
  // Load persistent mode preference from storage.
  const stored = await chrome.storage.local.get(['persistentMode', 'darkModeEnabled']);
  isPersistent = !!stored.persistentMode;
  persistentToggle.checked = isPersistent;

  // Determine current tab dark mode state by inspecting the live DOM.
  try {
    const tab = await getActiveTab();
    const results = await scriptInAllFrames(tab, injectedIsEnabled, [STYLE_ID]);
    setDarkUI(results.some(r => r.result));
  } catch {
    status.textContent = 'Cannot access page.';
    btn.disabled = true;
  }
}

// Dark mode toggle button
btn.addEventListener('click', async () => {
  btn.disabled = true;
  try {
    const tab    = await getActiveTab();
    const cssUrl = chrome.runtime.getURL('dark-mode.css');

    // Disable dark mode
    if (isDarkMode) {
      await scriptInAllFrames(tab, injectedDisable, [STYLE_ID]);
      setDarkUI(false);
    } 
    // Enable dark mode
    else {
      await scriptInAllFrames(tab, injectedEnable, [STYLE_ID, cssUrl]);
      setDarkUI(true);
    }

    // Store darkmode state if persisten mode is on
    if (isPersistent) {
      await chrome.storage.local.set({ darkModeEnabled: isDarkMode });
    }
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
  } finally {
    btn.disabled = false;
  }
});

// Persistent mode toggling
persistentToggle.addEventListener('change', async () => {
  isPersistent = persistentToggle.checked;

  if (isPersistent) {
    // Save persistent mode and theme applied
    await chrome.storage.local.set({ persistentMode: true, darkModeEnabled: isDarkMode });
  } 
  else {
    // Persistent not toggled, no dark mode on every new page/refresh
    await chrome.storage.local.set({ persistentMode: false, darkModeEnabled: false });
  }
});

init();
