(function (root) {
  'use strict';
  const defaults = { work: 25, short: 5, long: 15 };
  function validSettings(s) {
    return s && ['work', 'short', 'long'].every(k => Number.isInteger(s[k]) && s[k] >= 1 && s[k] <= 120);
  }
  function create(settings = defaults) {
    if (!validSettings(settings)) throw new Error('Durations must be whole minutes between 1 and 120.');
    return { settings: { ...settings }, mode: 'work', remaining: settings.work * 60000, deadline: null, completed: 0 };
  }
  function remaining(s, now) { return s.deadline === null ? s.remaining : Math.max(0, s.deadline - now); }
  function start(s, now) { if (s.deadline === null) s.deadline = now + s.remaining; }
  function tick(s, now) {
    if (s.deadline === null || now < s.deadline) return null;
    const finished = s.mode;
    if (finished === 'work') { s.completed++; s.mode = s.completed % 4 === 0 ? 'long' : 'short'; }
    else s.mode = 'work';
    s.remaining = s.settings[s.mode] * 60000;
    s.deadline = null;
    return finished;
  }
  function pause(s, now) { const finished = tick(s, now); s.remaining = remaining(s, now); s.deadline = null; return finished; }
  function reset(s) { s.remaining = s.settings[s.mode] * 60000; s.deadline = null; }
  function restore(raw, now) {
    try {
      const s = JSON.parse(raw);
      if (!validSettings(s.settings) || !['work','short','long'].includes(s.mode) ||
          !Number.isSafeInteger(s.completed) || s.completed < 0 ||
          !Number.isFinite(s.remaining) || s.remaining <= 0 || s.remaining > s.settings[s.mode] * 60000 ||
          !(s.deadline === null || (Number.isFinite(s.deadline) && s.deadline > 0 && s.deadline <= now + s.settings[s.mode] * 60000))) return create();
      return s;
    } catch { return create(); }
  }
  const api = { defaults, validSettings, create, remaining, start, tick, pause, reset, restore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PomodoroTimer = api;
})(globalThis);
