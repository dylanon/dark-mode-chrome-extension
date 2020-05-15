const rootEl = document.querySelector('html');

const EXTENSION_ENABLED_ATTRIBUTE = 'data-looker-extension-enabled';
const SITE_ENABLED_ATTRIBUTE = 'data-looker-site-enabled';

function getHostInfo() {
  const { host } = window.location;
  return [
    `h:${host}`, // storage key
    host, // host
  ];
}

function getSettings() {
  // TODO: Handle error from getting storage
  return new Promise((resolve) => {
    const [domainStorageKey] = getHostInfo();
    chrome.storage.sync.get(['isExtensionEnabled', domainStorageKey], function (
      settings
    ) {
      if (!settings) {
        resolve(null);
      }
      resolve(settings);
    });
  });
}

async function patchSettings(patch) {
  const [domainStorageKey] = getHostInfo();
  let settings = (await getSettings()) || {};
  return new Promise((resolve) => {
    chrome.storage.sync.set(
      {
        ...settings,
        ...patch,
        [domainStorageKey]: {
          ...settings[domainStorageKey],
          ...patch[domainStorageKey],
        },
      },
      resolve()
    );
  });
}

function handleExtensionToggle(isEnabled) {
  let settingsPatch;
  if (isEnabled) {
    rootEl.setAttribute(EXTENSION_ENABLED_ATTRIBUTE, '');
    settingsPatch = {
      isExtensionEnabled: true,
    };
  } else {
    rootEl.removeAttribute(EXTENSION_ENABLED_ATTRIBUTE);
    settingsPatch = {
      isExtensionEnabled: false,
    };
  }
  patchSettings(settingsPatch);
}

function handleSiteToggle(isEnabled) {
  const [hostStorageKey] = getHostInfo();
  let settingsPatch;
  if (isEnabled) {
    rootEl.setAttribute(SITE_ENABLED_ATTRIBUTE, '');
    settingsPatch = {
      [hostStorageKey]: {
        enabled: true,
      },
    };
  } else {
    rootEl.removeAttribute(SITE_ENABLED_ATTRIBUTE);
    settingsPatch = {
      [hostStorageKey]: {
        enabled: false,
      },
    };
  }
  patchSettings(settingsPatch);
}

function setFilterTransition(value) {
  rootEl.style.setProperty('--lookerFilterTransitionDuration', value);
}

function handleRangeChange({ rangeType, value }) {
  setFilterTransition('0.3s');
  const [hostStorageKey] = getHostInfo();
  patchSettings({
    [hostStorageKey]: {
      [rangeType]: value,
    },
  });
}

function handleInvertInput(value, options = {}) {
  const { disableTransition } = options;
  if (disableTransition) {
    setFilterTransition('0s');
  }
  rootEl.style.setProperty('--lookerInvertFactor', value);
  rootEl.style.setProperty('--lookerMediaInvertFactor', value >= 0.5 ? 1 : 0);
}

function handleSaturationInput(value, options = {}) {
  const { disableTransition } = options;
  if (disableTransition) {
    setFilterTransition('0s');
  }
  rootEl.style.setProperty('--lookerSaturateFactor', value);
}

async function handleRequestSettings(sendResponse) {
  const settings = (await getSettings()) || {};
  const { isExtensionEnabled } = settings;
  const [hostStorageKey] = getHostInfo();
  // Flatten settings since extension cannot fetch the host name
  const flattenedSettings = {
    isExtensionEnabled,
    ...settings[hostStorageKey],
  };
  sendResponse(flattenedSettings);
}

function registerMessageListeners() {
  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    const { type, payload } = message;
    switch (type) {
      case 'EXTENSION_TOGGLE':
        handleExtensionToggle(payload);
        sendResponse();
        return;
      case 'SITE_TOGGLE':
        handleSiteToggle(payload);
        sendResponse();
        return;
      case 'RANGE_CHANGE':
        handleRangeChange(payload);
        sendResponse();
        return;
      case 'INVERT_INPUT':
        handleInvertInput(payload, { disableTransition: true });
        sendResponse();
        return;
      case 'SATURATE_INPUT':
        handleSaturationInput(payload, { disableTransition: true });
        sendResponse();
        return;
      case 'REQUEST_SETTINGS':
        handleRequestSettings(sendResponse);
        // Necessary to handle `sendResponse` asynchronously
        return true;
      default:
        return;
    }
  });
}

async function restoreSettings() {
  const settings = (await getSettings()) || {};
  const { isExtensionEnabled } = settings;
  const [hostStorageKey] = getHostInfo();
  const { enabled, invertFactor, saturateFactor } =
    settings[hostStorageKey] || {};

  if (isExtensionEnabled) {
    handleExtensionToggle(isExtensionEnabled);
  }

  if (!enabled) {
    handleSiteToggle(false);
  } else {
    handleSiteToggle(true);
  }
  if (invertFactor !== undefined) {
    handleInvertInput(invertFactor);
  }
  if (saturateFactor !== undefined) {
    handleSaturationInput(saturateFactor);
  }
}

async function init() {
  registerMessageListeners();
  await restoreSettings();
  setTimeout(() => {
    rootEl.setAttribute('data-looker-initialized', '');
  }, 10);
}

init();
