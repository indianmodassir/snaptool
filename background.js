// ContextMenus options
const ContextOptions = {
  "fscrSnap": "Fullscreen snap  (Ctrl + m)",
  "fpgSnap": "Fullpage snap    (Ctrl + b)",
  "specSnap": "Specific snap     (Ctrl + q)"
};

// Create ContextMenus option
chrome.runtime.onInstalled.addListener(function() {
  for(let id in ContextOptions) {
    chrome.contextMenus.create({
      id,
      title: ContextOptions[id],
      contexts: ["all"]
    });
  }
});

// POST or SEND menuItemId from backgorund.js to content.js
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId in ContextOptions) {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: (id) => window.postMessage({id}),
      args: [info.menuItemId]
    });
  }
});