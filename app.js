import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// --- Firebase ---

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let unsubscribe = null;

// --- State ---

let state = {
  activeListId: null,
  lists: []
};

let editingTodoId = null;

// --- Utilities ---

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function activeList() {
  return state.lists.find(l => l.id === state.activeListId) || null;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// --- Persistence & Sync ---

function saveState() {
  const user = auth.currentUser;
  if (!user) return;
  setDoc(doc(db, 'users', user.uid), state);
}

function startSync(userId) {
  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(
    doc(db, 'users', userId),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (!snap.exists()) return;
      state = snap.data();
      renderTabs();
      renderMain();
    }
  );
}

function stopSync() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// --- Auth ---

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('signin-overlay').classList.add('hidden');
    document.getElementById('btn-signout').style.display = '';
    startSync(user.uid);
  } else {
    document.getElementById('signin-overlay').classList.remove('hidden');
    document.getElementById('btn-signout').style.display = 'none';
    stopSync();
    state = { activeListId: null, lists: [] };
    renderTabs();
    renderMain();
  }
});

document.getElementById('btn-signin').addEventListener('click', () => {
  signInWithPopup(auth, new GoogleAuthProvider())
    .catch(err => alert('Sign in failed: ' + err.message));
});

document.getElementById('btn-signout').addEventListener('click', () => {
  signOut(auth);
});

// --- Render ---

function render() {
  renderTabs();
  renderMain();
  saveState();
}

function renderTabs() {
  const container = document.getElementById('tabs');
  container.innerHTML = '';
  state.lists.forEach(list => {
    const tab = document.createElement('button');
    tab.className = 'tab' + (list.id === state.activeListId ? ' active' : '');
    tab.textContent = list.name;
    tab.addEventListener('click', () => {
      state.activeListId = list.id;
      render();
    });
    container.appendChild(tab);
  });
}

function renderMain() {
  const list = activeList();
  const title = document.getElementById('list-title');
  const todoList = document.getElementById('todo-list');
  const listActions = document.getElementById('list-actions');
  const addTodoBtn = document.getElementById('btn-add-todo');

  if (!list) {
    title.textContent = '';
    todoList.innerHTML = '<div id="empty-state">No lists yet. Create one to get started.</div>';
    listActions.style.visibility = 'hidden';
    addTodoBtn.style.display = 'none';
    return;
  }

  listActions.style.visibility = 'visible';
  addTodoBtn.style.display = '';
  title.textContent = list.name;

  if (list.todos.length === 0) {
    todoList.innerHTML = '<div id="empty-state">No todos. Add one below.</div>';
    return;
  }

  todoList.innerHTML = '';
  list.todos.forEach(todo => {
    todoList.appendChild(buildTodoElement(todo));
  });
}

function buildTodoElement(todo) {
  const item = document.createElement('div');
  item.className = 'todo-item';

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todo-checkbox';
  checkbox.addEventListener('change', () => checkTodo(todo.id));

  // Body
  const body = document.createElement('div');
  body.className = 'todo-body';

  const titleEl = document.createElement('div');
  titleEl.className = 'todo-title';
  titleEl.textContent = todo.title;

  const meta = document.createElement('div');
  meta.className = 'todo-meta';

  const priorityBadge = document.createElement('span');
  priorityBadge.className = `badge badge-${todo.priority}`;
  priorityBadge.textContent = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);
  meta.appendChild(priorityBadge);

  if (todo.dueDate) {
    const dueBadge = document.createElement('span');
    dueBadge.className = 'badge-due' + (todo.dueDate < todayISO() ? ' overdue' : '');
    dueBadge.textContent = 'Due ' + formatDate(todo.dueDate);
    meta.appendChild(dueBadge);
  }

  if (todo.recurring) {
    const recBadge = document.createElement('span');
    recBadge.className = 'badge-recurring';
    recBadge.textContent = 'Recurring';
    meta.appendChild(recBadge);
  }

  body.appendChild(titleEl);
  body.appendChild(meta);

  if (todo.notes) {
    const notes = document.createElement('div');
    notes.className = 'todo-notes';
    notes.textContent = todo.notes;
    body.appendChild(notes);
  }

  // Actions
  const actions = document.createElement('div');
  actions.className = 'todo-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-icon';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => openModal(todo));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-icon delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(checkbox);
  item.appendChild(body);
  item.appendChild(actions);

  return item;
}

// --- Todo Logic ---

