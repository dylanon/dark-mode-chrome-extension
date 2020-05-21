export function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const [tab] = tabs;
      if (!tab) {
        reject(new Error('No active tab.'));
      }
      resolve(tab);
    });
  });
}

export async function sendMessageToActiveTab(message) {
  const tab = await getActiveTab();
  const tabResponse = await new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      const errorMessage = chrome.runtime.lastError;
      if (errorMessage) {
        reject(new Error(errorMessage));
      }
      resolve(response);
    });
  });
  return tabResponse;
}
