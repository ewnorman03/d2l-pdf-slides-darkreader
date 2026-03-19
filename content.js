const STYLE_ID = 'pdf-dark-reader-injected-style';

// New pages loaded with dark reader if persistent mode toggled by user.
chrome.storage.local.get(['persistentMode', 'darkModeEnabled'], ({ persistentMode, darkModeEnabled }) => {
  if (!persistentMode || !darkModeEnabled) return;
  if (document.getElementById(STYLE_ID)) return; // already applied

  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('dark-mode.css');
  document.head.appendChild(link);
});
