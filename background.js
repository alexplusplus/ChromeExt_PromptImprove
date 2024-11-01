chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated:', tab.url);
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.startsWith('https://gemini.google.com/app')) {
      console.log('Gemini app detected, attempting to show side panel');
      
      // Inject content script programmatically to ensure it's loaded
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).then(() => {
        console.log('Content script injected successfully');
        if (chrome.sidePanel) {
          chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html',
            enabled: true
          }).then(() => {
            console.log('Side panel options set successfully');
          }).catch((error) => {
            console.error('Error setting side panel options:', error);
          });
        } else {
          console.warn('Side Panel API is not available.');
        }
      }).catch((err) => {
        console.error('Failed to inject content script:', err);
      });
    }
  }
});

// Add this to ensure the side panel is opened when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.startsWith('https://gemini.google.com/app')) {
    console.log('Extension icon clicked, opening side panel');
    chrome.sidePanel.open({tabId: tab.id});
  }
});