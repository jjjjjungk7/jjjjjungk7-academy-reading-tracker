'use strict';

const API = '/api';

let currentFilter = 'all';
let allBooks = [];

// --- API helpers ---
async function fetchBooks() {
  const res = await fetch(`${API}/books`);
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}

async function fetchStats() {
  const res = await fetch(`${API}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

async function createBook(data) {
  const res = await fetch(`${API}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create book');
  }
  return res.json();
}

async function updateBook(id, data) {
  const res = await fetch(`${API}/books/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update book');
  }
  return res.json();
}

async function deleteBook(id) {
  const res = await fetch(`${API}/books/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete book');
}

// --- Render ---
function renderStats(stats) {
  document.querySelector('#stat-total .stat-number').textContent = stats.total;
  document.querySelector('#stat-completed .stat-number').textContent = stats.completed;
  document.querySelector('#stat-reading .stat-number').textContent = stats.reading;
  document.querySelector('#stat-toread .stat-number').textContent = stats.toRead;
  document.querySelector('#stat-pages .stat-number').textContent = stats.pagesRead.toLocaleString();
}

function badgeClass(status) {
  if (status === 'reading') return 'badge-reading';
  if (status === 'completed') return 'badge-completed';
  return 'badge-to-read';
}

function progressPercent(book) {
  if (!book.totalPages || book.totalPages === 0) return 0;
  return Math.min(100, Math.round((book.pagesRead / book.totalPages) * 100));
}

function renderBooks(books) {
  const list = document.getElementById('book-list');
  const emptyMsg = document.getElementById('empty-msg');

  const filtered = currentFilter === 'all' ? books : books.filter((b) => b.status === currentFilter);

  // Remove existing cards
  list.querySelectorAll('.book-card').forEach((el) => el.remove());

  if (filtered.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  filtered.forEach((book) => {
    const pct = progressPercent(book);
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.id = book.id;
    card.innerHTML = `
      <div class="book-info">
        <div class="book-title">${escapeHtml(book.title)}</div>
        <div class="book-author">by ${escapeHtml(book.author)}</div>
        <div class="book-meta">
          <span class="badge ${badgeClass(book.status)}">${book.status}</span>
          ${book.genre ? `<span>${escapeHtml(book.genre)}</span>` : ''}
          ${book.totalPages ? `<span>${book.pagesRead}/${book.totalPages} pages</span>` : ''}
          ${book.notes ? `<span title="${escapeHtml(book.notes)}">📝 Notes</span>` : ''}
        </div>
        ${book.totalPages ? `
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>` : ''}
      </div>
      <div class="book-actions">
        <button class="btn btn-secondary btn-sm btn-edit" data-id="${book.id}">Edit</button>
        <button class="btn btn-danger btn-sm btn-delete" data-id="${book.id}">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Modal ---
function openModal(book = null) {
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('book-form');
  document.getElementById('form-error').textContent = '';

  if (book) {
    title.textContent = 'Edit Book';
    document.getElementById('book-id').value = book.id;
    document.getElementById('f-title').value = book.title;
    document.getElementById('f-author').value = book.author;
    document.getElementById('f-genre').value = book.genre || '';
    document.getElementById('f-total-pages').value = book.totalPages || '';
    document.getElementById('f-pages-read').value = book.pagesRead || '';
    document.getElementById('f-status').value = book.status;
    document.getElementById('f-notes').value = book.notes || '';
  } else {
    title.textContent = 'Add Book';
    form.reset();
    document.getElementById('book-id').value = '';
  }

  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('f-title').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').setAttribute('aria-hidden', 'true');
}

// --- Load data ---
async function loadAll() {
  const [books, stats] = await Promise.all([fetchBooks(), fetchStats()]);
  allBooks = books;
  renderStats(stats);
  renderBooks(allBooks);
}

// --- Events ---
document.getElementById('btn-add').addEventListener('click', () => openModal());
document.getElementById('btn-cancel').addEventListener('click', closeModal);

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.getElementById('filter-status').addEventListener('change', (e) => {
  currentFilter = e.target.value;
  renderBooks(allBooks);
});

document.getElementById('book-list').addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('btn-edit')) {
    const book = allBooks.find((b) => b.id === id);
    if (book) openModal(book);
  }

  if (e.target.classList.contains('btn-delete')) {
    if (!confirm('Delete this book?')) return;
    try {
      await deleteBook(id);
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  }
});

document.getElementById('book-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('form-error');
  errorEl.textContent = '';

  const id = document.getElementById('book-id').value;
  const data = {
    title: document.getElementById('f-title').value.trim(),
    author: document.getElementById('f-author').value.trim(),
    genre: document.getElementById('f-genre').value.trim(),
    totalPages: document.getElementById('f-total-pages').value || 0,
    pagesRead: document.getElementById('f-pages-read').value || 0,
    status: document.getElementById('f-status').value,
    notes: document.getElementById('f-notes').value.trim(),
  };

  try {
    if (id) {
      await updateBook(id, data);
    } else {
      await createBook(data);
    }
    closeModal();
    await loadAll();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// --- Init ---
loadAll();
