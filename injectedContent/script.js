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
  return new Promise((resolve, reject) => {
    const [domainStorageKey] = getHostInfo();
    chrome.storage.sync.get(['isExtensionEnabled', domainStorageKey], function (
      settings
    ) {
      const errorMessage = chrome.runtime.lastError;
      if (errorMessage) {
        reject(new Error(errorMessage));
      }

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
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(
      {
        ...settings,
        ...patch,
        [domainStorageKey]: {
          ...settings[domainStorageKey],
          ...patch[domainStorageKey],
        },
      },
      () => {
        const errorMessage = chrome.runtime.lastError;
        if (errorMessage) {
          reject(new Error(errorMessage));
        }
        resolve();
      }
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
  return patchSettings(settingsPatch);
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
  return patchSettings(settingsPatch);
}

function setFilterTransition(value) {
  rootEl.style.setProperty('--lookerFilterTransitionDuration', value);
}

function handleRangeChange({ rangeType, value }) {
  setFilterTransition('0.3s');
  const [hostStorageKey] = getHostInfo();
  return patchSettings({
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
  try {
    const settings = (await getSettings()) || {};
    const { isExtensionEnabled } = settings;
    const [hostStorageKey] = getHostInfo();
    // Flatten settings since extension cannot fetch the host name
    const flattenedSettings = {
      isExtensionEnabled,
      ...settings[hostStorageKey],
    };
    sendResponse(flattenedSettings);
  } catch (error) {
    sendResponse({});
    throw error;
  }
}

function handleError(error) {
  console.error('[Looker extension] Error:', error.message);
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
        handleExtensionToggle(payload).catch(handleError).then(sendResponse);
        // Necessary to handle `sendResponse` asynchronously
        return true;
      case 'SITE_TOGGLE':
        handleSiteToggle(payload).catch(handleError).then(sendResponse);
        return true;
      case 'RANGE_CHANGE':
        handleRangeChange(payload).catch(handleError).then(sendResponse);
        return true;
      case 'INVERT_INPUT':
        handleInvertInput(payload, { disableTransition: true });
        sendResponse();
        return;
      case 'SATURATE_INPUT':
        handleSaturationInput(payload, { disableTransition: true });
        sendResponse();
        return;
      case 'REQUEST_SETTINGS':
        handleRequestSettings(sendResponse).catch(handleError);
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
    await handleExtensionToggle(isExtensionEnabled);
  }

  if (!enabled) {
    await handleSiteToggle(false);
  } else {
    await handleSiteToggle(true);
  }
  if (invertFactor !== undefined) {
    handleInvertInput(invertFactor);
  }
  if (saturateFactor !== undefined) {
    handleSaturationInput(saturateFactor);
  }
}

function init() {
  registerMessageListeners();
  restoreSettings().catch(handleError);
  setTimeout(() => {
    rootEl.setAttribute('data-looker-initialized', '');
  }, 10);
}

init();
