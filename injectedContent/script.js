const rootEl = document.querySelector('html');

function handleExtensionToggle(isEnabled) {
  const extensionEnabledAttribute = 'data-looker-extension-enabled';
  if (isEnabled) {
    rootEl.setAttribute(extensionEnabledAttribute, '');
  } else {
    rootEl.removeAttribute(extensionEnabledAttribute);
  }
}

function registerMessageListeners() {
  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    const { type, payload } = message;
    let response;
    switch (type) {
      case 'EXTENSION_TOGGLE':
        handleExtensionToggle(payload);
        break;
      // case 'RANGE_CHANGE':
      //   handleRangeChange(payload);
      //   return;
      // case 'INVERT_CHANGE':
      //   handleInvertChange(payload, { disableTransition: true });
      //   return;
      // case 'SATURATION_CHANGE':
      //   handleSaturationChange(payload, { disableTransition: true });
      //   return;
      // case 'REQUEST_SETTINGS':
      //   handleRequestSettings(sendResponse);
      //   // Necessary to handle `sendResponse` asynchronously
      //   return true;
      default:
        return;
    }
    sendResponse(response);
  });
}

function init() {
  console.log('initialized');
  registerMessageListeners();
}

init();
