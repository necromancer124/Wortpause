import { scheduleCard, selectSession } from './scheduler.js';

const STORAGE_KEY = 'wortpause-state-v1';
const DEFAULTS = {
  progress: {},
  settings: { dailyGoal: 10, direction: 'de-en', autoplay: false },
  stats: { streak: 0, lastStudyDay: '', totalReviews: 0 }
};

const $ = selector => document.querySelector(selector);
const elements = {
  loading: $('#loading'), cardArea: $('#card-area'), complete: $('#complete'), flashcard: $('#flashcard'),
  sideLabel: $('#side-label'), frontWord: $('#front-word'), frontExample: $('#front-example'),
  answer: $('#answer'), backWord: $('#back-word'), backExample: $('#back-example'), note: $('#note'),
  audio: $('#audio-button'), reveal: $('#reveal-button'), ratings: $('#rating-buttons'),
  count: $('#session-count'), progressBar: $('#progress-bar'), completeCount: $('#complete-count'),
  completeCopy: $('#complete-copy'), streak: $('#streak-count'), settingsDialog: $('#settings-dialog'),
  aboutDialog: $('#about-dialog'), helpDialog: $('#help-dialog'), wordsDialog: $('#words-dialog'),
  wordSearch: $('#word-search'), wordList: $('#word-list'), wordCount: $('#word-count'),
  goal: $('#goal-select'), autoplay: $('#autoplay-check'), install: $('#install-button')
};

