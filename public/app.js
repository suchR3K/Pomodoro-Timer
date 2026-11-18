'use strict';
const T = globalThis.PomodoroTimer;
const $ = id => document.getElementById(id);
const key = 'still-pomodoro-v1';
let saved = null;
let sound = true;
try { saved = localStorage.getItem(key); sound = localStorage.getItem(key + '-sound') !== 'false'; } catch { /* Storage may be unavailable. */ }
let state = T.restore(saved, Date.now());
let audio;
const names = { work: 'Work', short: 'Short break', long: 'Long break' };
function announce(message) { $('announcement').textContent = message; }
function persist() {
  try { localStorage.setItem(key, JSON.stringify(state)); localStorage.setItem(key + '-sound', String(sound)); }
  catch { announce('Browser storage is unavailable. Progress will last only while this page stays open.'); }
}
async function enableAudio() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw new Error('Unavailable');
    audio ??= new Context();
    await audio.resume();
    return audio.state === 'running';
  } catch { announce('Sound is unavailable in this browser. Visual notifications still work.'); return false; }
}
function beep() {
  if (!audio || audio.state !== 'running') return;
  for (let i = 0; i < 3; i++) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + i * 0.25;
    oscillator.frequency.value = 660 + i * 110;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(start); oscillator.stop(start + 0.22);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
function finished(mode) {
  announce(`${names[mode]} complete. ${names[state.mode]} is ready — press Start when you are.`);
  if (sound) beep();
  persist();
}
function render() {
  const seconds = Math.ceil(T.remaining(state, Date.now()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const text = `${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`;
  $('time').textContent = text;
  $('time').setAttribute('aria-label', `${minutes} minutes ${rest} seconds remaining`);
  document.title = `${text} · ${names[state.mode]} — Still`;
  $('session-title').textContent = names[state.mode];
  $('cycle').textContent = state.mode === 'work' ? `Session ${state.completed % 4 + 1} of 4` : (state.mode === 'long' ? 'Time for a longer pause' : 'Take a little space');
  const paused = state.remaining < state.settings[state.mode] * 60000;
  $('toggle').textContent = state.deadline !== null ? 'Pause' : paused ? 'Resume' : state.mode === 'work' ? 'Start focus' : 'Start break';
  $('hint').textContent = state.deadline !== null ? (state.mode === 'work' ? 'Just you and the next small step.' : 'Rest is part of the work.') : paused ? 'Paused. Take your time.' : 'Ready when you are.';
  $('progress').value = 1 - T.remaining(state, Date.now()) / (state.settings[state.mode] * 60000);
  $('completed').textContent = state.completed;
  const count = state.mode === 'long' ? 4 : state.completed % 4;
  [...$('dots').children].forEach((dot, i) => dot.classList.toggle('done', i < count));
}
function update() { const done = T.tick(state, Date.now()); if (done) finished(done); render(); }
for (const mode of ['work','short','long']) $(mode).value = state.settings[mode];
$('sound').checked = sound;
$('toggle').addEventListener('click', () => {
  // Reconcile an elapsed timer before applying the user's action.
  const done = T.tick(state, Date.now());
  if (done) { finished(done); render(); return; }
  if (state.deadline !== null) { const ended = T.pause(state, Date.now()); if (ended) finished(ended); else announce('Timer paused.'); }
  else { if (sound) void enableAudio(); T.start(state, Date.now()); announce(`${names[state.mode]} started.`); }
  persist(); render();
});
$('reset').addEventListener('click', () => { update(); T.reset(state); announce('Current timer reset. Completed sessions kept.'); persist(); render(); });
$('settings-form').addEventListener('submit', event => {
  event.preventDefault();
  const settings = Object.fromEntries(['work','short','long'].map(k => [k, Number($(k).value)]));
  if (!T.validSettings(settings)) { announce('Enter whole minutes from 1 to 120.'); return; }
  if (!confirm('Save durations and reset the current timer? Completed sessions will be kept.')) return;
  update(); state.settings = settings; T.reset(state); persist(); render(); announce('Durations saved. Current timer reset.');
});
$('clear').addEventListener('click', () => {
  if (!confirm('Clear all completed sessions and return to a fresh work timer?')) return;
  state = T.create(state.settings); persist(); render(); announce('Progress cleared. Ready for a fresh start.');
});
$('sound').addEventListener('change', () => { sound = $('sound').checked; if (sound) void enableAudio(); persist(); });
$('test-sound').addEventListener('click', async () => { if (await enableAudio()) { beep(); announce('Test sound played.'); } });
document.addEventListener('visibilitychange', update);
window.addEventListener('pageshow', update);
window.addEventListener('storage', event => {
  if (event.key === key) { state = T.restore(event.newValue, Date.now()); for (const mode of ['work','short','long']) $(mode).value = state.settings[mode]; update(); }
  if (event.key === key + '-sound') { sound = event.newValue !== 'false'; $('sound').checked = sound; }
});
update();
setInterval(update, 250);
