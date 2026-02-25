// ====================================
// ZEN NOTE - SIMPLE VERSION
// No login required - all data stored locally
// ====================================

// DOM Elements
const writingArea = document.getElementById('writing-area');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const limitCount = document.getElementById('limit-count');
const limitDisplay = document.getElementById('limit-display');
const themeButtons = document.querySelectorAll('.theme-btn');
const limitToggle = document.getElementById('limit-toggle');
const wordLimitInput = document.getElementById('word-limit-input');
const statsPanel = document.querySelector('.stats-panel');
const saveBtn = document.getElementById('saveBtn');
const openBtn = document.getElementById('openBtn');
const newBtn = document.getElementById('newBtn');
const fileInput = document.getElementById('file-input');
const fontSelect = document.getElementById('font-select');
const fontSizeSelect = document.getElementById('font-size-select');

// Application State
let wordLimit = 500;
let isLimitEnabled = false;
let currentFileName = 'untitled.txt';
let currentFileHandle = null; // For File System Access API
let currentFont = 'georgia';
let isSaved = false;

// ====================================
// DATA PERSISTENCE
// ====================================

/**
 * Load data from local storage and set the application state.
 */
function loadData() {
      const saved = JSON.parse(localStorage.getItem('zenNote')) || {};

      // Load text from local storage
      if (typeof saved.text === 'string') writingArea.value = saved.text;

      // Load theme from local storage
      if (typeof saved.theme === 'string') {
            document.body.classList.remove('white', 'dark', 'coffee');
            document.body.classList.add(saved.theme);
            themeButtons.forEach(btn => {
                  btn.classList.toggle('active', btn.dataset.theme === saved.theme);
            });
      }

      // Load font from local storage
      if (typeof saved.font === 'string') {
            document.body.classList.remove('font-georgia', 'font-serif', 'font-sans', 'font-mono', 'font-writer', 'font-lora', 'font-openSans', 'font-playfair');
            document.body.classList.add(`font-${saved.font}`);
            currentFont = saved.font;
            fontSelect.value = saved.font;
      }

      // Load word limit from local storage
      if (typeof saved.limit === 'number' || typeof saved.limit === 'string') {
            wordLimit = Number(saved.limit) || 500;
            wordLimitInput.value = wordLimit;
      }

      // Load word limit enabled state from local storage
      if (saved.limitEnabled) {
            isLimitEnabled = true;
            limitToggle.classList.add('active');
            limitDisplay.style.display = 'flex';
      } else {
            isLimitEnabled = false;
            limitToggle.classList.remove('active');
            limitDisplay.style.display = 'none';
      }

      // Load current file name from local storage
      if (typeof saved.fileName === 'string') currentFileName = saved.fileName;

      updateStats();
}

/**
 * Saves the current document state to local storage.
 *
 * The saved state includes the document text, theme, font, word limit, and
 * whether the word limit is enabled. It also includes the current file name
 * and the last saved timestamp.
 */
function saveData() {
      const data = {
            text: writingArea.value,
            theme: getTheme(),
            font: currentFont,
            limit: wordLimit,
            limitEnabled: isLimitEnabled,
            fileName: currentFileName,
            lastSaved: new Date().toISOString()
      };

      localStorage.setItem('zenNote', JSON.stringify(data));
      isSaved = true;
      showSaveTimestamp();
}

function getTheme() {
      if (document.body.classList.contains('white')) return 'white';
      if (document.body.classList.contains('dark')) return 'dark';
      if (document.body.classList.contains('coffee')) return 'coffee';
      return 'white';
}

// ====================================
// THEME MANAGEMENT
// ====================================
function setTheme(theme) {
      document.body.classList.remove('white', 'dark', 'coffee');
      document.body.classList.add(theme);
      themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
      });
      applyFont(currentFont);
      saveData();
}

themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
            setTheme(btn.dataset.theme);
            saveData();
      });
});

// ====================================
// FONT MANAGEMENT
// ====================================
function applyFont(font) {
      document.body.classList.remove('font-georgia', 'font-serif', 'font-sans', 'font-mono', 'font-writer', 'font-lora', 'font-openSans', 'font-playfair');
      document.body.classList.add(`font-${font}`);
      currentFont = font;
      fontSelect.value = font;
      saveData();
}

fontSelect.addEventListener('change', (e) => {
      applyFont(e.target.value);
      saveData();
});

// ====================================
// STATISTICS & WORD COUNTING
// ====================================
function updateStats() {
      const text = writingArea.value;
      const chars = text.length;
      const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

      charCount.textContent = chars.toLocaleString();
      wordCount.textContent = words.toLocaleString();

      const warningDiv = document.getElementById('word-limit-warning');
      if (isLimitEnabled) {
            limitCount.textContent = `${words} / ${wordLimit}`;
            if (words > wordLimit) {
                  writingArea.classList.add('over-limit');
                  limitCount.classList.add('warning');
                  if (warningDiv) warningDiv.style.display = 'block';
            } else {
                  writingArea.classList.remove('over-limit');
                  limitCount.classList.remove('warning');
                  if (warningDiv) warningDiv.style.display = 'none';
            }
      } else {
            if (warningDiv) warningDiv.style.display = 'none';
      }

      statsPanel.classList.add('active');
      clearTimeout(window.statsPanelTimeout);
      window.statsPanelTimeout = setTimeout(() => {
            statsPanel.classList.remove('active');
      }, 2000);
}

