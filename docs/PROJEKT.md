# Projektübersicht: Todo App

## Beschreibung

Einfache PWA-Todo-App ohne Framework, Build-Tools oder Abhängigkeiten. Läuft direkt im Browser.

## Ordnerstruktur

```
todo-app/
├── index.html       # Markup + zwei Modals (Todo bearbeiten, Liste umbenennen)
├── app.js           # Gesamte Anwendungslogik
├── style.css        # Styles mit CSS Custom Properties
├── sw.js            # Service Worker (Cache-First-Strategie)
├── manifest.json    # PWA-Manifest
├── icon.svg         # App-Icon
└── docs/
    └── PROJEKT.md   # Diese Datei
```

## State-Modell

```js
state = {
  activeListId: string,
  lists: [{
    id: string,
    name: string,
    todos: [{
      id: string,
      title: string,
      notes: string,
      priority: 'low' | 'medium' | 'high',
      dueDate: string | null,  // YYYY-MM-DD
      recurring: boolean
    }]
  }]
}
```

Kein LocalStorage, keine Datenbank — alles nur im Arbeitsspeicher. Persistierung nur über manuellen JSON-Export/Import.

## Konventionen

- Jede State-Mutation ruft am Ende `render()` auf.
- IDs werden mit `uid()` generiert (`Math.random` + `Date.now`, Base36).
- Modals werden über CSS-Klasse `hidden` ein-/ausgeblendet.
- Service Worker cacht nur App-Assets, keine Nutzerdaten.

## Lokale Entwicklung

```bash
python3 -m http.server 8080
# http://localhost:8080
```
