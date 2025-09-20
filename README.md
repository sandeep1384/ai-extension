🚀 AI Script Generator - Chrome Extension

An intelligent Chrome Extension that generates automation test scripts with ease.
This extension leverages AI to convert user actions or inputs into ready-to-use automation code, reducing manual effort and accelerating test development.

📌 Features

✅ Generate automation test scripts instantly using AI

✅ Supports multiple frameworks (e.g., Selenium, Playwright, Cypress, Puppeteer)

✅ Easy-to-use Chrome Extension interface

✅ Lightweight & fast execution

✅ Export generated scripts for direct use in projects

## 📂 Project Structure  

```bash
ai-script-generator-extension/
│── assets/              # Extension icons
│── src/                 # Core extension source code
│   ├── config           # Configuration files
│   ├── content          # Content scripts
│   ├── scripts          # Core logic and utilities
│   └── style            # Styling (CSS files)
│── bg.js                # Background service worker
│── manifest.json        # Chrome extension manifest (MV3)
│── panel.html           # Extension panel UI
│── README.md            # Project documentation


````


⚡ Installation

1. Clone this repository:
git clone https://github.com/<your-username>/ai-script-generator-extension.git

2. Open Google Chrome and navigate to:
   chrome://extensions/
   
3. Enable Developer mode (top right corner).
4. Click Load unpacked and select the project folder.
5.The AI Script Generator extension will appear in your Chrome toolbar.

🎯 Usage
1. Click on the extension icon in the Chrome toolbar.
2. Choose the automation framework (e.g., Selenium, Playwright).
3. Configure and select AI model and pass model api key.
4. Enter your test scenario or perform inspect actions.
5. Get instant AI-generated automation scripts.
6. Copy the script to use in your project.

🛠️ Tech Stack

1. JavaScript (ES6 modules) – Core logic for all source code (src/scripts/chat.js, popup.js, etc.)
2. Chrome Extension Manifest V3 – Extension configuration (manifest.json)
3. HTML & CSS – User interface components (panel.html, sidepanel.css, src/styles/styles.css)
4. Font Awesome – Iconography for UI elements
5. Prism.js – Syntax highlighting for generated scripts (lib/prism/prism.js)
6. Marked.js – Markdown parsing and rendering (lib/marked/marked.min.js)
7. Chrome Extension APIs – Leveraging storage, tabs, scripting, sidePanel, and messaging