// ====================================
// WORD LIMIT CONTROLS
// ====================================
limitToggle.addEventListener('click', () => {
      isLimitEnabled = !isLimitEnabled;
      limitToggle.classList.toggle('active');
      if (isLimitEnabled) {
            limitDisplay.style.display = 'flex';
      } else {
            limitDisplay.style.display = 'none';
            writingArea.classList.remove('over-limit');
      }
      updateStats();
      saveData();
});

wordLimitInput.addEventListener('input', () => {
      const value = parseInt(wordLimitInput.value);
      if (value > 0) {
            wordLimit = value;
            updateStats();
            saveData();
      }
});

// ====================================
// FILE OPERATIONS
// ====================================
saveBtn.addEventListener('click', () => {
      const text = writingArea.value;
      // Try to use File System Access API if available and file was opened
      if (window.showSaveFilePicker && currentFileHandle) {
            (async () => {
                  try {
                        const writable = await currentFileHandle.createWritable();
                        await writable.write(text);
                        await writable.close();
                        statsPanel.classList.add('active');
                        setTimeout(() => statsPanel.classList.remove('active'), 2000);
                  } catch (err) {
                        alert('Failed to save file: ' + err.message);
                  }
            })();
      } else if (window.showSaveFilePicker && !currentFileHandle) {
            // Prompt user for file name/location using File System Access API
            (async () => {
                  try {
                        const handle = await window.showSaveFilePicker({
                              suggestedName: currentFileName,
                              types: [{
                                    description: 'Text Files',
                                    accept: { 'text/plain': ['.txt', '.md'] }
                              }]
                        });
                        currentFileHandle = handle;
                        currentFileName = handle.name || currentFileName;
                        const writable = await handle.createWritable();
                        await writable.write(text);
                        await writable.close();
                        statsPanel.classList.add('active');
                        setTimeout(() => statsPanel.classList.remove('active'), 2000);
                  } catch (err) {
                        // User cancelled or error
                  }
            })();
      } else {
            // Fallback: prompt for file name if not set
            let fileName = currentFileName;
            if (!fileName || fileName === 'untitled.txt') {
                  fileName = prompt('Enter file name to save:', 'my-writing.txt') || 'my-writing.txt';
                  currentFileName = fileName;
            }
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            statsPanel.classList.add('active');
            setTimeout(() => statsPanel.classList.remove('active'), 2000);
      }
});

openBtn.addEventListener('click', () => {
      // Use File System Access API if available
      if (window.showOpenFilePicker) {
            (async () => {
                  try {
                        const [handle] = await window.showOpenFilePicker({
                              types: [{
                                    description: 'Text Files',
                                    accept: { 'text/plain': ['.txt', '.md'] }
                              }]
                        });
                        currentFileHandle = handle;
                        const file = await handle.getFile();
                        currentFileName = file.name;
                        const text = await file.text();
                        writingArea.value = text;
                        updateStats();
                        saveData();
                  } catch (err) {
                        // User cancelled or error
                  }
            })();
      } else {
            fileInput.click();
      }
});

fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
            currentFileName = file.name;
            currentFileHandle = null; // Not using File System Access API
            const reader = new FileReader();
            reader.onload = (event) => {
                  writingArea.value = event.target.result;
                  updateStats();
                  saveData();
            };
            reader.readAsText(file);
      }
      fileInput.value = '';
});

newBtn.addEventListener('click', () => {
      if (!isSaved && writingArea.value.trim() && !confirm('Start a new document? Unsaved changes will be lost.')) {
            return;
      }
      writingArea.value = '';
      currentFileName = 'untitled.txt';
      currentFileHandle = null;
      updateStats();
      saveData();
      isSaved = false;
      writingArea.focus();
});

// ====================================
// WRITING AREA EVENTS
// ====================================
writingArea.addEventListener('input', () => {
      updateStats();
      isSaved = false;
      saveData();
});

// ====================================
// AUTO-SAVE
// ====================================
setInterval(saveData, 30000); // Every 30 seconds

// ====================================
// HOVER TRIGGERS
// ====================================
document.querySelector('.hover-trigger-bottom').addEventListener('mouseenter', () => {
      statsPanel.style.opacity = '1';
});

document.querySelector('.hover-trigger-right').addEventListener('mouseenter', () => {
      document.querySelector('.controls-panel').style.opacity = '1';
});

// ====================================
// KEYBOARD SHORTCUTS
// ====================================
document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveBtn.click();
      }

      // Ctrl/Cmd + O to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            openBtn.click();
      }

      // Ctrl/Cmd + N for new document
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            newBtn.click();
      }
});

// ====================================
// INITIALIZATION
// ====================================
loadData();
writingArea.focus();
