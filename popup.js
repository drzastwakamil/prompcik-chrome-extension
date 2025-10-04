// Popup script
document.addEventListener('DOMContentLoaded', () => {
  const resultDiv = document.getElementById('result');

  function show(message) {
    if (!resultDiv) return;
    resultDiv.textContent = message;
    resultDiv.className = 'show';
  }

  show('Extension active — Use the floating toolbar or select text to fact-check content.');
});

