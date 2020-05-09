const enableControl = document.querySelector('#control__enable');
const disableControl = document.querySelector('#control__disable');
const invertControl = document.querySelector('#control__invert');
const saturateControl = document.querySelector('#control__saturation');

function getActiveTab() {
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

async function sendMessageToActiveTab(message) {
  try {
    const tab = await getActiveTab();
    chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    // TODO: Log error somewhere?
    console.error(err.message);
  }
}

function handleEnable() {
  sendMessageToActiveTab({ type: 'ENABLE' });
}

function handleDisable() {
  sendMessageToActiveTab({ type: 'DISABLE' });
}

function handleRangeChange() {
  sendMessageToActiveTab({
    type: 'RANGE_CHANGE',
  });
}

function handleInvertChange(e) {
  sendMessageToActiveTab({
    type: 'INVERT_CHANGE',
    payload: e.target.value,
  });
}

function handleSaturationChange(e) {
  sendMessageToActiveTab({
    type: 'SATURATION_CHANGE',
    payload: e.target.value,
  });
}

enableControl.addEventListener('click', handleEnable);
disableControl.addEventListener('click', handleDisable);
invertControl.addEventListener('input', handleInvertChange);
invertControl.addEventListener('change', handleRangeChange);
saturateControl.addEventListener('input', handleSaturationChange);
saturateControl.addEventListener('change', handleRangeChange);

sendMessageToActiveTab({ type: 'INIT' });
