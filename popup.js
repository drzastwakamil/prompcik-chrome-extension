// Popup script
document.addEventListener('DOMContentLoaded', () => {
  const readDOMBtn = document.getElementById('readDOM');
  const addOverlayBtn = document.getElementById('addOverlay');
  const showInfoBtn = document.getElementById('showInfo');
  const analyzeVisibleBtn = document.getElementById('analyzeVisible');
  const fetchCatsBtn = document.getElementById('fetchCats');
  const resultDiv = document.getElementById('result');

  // Function to display results
  function showResult(message, isError = false) {
    resultDiv.textContent = message;
    resultDiv.className = isError ? 'show error' : 'show';
  }

  // Function to handle connection errors
  function handleConnectionError() {
    showResult('⚠️ Please refresh the webpage and try again!\n\n(The extension needs to reload on the page)', true);
  }

  // Read DOM button
  readDOMBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, { action: 'readDOM' }, (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
            handleConnectionError();
          } else {
            showResult('Error: ' + chrome.runtime.lastError.message, true);
          }
          return;
        }
        
        if (response && response.success) {
          const data = response.data;
          const formattedData = `
📄 Title: ${data.title}
🌐 URL: ${data.url}
📝 Paragraphs: ${data.paragraphs}
🖼️ Images: ${data.images}
🔗 Links: ${data.links}
📋 Headings: ${data.headings}
📋 Forms: ${data.forms}
          `.trim();
          showResult(formattedData);
        }
      });
    } catch (error) {
      showResult('Error: ' + error.message, true);
    }
  });

  // Add overlay button
  addOverlayBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const overlayConfig = {
        text: '✨ Custom Overlay Created!',
        top: Math.random() * 100 + 50 + 'px',
        right: '20px',
        backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.9)`
      };
      
      chrome.tabs.sendMessage(tab.id, { 
        action: 'addOverlay',
        config: overlayConfig
      }, (response) => {
        console.log('deez nuts response', response)
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
            handleConnectionError();
          } else {
            showResult('Error: ' + chrome.runtime.lastError.message, true);
          }
          return;
        }
        
        if (response && response.success) {
          showResult('✅ Overlay added successfully!');
        }
      });
    } catch (error) {
      showResult('Error: ' + error.message, true);
    }
  });

  // Show DOM info overlay button
  showInfoBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, { action: 'showDOMInfo' }, (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
            handleConnectionError();
          } else {
            showResult('Error: ' + chrome.runtime.lastError.message, true);
          }
          return;
        }
        
        if (response && response.success) {
          showResult('✅ DOM info overlay added to page!');
        }
      });
    } catch (error) {
      showResult('Error: ' + error.message, true);
    }
  });

  // Analyze visible post button
  analyzeVisibleBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      showResult('🔎 Analyzing visible post...');
      chrome.tabs.sendMessage(tab.id, { action: 'analyzeVisiblePost' }, (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
            handleConnectionError();
          } else {
            showResult('Error: ' + chrome.runtime.lastError.message, true);
          }
          return;
        }
        console.log('deez nuts response', response);
        if (response && response.success) {
          showResult('⏳ Analysis started — watch the page overlay.');
        } else if (response && !response.success) {
          showResult('❌ Error: ' + (response.error || 'Unknown error'), true);
        }
      });
    } catch (error) {
      showResult('Error: ' + error.message, true);
    }
  });

  // Fetch cats button
  fetchCatsBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      showResult('🔄 Fetching cat data...');
      
      chrome.tabs.sendMessage(tab.id, { action: 'fetchCats', fireAndForget: true }, (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
            handleConnectionError();
          } else {
            showResult('Error: ' + chrome.runtime.lastError.message, true);
          }
          return;
        }
        
        if (response && response.success) {
          // Immediate ACK; actual UI will be injected by the content script when ready
          showResult('⏳ Cat fetch started... look on the page for the overlay!');
        } else if (response && !response.success) {
          showResult('❌ Error: ' + response.error, true);
        }
      });
    } catch (error) {
      showResult('Error: ' + error.message, true);
    }
  });
});

