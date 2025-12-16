/**
 * Demo Application
 * Demonstrates Annabelle.AI capabilities
 */

import { AnnabelleAI } from './core/AnnabelleAI';
import type { IndexEntry } from './types';

// Initialize Annabelle.AI
const ai = new AnnabelleAI();
let initialized = false;

// DOM elements
const totalEntriesEl = document.getElementById('totalEntries')!;
const memoryUsageEl = document.getElementById('memoryUsage')!;
const workerStatusEl = document.getElementById('workerStatus')!;
const contentInput = document.getElementById('contentInput') as HTMLInputElement;
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const resultsEl = document.getElementById('results')!;
const addBtn = document.getElementById('addBtn')!;
const addBulkBtn = document.getElementById('addBulkBtn')!;
const searchBtn = document.getElementById('searchBtn')!;
const clearBtn = document.getElementById('clearBtn')!;

// Initialize on page load
async function init() {
  try {
    showMessage('Initialisiere Annabelle.AI...', 'info');
    await ai.initialize();
    initialized = true;
    workerStatusEl.textContent = '✓';
    showMessage('Annabelle.AI bereit!', 'success');
    updateStats();
  } catch (error) {
    console.error('Initialization error:', error);
    showMessage('Fehler bei der Initialisierung', 'error');
    workerStatusEl.textContent = '✗';
  }
}

// Update statistics
async function updateStats() {
  if (!initialized) return;

  try {
    const stats = await ai.getStats();
    totalEntriesEl.textContent = stats.totalEntries.toString();
    memoryUsageEl.textContent = `${stats.memoryUsage.toFixed(2)} MB`;
  } catch (error) {
    console.error('Stats error:', error);
  }
}

// Add single entry
async function addEntry() {
  if (!initialized) {
    showMessage('System nicht bereit', 'error');
    return;
  }

  const content = contentInput.value.trim();
  if (!content) {
    showMessage('Bitte Inhalt eingeben', 'error');
    return;
  }

  try {
    const entry: IndexEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      metadata: {
        created: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    await ai.addEntry(entry);
    contentInput.value = '';
    showMessage('Eintrag hinzugefügt', 'success');
    updateStats();
  } catch (error) {
    console.error('Add entry error:', error);
    showMessage('Fehler beim Hinzufügen', 'error');
  }
}

// Add bulk entries
async function addBulkEntries() {
  if (!initialized) {
    showMessage('System nicht bereit', 'error');
    return;
  }

  try {
    showMessage('Füge 100 Testeinträge hinzu...', 'info');
    
    const entries: IndexEntry[] = [];
    for (let i = 0; i < 100; i++) {
      entries.push({
        id: `test-${Date.now()}-${i}`,
        content: `Test entry ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Entry number ${i} with random data ${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          index: i,
          created: new Date().toISOString(),
        },
        timestamp: Date.now(),
      });
    }

    await ai.addEntries(entries);
    showMessage('100 Testeinträge hinzugefügt', 'success');
    updateStats();
  } catch (error) {
    console.error('Add bulk error:', error);
    showMessage('Fehler beim Bulk-Import', 'error');
  }
}

// Search entries
async function search() {
  if (!initialized) {
    showMessage('System nicht bereit', 'error');
    return;
  }

  const query = searchInput.value.trim();
  if (!query) {
    showMessage('Bitte Suchbegriff eingeben', 'error');
    return;
  }

  try {
    showMessage('Suche...', 'info');
    const results = await ai.search(query, 20);
    
    if (results.length === 0) {
      resultsEl.innerHTML = '<div class="loading">Keine Ergebnisse gefunden</div>';
      return;
    }

    resultsEl.innerHTML = results
      .map(
        (result) => `
        <div class="result-item">
          <div class="result-id">${result.id}</div>
          <div class="result-content">${result.content}</div>
        </div>
      `
      )
      .join('');

    showMessage(`${results.length} Ergebnisse gefunden`, 'success');
  } catch (error) {
    console.error('Search error:', error);
    showMessage('Fehler bei der Suche', 'error');
  }
}

// Clear index
async function clearIndex() {
  if (!initialized) {
    showMessage('System nicht bereit', 'error');
    return;
  }

  if (!confirm('Wirklich alle Einträge löschen?')) {
    return;
  }

  try {
    await ai.clear();
    resultsEl.innerHTML = '';
    showMessage('Index geleert', 'success');
    updateStats();
  } catch (error) {
    console.error('Clear error:', error);
    showMessage('Fehler beim Leeren', 'error');
  }
}

// Show message
function showMessage(message: string, type: 'info' | 'success' | 'error') {
  // Remove existing messages
  document.querySelectorAll('.message').forEach((el) => el.remove());

  const messageEl = document.createElement('div');
  messageEl.className = `message ${type === 'error' ? 'error' : 'info'}`;
  messageEl.textContent = message;
  
  const firstCard = document.querySelector('.card');
  if (firstCard && firstCard.parentNode) {
    firstCard.parentNode.insertBefore(messageEl, firstCard);
  }

  setTimeout(() => {
    messageEl.remove();
  }, 3000);
}

// Event listeners
addBtn.addEventListener('click', addEntry);
addBulkBtn.addEventListener('click', addBulkEntries);
searchBtn.addEventListener('click', search);
clearBtn.addEventListener('click', clearIndex);

contentInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addEntry();
});

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') search();
});

// Initialize on load
init();

// Update stats periodically
setInterval(updateStats, 5000);
