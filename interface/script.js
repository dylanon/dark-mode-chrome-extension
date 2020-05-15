import { sendMessageToActiveTab } from '../chrome/index.js';

const extensionToggle = document.querySelector('#extension-toggle');

async function handleExtensionToggle(e) {
  const { checked } = e.target;
  console.log('sending message checked', checked);
  try {
    await sendMessageToActiveTab({
      type: 'EXTENSION_TOGGLE',
      payload: checked,
    });
    console.log('sent message', checked);
  } catch (error) {
    console.log('error sending message', error);
  }
}

function registerListeners() {
  extensionToggle.addEventListener('change', handleExtensionToggle);
}

function init() {
  registerListeners();
}

init();
