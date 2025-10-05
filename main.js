// Main entry point - sends message to content script to show the app
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  chrome.tabs.sendMessage(tab.id, { action: 'showToolbar' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
    } else {
      console.log('Toolbar shown:', response);
    }
  });
  
  // Close popup immediately
  window.close();
});

