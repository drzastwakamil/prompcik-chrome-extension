// Popup script
document.addEventListener('DOMContentLoaded', () => {
  const resultDiv = document.getElementById('result');

  function show(message) {
    if (!resultDiv) return;
    resultDiv.textContent = message;
    resultDiv.className = 'show';
  }

  show('Prototype v1.0 — Use the floating toolbar on the page.');
});

