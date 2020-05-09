const body = document.querySelector('body');

function handleInit() {
  body.setAttribute('data-looker-initialized', '');
}

function handleEnable() {
  body.setAttribute('data-looker-enabled', '');
}

function handleDisable() {
  body.removeAttribute('data-looker-enabled');
}

function setFilterTransition(value) {
  body.style.setProperty('--lookerFilterTransitionDuration', value);
}

function handleRangeChange() {
  setFilterTransition('0.3s');
}

function handleInvertChange(value) {
  setFilterTransition('0s');
  body.style.setProperty('--lookerInvertFactor', value);
}

function handleSaturationChange(value) {
  setFilterTransition('0s');
  body.style.setProperty('--lookerSaturateFactor', value);
}

chrome.runtime.onMessage.addListener(function (message) {
  const { type, payload } = message;
  switch (type) {
    case 'INIT':
      handleInit();
      return;
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
      handleInvertChange(payload);
      return;
    case 'SATURATION_CHANGE':
      handleSaturationChange(payload);
      return;
    default:
      return;
  }
});