function checkTodo(id) {
  const list = activeList();
  if (!list) return;
  const idx = list.todos.findIndex(t => t.id === id);
  if (idx === -1) return;
  const todo = list.todos[idx];

  if (todo.recurring) {
    list.todos.splice(idx, 1);
    list.todos.push(todo);
  } else {
    list.todos.splice(idx, 1);
  }
  render();
}

function deleteTodo(id) {
  const list = activeList();
  if (!list) return;
  list.todos = list.todos.filter(t => t.id !== id);
  render();
}

function saveTodo(data) {
  const list = activeList();
  if (!list) return;

  if (editingTodoId) {
    const idx = list.todos.findIndex(t => t.id === editingTodoId);
    if (idx !== -1) {
      list.todos[idx] = { ...list.todos[idx], ...data };
    }
  } else {
    list.todos.push({ id: uid(), ...data });
  }
  render();
}

// --- List Logic ---

function addList() {
  const name = prompt('List name:');
  if (!name || !name.trim()) return;
  const list = { id: uid(), name: name.trim(), todos: [] };
  state.lists.push(list);
  state.activeListId = list.id;
  render();
}

function renameList() {
  const list = activeList();
  if (!list) return;
  const input = document.getElementById('input-rename');
  input.value = list.name;
  document.getElementById('rename-error').classList.add('hidden');
  document.getElementById('rename-overlay').classList.remove('hidden');
  input.focus();
  input.select();
}

function deleteList() {
  const list = activeList();
  if (!list) return;
  if (!confirm(`Delete list "${list.name}" and all its todos?`)) return;
  state.lists = state.lists.filter(l => l.id !== list.id);
  state.activeListId = state.lists.length > 0 ? state.lists[0].id : null;
  render();
}

// --- Modal ---

function openModal(todo = null) {
  editingTodoId = todo ? todo.id : null;
  document.getElementById('modal-title').textContent = todo ? 'Edit todo' : 'Add todo';
  document.getElementById('input-title').value = todo ? todo.title : '';
  document.getElementById('input-notes').value = todo ? todo.notes : '';
  document.getElementById('input-priority').value = todo ? todo.priority : 'medium';
  document.getElementById('input-due').value = todo ? (todo.dueDate || '') : '';
  document.getElementById('input-recurring').checked = todo ? todo.recurring : false;
  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('input-title').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  editingTodoId = null;
}

function submitModal() {
  const title = document.getElementById('input-title').value.trim();
  if (!title) {
    document.getElementById('modal-error').classList.remove('hidden');
    return;
  }
  saveTodo({
    title,
    notes: document.getElementById('input-notes').value.trim(),
    priority: document.getElementById('input-priority').value,
    dueDate: document.getElementById('input-due').value || null,
    recurring: document.getElementById('input-recurring').checked
  });
  closeModal();
}

// --- Import / Export ---

function exportData() {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'todos.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.lists || !Array.isArray(parsed.lists)) throw new Error('Invalid format');
      state = parsed;
      if (!state.lists.find(l => l.id === state.activeListId)) {
        state.activeListId = state.lists.length > 0 ? state.lists[0].id : null;
      }
      render();
    } catch {
      alert('Failed to import: invalid JSON file.');
    }
  };
  reader.readAsText(file);
}

// --- Event Listeners ---

document.getElementById('btn-add-list').addEventListener('click', addList);
document.getElementById('btn-rename-list').addEventListener('click', renameList);
document.getElementById('btn-delete-list').addEventListener('click', deleteList);
document.getElementById('btn-add-todo').addEventListener('click', () => openModal());

document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
document.getElementById('btn-modal-save').addEventListener('click', submitModal);

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.getElementById('input-title').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitModal();
  if (e.key === 'Escape') closeModal();
});

document.getElementById('btn-rename-cancel').addEventListener('click', () => {
  document.getElementById('rename-overlay').classList.add('hidden');
});

document.getElementById('btn-rename-confirm').addEventListener('click', () => {
  const val = document.getElementById('input-rename').value.trim();
  if (!val) {
    document.getElementById('rename-error').classList.remove('hidden');
    return;
  }
  activeList().name = val;
  document.getElementById('rename-overlay').classList.add('hidden');
  render();
});

document.getElementById('rename-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('rename-overlay')) {
    document.getElementById('rename-overlay').classList.add('hidden');
  }
});

document.getElementById('input-rename').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-rename-confirm').click();
  if (e.key === 'Escape') document.getElementById('rename-overlay').classList.add('hidden');
});

document.getElementById('btn-export').addEventListener('click', exportData);

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('file-input').value = '';
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (e) => {
  if (e.target.files.length > 0) importData(e.target.files[0]);
});

// --- Init ---

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
