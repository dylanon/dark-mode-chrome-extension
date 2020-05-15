import { sendMessageToActiveTab } from '../chrome/index.js';

const extensionToggle = document.querySelector('#extension-toggle');
const siteToggle = document.querySelector('#site-toggle');
const invertControl = document.querySelector('#invert-control');
const saturateControl = document.querySelector('#saturate-control');

async function handleExtensionToggle(e) {
  const { checked } = e.target;
  await sendMessageToActiveTab({
    type: 'EXTENSION_TOGGLE',
    payload: checked,
  });
}

async function handleSiteToggle(e) {
  const { checked } = e.target;
  await sendMessageToActiveTab({
    type: 'SITE_TOGGLE',
    payload: checked,
  });
}

function handleInvertInput(e) {
  sendMessageToActiveTab({
    type: 'INVERT_INPUT',
    payload: e.target.value,
  });
}

function handleSaturateInput(e) {
  sendMessageToActiveTab({
    type: 'SATURATE_INPUT',
    payload: e.target.value,
  });
}

function handleRangeChange(e, rangeType) {
  sendMessageToActiveTab({
    type: 'RANGE_CHANGE',
    payload: {
      rangeType,
      value: e.target.value,
    },
  });
}

function registerListeners() {
  extensionToggle.addEventListener('change', handleExtensionToggle);
  siteToggle.addEventListener('change', handleSiteToggle);
  invertControl.addEventListener('input', handleInvertInput);
  saturateControl.addEventListener('input', handleSaturateInput);
  invertControl.addEventListener('change', (e) =>
    handleRangeChange(e, 'invertFactor')
  );
  saturateControl.addEventListener('change', (e) =>
    handleRangeChange(e, 'saturateFactor')
  );
}

async function requestSettings() {
  const settings = await sendMessageToActiveTab({ type: 'REQUEST_SETTINGS' });
  return settings;
}

async function restoreSettings() {
  const settings = (await requestSettings()) || {};
  const {
    isExtensionEnabled,
    enabled: isEnabledForSite,
    invertFactor,
    saturateFactor,
  } = settings;

  if (!isExtensionEnabled) {
    extensionToggle.checked = false;
  } else {
    extensionToggle.checked = true;
  }

  if (!isEnabledForSite) {
    siteToggle.checked = false;
  } else {
    siteToggle.checked = true;
  }

  if (invertFactor !== undefined) {
    invertControl.value = invertFactor;
  }
  if (saturateFactor !== undefined) {
    saturateControl.value = saturateFactor;
  }
}

function init() {
  registerListeners();
  restoreSettings();
}

init();