let state = loadState();
let cards = [];
let session = [];
let index = 0;
let revealed = false;
let reviewedThisSession = 0;
let deferredInstall;
let currentAudio;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      progress: saved?.progress || {},
      settings: { ...DEFAULTS.settings, ...saved?.settings },
      stats: { ...DEFAULTS.stats, ...saved?.stats }
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function localDay(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function recordStudyDay() {
  const today = localDay();
  if (state.stats.lastStudyDay === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  state.stats.streak = state.stats.lastStudyDay === localDay(yesterday) ? state.stats.streak + 1 : 1;
  state.stats.lastStudyDay = today;
}

function beginSession(limit = state.settings.dailyGoal) {
  session = selectSession(cards, state.progress, limit);
  index = 0;
  reviewedThisSession = 0;
  elements.complete.hidden = true;
  elements.cardArea.hidden = false;
  renderCard();
}

function renderCard() {
  const card = session[index];
  if (!card) return showComplete();

  revealed = false;
  elements.answer.hidden = true;
  elements.ratings.hidden = true;
  elements.reveal.hidden = false;
  const germanFirst = state.settings.direction === 'de-en';
  elements.sideLabel.textContent = germanFirst ? 'German' : 'English';
  elements.frontWord.textContent = germanFirst ? card.german : card.english;
  elements.frontExample.textContent = germanFirst ? card.germanExample : card.englishExample;
  elements.backWord.textContent = germanFirst ? card.english : card.german;
  elements.backExample.textContent = germanFirst ? card.englishExample : card.germanExample;
  elements.note.textContent = [card.register, card.note].filter(Boolean).join(' · ');
  elements.note.hidden = !elements.note.textContent;
  elements.audio.hidden = !card.audio;
  elements.count.textContent = `${index} / ${session.length}`;
  elements.progressBar.style.width = `${session.length ? (index / session.length) * 100 : 0}%`;
  elements.flashcard.focus({ preventScroll: true });
  if (state.settings.autoplay && germanFirst) playAudio();
}

function revealAnswer() {
  if (revealed || !session[index]) return;
  revealed = true;
  elements.answer.hidden = false;
  elements.reveal.hidden = true;
  elements.ratings.hidden = false;
}

function rate(rating) {
  if (!revealed || !session[index]) return;
  const card = session[index];
  state.progress[card.id] = { ...scheduleCard(state.progress[card.id], rating), lastRating: rating };
  state.stats.totalReviews += 1;
  recordStudyDay();
  saveState();
  reviewedThisSession += 1;
  index += 1;
  renderCard();
}

function showComplete() {
  elements.cardArea.hidden = true;
  elements.complete.hidden = false;
  elements.completeCount.textContent = reviewedThisSession;
  elements.streak.textContent = state.stats.streak;
  elements.completeCopy.textContent = reviewedThisSession
    ? 'Your next reviews are scheduled automatically. Come back whenever you have another quiet minute.'
    : 'Nothing is due right now. You can still add a few new words.';
  elements.count.textContent = `${session.length} / ${session.length}`;
  elements.progressBar.style.width = '100%';
}

function playAudio() {
  const card = session[index];
  if (!card?.audio) return;
  currentAudio?.pause();
  currentAudio = new Audio(`audio/${encodeURIComponent(card.audio)}`);
  currentAudio.play().catch(() => {});
}

function openSettings() {
  elements.goal.value = String(state.settings.dailyGoal);
  elements.autoplay.checked = state.settings.autoplay;
  document.querySelector(`input[name="direction"][value="${state.settings.direction}"]`).checked = true;
  elements.settingsDialog.showModal();
}

function createWordRow(card) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'word-row';
  row.setAttribute('aria-expanded', 'false');

  const summary = document.createElement('span');
  summary.className = 'word-row-summary';
  const german = document.createElement('strong');
  german.textContent = card.german;
  const english = document.createElement('span');
  english.textContent = card.english;
  summary.append(german, english);

  const detail = document.createElement('span');
  detail.className = 'word-row-detail';
  detail.hidden = true;
  const germanExample = document.createElement('span');
  germanExample.textContent = card.germanExample || 'No example sentence';
  const englishExample = document.createElement('span');
  englishExample.textContent = card.englishExample || '';
  detail.append(germanExample, englishExample);

  row.append(summary, detail);
  row.addEventListener('click', () => {
    const expanded = row.getAttribute('aria-expanded') === 'true';
    row.setAttribute('aria-expanded', String(!expanded));
    detail.hidden = expanded;
  });
  return row;
}

function renderWordList(query = '') {
  const normalized = query.trim().toLocaleLowerCase('de-DE');
  const filtered = cards.filter(card => `${card.german} ${card.english}`.toLocaleLowerCase('de-DE').includes(normalized));
  const fragment = document.createDocumentFragment();
  filtered.forEach(card => fragment.append(createWordRow(card)));
  elements.wordList.replaceChildren(fragment);
  elements.wordCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'word' : 'words'}`;
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'word-empty';
    empty.textContent = 'No matching words.';
    elements.wordList.append(empty);
  }
}

function openWords() {
  elements.wordSearch.value = '';
  renderWordList();
  elements.wordsDialog.showModal();
  requestAnimationFrame(() => elements.wordSearch.focus());
}

function saveSettings() {
  state.settings.dailyGoal = Number(elements.goal.value);
  state.settings.direction = document.querySelector('input[name="direction"]:checked').value;
  state.settings.autoplay = elements.autoplay.checked;
  saveState();
  beginSession();
}

function resetProgress() {
  if (!confirm('Reset every card, review date, and streak? This cannot be undone.')) return;
  state.progress = {};
  state.stats = structuredClone(DEFAULTS.stats);
  saveState();
  elements.settingsDialog.close();
  beginSession();
}

function bindEvents() {
  elements.reveal.addEventListener('click', revealAnswer);
  elements.flashcard.addEventListener('click', event => {
    if (!event.target.closest('button')) revealAnswer();
  });
  elements.audio.addEventListener('click', event => { event.stopPropagation(); playAudio(); });
  elements.ratings.addEventListener('click', event => {
    const button = event.target.closest('[data-rating]');
    if (button) rate(button.dataset.rating);
  });
  $('#settings-button').addEventListener('click', openSettings);
  $('#help-button').addEventListener('click', () => elements.helpDialog.showModal());
  $('#words-button').addEventListener('click', openWords);
  $('#close-words').addEventListener('click', () => elements.wordsDialog.close());
  elements.wordSearch.addEventListener('input', () => renderWordList(elements.wordSearch.value));
  $('#about-button').addEventListener('click', () => elements.aboutDialog.showModal());
  $('#save-settings').addEventListener('click', saveSettings);
  $('#reset-button').addEventListener('click', resetProgress);
  $('#more-button').addEventListener('click', () => beginSession(5));
  window.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]')) return;
    if (event.code === 'Space') { event.preventDefault(); revealAnswer(); }
    if (revealed && ['1', '2', '3', '4'].includes(event.key)) rate(['again', 'hard', 'good', 'easy'][Number(event.key) - 1]);
    if (event.key.toLowerCase() === 'r') playAudio();
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstall = event;
    elements.install.hidden = false;
  });
  elements.install.addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = undefined;
    elements.install.hidden = true;
  });
}

async function init() {
  bindEvents();
  try {
    const response = await fetch('data/cards.json');
    if (!response.ok) throw new Error(`Cards failed to load (${response.status})`);
    cards = await response.json();
    elements.loading.hidden = true;
    beginSession();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');
  } catch (error) {
    elements.loading.innerHTML = `<p>Cards could not be loaded.</p><small>${error.message}</small>`;
  }
}

init();
