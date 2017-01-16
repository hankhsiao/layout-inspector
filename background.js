let executed = new Set();

chrome.tabs.onActivated.addListener(function(tab) {
  const tabId = tab.tabId;
  chrome.tabs.sendMessage(tabId, {action: 'echo'}, (res) => {
    if (res) {
      executed.add(tabId);
    } else {
      executed.delete(tabId);
    }
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
  if (changeInfo.status === 'loading') {
    chrome.tabs.sendMessage(tabId, {action: 'echo'}, (res) => {
      if (res) {
        executed.add(tabId);
      } else {
        executed.delete(tabId);
      }
    });
  }
});

chrome.browserAction.onClicked.addListener(function(tab) {
  if (!executed.has(tab.id)) {
    chrome.tabs.executeScript(tab.id, {file: 'content.js'});
    chrome.tabs.insertCSS(tab.id, {file: 'content.css'});
    executed.add(tab.id);
  }
  chrome.tabs.sendMessage(tab.id, {action: 'toggle'});
});
