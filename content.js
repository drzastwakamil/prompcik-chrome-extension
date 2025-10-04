// Content script - runs on every webpage
console.log('DOM Reader & Overlay Extension loaded');

// Function to read DOM information
function readDOM() {
  const domInfo = {
    title: document.title,
    url: window.location.href,
    paragraphs: document.querySelectorAll('p').length,
    images: document.querySelectorAll('img').length,
    links: document.querySelectorAll('a').length,
    headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
    forms: document.querySelectorAll('form').length,
  };
  
  console.log('DOM Analysis:', domInfo);
  return domInfo;
}

// Function to create and add an overlay element
function addOverlayElement(config = {}) {
  const {
    text = 'Extension Overlay',
    top = '20px',
    right = '20px',
    backgroundColor = 'rgba(59, 130, 246, 0.95)',
    color = '#ffffff',
    id = 'extension-overlay-' + Date.now()
  } = config;

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'extension-overlay';
  
  // Apply styles
  overlay.style.position = 'fixed';
  overlay.style.top = top;
  overlay.style.right = right;
  overlay.style.backgroundColor = backgroundColor;
  overlay.style.color = color;
  overlay.style.padding = '15px 20px';
  overlay.style.borderRadius = '8px';
  overlay.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  overlay.style.zIndex = '999999';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.fontSize = '14px';
  overlay.style.cursor = 'move';
  overlay.style.userSelect = 'none';
  
  // Add content
  overlay.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
      <span>${text}</span>
      <button class="close-overlay" style="
        background: transparent;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
      ">×</button>
    </div>
  `;
  
  // Add close functionality
  const closeBtn = overlay.querySelector('.close-overlay');
  closeBtn.addEventListener('click', () => {
    overlay.remove();
  });
  
  // Make it draggable
  makeDraggable(overlay);
  
  // Add to page
  document.body.appendChild(overlay);
  
  return overlay;
}

// Function to make element draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  element.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
    element.style.right = 'auto';
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Function to add a DOM info overlay
function showDOMInfo() {
  const domInfo = readDOM();
  const infoText = `
    <div>
      <strong>DOM Info</strong><br>
      <div style="margin-top: 8px; font-size: 12px;">
        📄 Title: ${domInfo.title.substring(0, 30)}${domInfo.title.length > 30 ? '...' : ''}<br>
        📝 Paragraphs: ${domInfo.paragraphs}<br>
        🖼️ Images: ${domInfo.images}<br>
        🔗 Links: ${domInfo.links}<br>
        📋 Headings: ${domInfo.headings}<br>
        📋 Forms: ${domInfo.forms}
      </div>
    </div>
  `;
  
  addOverlayElement({
    text: infoText,
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(16, 185, 129, 0.95)'
  });
}

// Function to fetch and display cat data
async function fetchAndDisplayCats() {
  try {
    // Show loading overlay
    const loadingOverlay = addOverlayElement({
      text: '🔄 Fetching cats...',
      top: '100px',
      right: '20px',
      backgroundColor: 'rgba(234, 179, 8, 0.95)'
    });
    
    // Fetch from The Cat API (free, no key needed for basic use)
    const response = await fetch('https://api.thecatapi.com/v1/images/search?limit=1');
    const catData = await response.json();
    
    // Also fetch a cat fact
    const factResponse = await fetch('https://catfact.ninja/fact');
    const factData = await factResponse.json();
    
    // Remove loading overlay
    loadingOverlay.remove();
    
    // Create cat display overlay
    const catOverlay = document.createElement('div');
    catOverlay.className = 'extension-overlay cat-overlay';
    catOverlay.style.position = 'fixed';
    catOverlay.style.top = '100px';
    catOverlay.style.right = '20px';
    catOverlay.style.backgroundColor = 'rgba(139, 92, 246, 0.98)';
    catOverlay.style.color = '#ffffff';
    catOverlay.style.padding = '20px';
    catOverlay.style.borderRadius = '12px';
    catOverlay.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
    catOverlay.style.zIndex = '999999';
    catOverlay.style.fontFamily = 'Arial, sans-serif';
    catOverlay.style.maxWidth = '350px';
    catOverlay.style.cursor = 'move';
    
    catOverlay.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="margin: 0; font-size: 18px;">🐱 Random Cat</h3>
          <button class="close-overlay" style="
            background: transparent;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
          ">×</button>
        </div>
        <img src="${catData[0].url}" alt="Random cat" style="
          width: 100%;
          border-radius: 8px;
          max-height: 300px;
          object-fit: cover;
        ">
        <div style="
          background: rgba(255, 255, 255, 0.15);
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
        ">
          <strong>💡 Cat Fact:</strong><br>
          ${factData.fact}
        </div>
        <div style="
          font-size: 11px;
          opacity: 0.8;
          text-align: center;
        ">
          Data from thecatapi.com & catfact.ninja
        </div>
      </div>
    `;
    
    // Add close functionality
    const closeBtn = catOverlay.querySelector('.close-overlay');
    closeBtn.addEventListener('click', () => {
      catOverlay.remove();
    });
    
    // Make it draggable
    makeDraggable(catOverlay);
    
    // Add to page
    document.body.appendChild(catOverlay);
    
    return { success: true, data: { image: catData[0].url, fact: factData.fact } };
    
  } catch (error) {
    console.error('Error fetching cat data:', error);
    addOverlayElement({
      text: `❌ Error fetching cats: ${error.message}`,
      top: '100px',
      right: '20px',
      backgroundColor: 'rgba(239, 68, 68, 0.95)'
    });
    return { success: false, error: error.message };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'readDOM') {
    const domInfo = readDOM();
    sendResponse({ success: true, data: domInfo });
    return false; // Synchronous response
  } else if (request.action === 'addOverlay') {
    addOverlayElement(request.config);
    sendResponse({ success: true });
    return false; // Synchronous response
  } else if (request.action === 'showDOMInfo') {
    showDOMInfo();
    sendResponse({ success: true });
    return false; // Synchronous response
  } else if (request.action === 'fetchCats') {
    // Handle async response
    fetchAndDisplayCats().then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  return false; // Default: synchronous
});

// Add a simple overlay on load as a demo
setTimeout(() => {
  addOverlayElement({
    text: '🎉 Extension Active! (Drag me)',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(59, 130, 246, 0.95)'
  });
}, 1000);

