// Background script for Chrome Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Keep Tabs extension installed');
});

// Handle action button click (extension icon)
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Check if Keep Tabs page is already open
    const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('tab-manager.html') });
    
    if (tabs.length > 0) {
      // If page is already open, focus on it
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      // Open new tab with Keep Tabs page
      await chrome.tabs.create({
        url: chrome.runtime.getURL('tab-manager.html')
      });
    }
  } catch (error) {
    console.error('Error opening Keep Tabs page:', error);
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Update current tabs in storage
    updateCurrentTabs();
  }
});

// Listen for tab creation
chrome.tabs.onCreated.addListener((tab) => {
  updateCurrentTabs();
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  updateCurrentTabs();
});

// Function to update current tabs in storage
async function updateCurrentTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    const currentTabs = tabs.map(tab => ({
      id: tab.id.toString(),
      title: tab.title || 'Untitled',
      url: tab.url || '',
      favicon: tab.favIconUrl,
      pinned: tab.pinned,
      active: tab.active,
      lastAccessed: new Date()
    }));

    // Store in chrome.storage
    await chrome.storage.local.set({ currentTabs });
  } catch (error) {
    console.error('Error updating current tabs:', error);
  }
}

// Initialize current tabs on startup
updateCurrentTabs();