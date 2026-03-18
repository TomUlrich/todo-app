# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step needed. Open `index.html` directly in a browser:

```bash
# Quick dev server (Python)
python3 -m http.server 8080
# or
npx serve .
```

There are no tests, no linter, and no package manager.

## Architecture

Vanilla JavaScript PWA — no framework, no bundler, no dependencies.

**Key files:**
- `app.js` — all application logic (~360 lines)
- `index.html` — markup with two modals (todo edit, list rename)
- `style.css` — single stylesheet with CSS custom properties
- `sw.js` — service worker (cache-first offline strategy)
- `manifest.json` — PWA manifest

**State model** (in-memory only, lost on page refresh unless exported):

```js
state = {
  activeListId: string,
  lists: [{ id, name, todos: [{ id, title, notes, priority, dueDate, recurring }] }]
}
```

**Data flow:** every mutation calls `render()` → `renderTabs()` + `renderMain()`. No virtual DOM, no reactivity library — direct DOM writes.

**Persistence:** manual JSON export/import only. The service worker caches app assets for offline use but does not persist user data.

**Modals:** two overlays (`#modal-overlay`, `#rename-overlay`). Closed via Escape or clicking the backdrop; saved via Enter or the submit button.

**Recurring todos:** when completed, they are moved to the end of the list instead of deleted.
