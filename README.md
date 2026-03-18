# Todo App

A lightweight, offline-capable todo list PWA built with vanilla JavaScript — no framework, no build step, no dependencies.

## Features

- Multiple named todo lists (tabs)
- Priorities: low / medium / high
- Due dates with overdue highlighting
- Recurring todos (reset to end of list on completion)
- Notes per todo
- JSON export / import
- Installable PWA with offline support

## Tech Stack

- Vanilla JavaScript
- Plain CSS with custom properties
- Service Worker (cache-first)
- Web App Manifest

## Getting Started

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Data Persistence

Data lives in memory only. Use **Export** to save your lists as a JSON file and **Import** to restore them. There is no automatic storage.
