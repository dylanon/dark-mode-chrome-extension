const body = document.querySelector('body');

function sendMessageToExtension(message) {
  chrome.runtime.sendMessage(message);
}

function getSettings() {
  // TODO: Handle error from getting storage
  return new Promise((resolve) => {
    const [storageKey] = getHostInfo();
    chrome.storage.sync.get(storageKey, function (data) {
      const settings = data[storageKey];
      if (!settings) {
        resolve(null);
      }
      resolve(settings);
    });
  });
}

async function patchSettings(patch) {
  const [storageKey] = getHostInfo();
  let settings = (await getSettings()) || {};
  chrome.storage.sync.set({
    [storageKey]: {
      ...settings,
      ...patch,
    },
  });
}

function handleEnable() {
  body.removeAttribute('data-looker-disabled');
  patchSettings({
    enabled: true,
  });
}

function handleDisable() {
  body.setAttribute('data-looker-disabled', '');
  patchSettings({
    enabled: false,
  });
}

function setFilterTransition(value) {
  body.style.setProperty('--lookerFilterTransitionDuration', value);
}

function handleRangeChange() {
  setFilterTransition('0.3s');
}

function handleInvertChange(value, options = {}) {
  const { disableTransition } = options;
  if (disableTransition) {
    setFilterTransition('0s');
  }
  body.style.setProperty('--lookerInvertFactor', value);
  patchSettings({
    invertFactor: value,
  });
}

function handleSaturationChange(value, options = {}) {
  const { disableTransition } = options;
  if (disableTransition) {
    setFilterTransition('0s');
  }
  body.style.setProperty('--lookerSaturateFactor', value);
  patchSettings({
    saturateFactor: value,
  });
}

async function handleRequestSettings(sendResponse) {
  const settings = await getSettings();
  sendResponse(settings);
}

function registerMessageListeners() {
  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    const { type, payload } = message;
    switch (type) {
      case 'ENABLE':
        handleEnable();
        return;
      case 'DISABLE':
        handleDisable();
        return;
      case 'RANGE_CHANGE':
        handleRangeChange();
        return;
      case 'INVERT_CHANGE':
        handleInvertChange(payload, { disableTransition: true });
        return;
      case 'SATURATION_CHANGE':
        handleSaturationChange(payload, { disableTransition: true });
        // Necessary to handle `sendResponse` asynchronously
        return true;
      case 'REQUEST_SETTINGS':
        handleRequestSettings(sendResponse);
        // Necessary to handle `sendResponse` asynchronously
        return true;
      default:
        return;
    }
  });
}

function getHostInfo() {
  const { host } = window.location;
  return [
    `h:${host}`, // storage key
    host, // host
  ];
}

async function restoreSettings() {
  const [, host] = getHostInfo();
  const settings = await getSettings();
  if (!settings) {
    return;
  }
  const { enabled, invertFactor, saturateFactor } = settings;
  if (enabled) {
    handleEnable();
  } else {
    handleDisable();
  }
  if (invertFactor) {
    handleInvertChange(invertFactor);
  }
  if (saturateFactor) {
    handleSaturationChange(saturateFactor);
  }
}

function init() {
  body.setAttribute('data-looker-initialized', '');
  registerMessageListeners();
  restoreSettings();
}

init();
