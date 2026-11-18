# Still — Pomodoro Timer

A dependency-free productivity app built with HTML, CSS and modular JavaScript. Focus on one task, pause when needed, and take intentional breaks.

## Features

- Start, pause, resume and reset the current timer.
- Configurable whole-minute durations from 1 to 120 minutes.
- Defaults: 25-minute work session, 5-minute short break and 15-minute long break after every fourth completed work session.
- Work, Short Break and Long Break indicators, cycle markers and a completed-work counter.
- Optional synthesized completion sound and a test-sound button; no external audio downloads.
- Browser-local persistence of settings, completed sessions and the running deadline.
- Responsive layout, visible keyboard focus, native labeled inputs and polite session announcements. The timer does not announce every second.
- Automated timer tests and GitHub Pages deployment after successful checks.

## Try it without installing anything

Extract the ZIP, then open `public/index.html` in your browser. Keep all four files in `public/` together. No npm install, backend, database or VM is required.

For consistent storage behavior, prefer GitHub Pages or a local HTTP server. Some browsers restrict storage for local files or in private mode; the timer still works for the current page session if storage is blocked.

## Publish on GitHub Pages

1. Create a new public repository, for example `pomodoro-timer`, using the `main` branch.
2. Upload the contents of this project, preserving `public/`, `tests/` and `.github/workflows/`. Do not upload only the ZIP or nest everything inside an additional folder.
3. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Test and publish Pomodoro**. If the initial run failed before Pages was enabled, use **Re-run all jobs**, or select **Run workflow** on `main`.
5. Open the deployment URL shown in the successful workflow or in Settings → Pages.

Pull requests run tests without deploying. Successful pushes to `main` publish only the `public` directory. The browser app uses relative asset paths, so repository-based Pages URLs work.

See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Behavior and limitations

Each completed work session increases the counter. Resetting a timer does not count as completion. Breaks do not increment the counter. After a session finishes, the next session is prepared but stays paused until you start it. This avoids accumulating fictional work while away.

The countdown uses a wall-clock deadline instead of counting interval callbacks. On return from an inactive tab or reload, an elapsed session is completed once. Changing the operating system clock can affect the countdown. Browsers may suspend background tabs or sound playback: audio is best-effort, requires a user gesture, and cannot play while the page/browser is closed. On reload, click Test or Start to enable sound again.

Saving durations asks for confirmation and resets the current timer while preserving completed sessions. Reset progress asks for confirmation and starts a fresh work timer with the existing settings. The counter is cumulative, not a daily statistic.

Progress is stored in this browser only. Clearing browser data clears progress; there is no account or cloud sync. Other tabs receive saved state updates, but simultaneous control across tabs is not coordinated; use one active timer tab. No external fonts, analytics or remote API calls are used by the app.

## Project structure

```text
public/
  index.html      Accessible page structure
  styles.css      Responsive visual design
  timer.js        Timer state and transitions; also usable in Node tests
  app.js          DOM, storage, notifications and audio
tests/
  timer.test.cjs  Automated state tests
.github/workflows/
  pages.yml       Test and publish workflow
README.md
```

## Tests

Node.js 22+ is needed only for development tests, not to use the app:

```sh
node --test tests/timer.test.cjs
node --check public/app.js
```

At initial delivery, all 12 timer tests passed locally and `app.js` passed its syntax check. Browser rendering, keyboard/screen-reader behavior, actual audio and GitHub deployment have not yet been verified. Automated tests cover timer logic, not the complete browser interface.

### Manual acceptance checks

- Open the page on desktop and at a 360px mobile width; check readability and absence of horizontal scrolling.
- Use Tab and Enter/Space to operate controls and check visible focus.
- Start, pause, wait, then resume: paused time must not reduce the remaining interval.
- Set all durations to 1 minute; complete four work sessions and intervening breaks. Confirm the fourth work session leads to Long Break and the counter is 4.
- Confirm sound plays after Test; disable sound and confirm completion is silent.
- Reload during a running session and confirm its deadline is preserved.
- Leave the tab past its deadline; return and confirm only one session completed, with the next timer waiting.
- Enter 0, 121 or a fractional duration; confirm settings are rejected.
- Cancel the Save durations and Reset progress confirmation dialogs; verify state is unchanged.
- Test browser storage disabled and sound unavailable: the core timer should remain usable.

