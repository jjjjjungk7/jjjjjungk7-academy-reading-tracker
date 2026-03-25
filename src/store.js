'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = process.env.TEST_DATA_FILE || path.join(__dirname, '..', 'data', 'books.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readBooks() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeBooks(books) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2), 'utf8');
}

function getAllBooks() {
  return readBooks();
}

function getBookById(id) {
  const books = readBooks();
  return books.find((b) => b.id === id) || null;
}

function createBook({ title, author, genre, totalPages, pagesRead, status, notes }) {
  if (!title || !author) {
    throw new Error('title and author are required');
  }
  const validStatuses = ['to-read', 'reading', 'completed'];
  const bookStatus = validStatuses.includes(status) ? status : 'to-read';
  const book = {
    id: crypto.randomUUID(),
    title: String(title).trim(),
    author: String(author).trim(),
    genre: genre ? String(genre).trim() : '',
    totalPages: totalPages ? Number(totalPages) : 0,
    pagesRead: pagesRead ? Number(pagesRead) : 0,
    status: bookStatus,
    notes: notes ? String(notes).trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const books = readBooks();
  books.push(book);
  writeBooks(books);
  return book;
}

function updateBook(id, updates) {
  const books = readBooks();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return null;

  const validStatuses = ['to-read', 'reading', 'completed'];
  const book = books[idx];

  if (updates.title !== undefined) book.title = String(updates.title).trim();
  if (updates.author !== undefined) book.author = String(updates.author).trim();
  if (updates.genre !== undefined) book.genre = String(updates.genre).trim();
  if (updates.totalPages !== undefined) book.totalPages = Number(updates.totalPages);
  if (updates.pagesRead !== undefined) book.pagesRead = Number(updates.pagesRead);
  if (updates.status !== undefined && validStatuses.includes(updates.status)) {
    book.status = updates.status;
  }
  if (updates.notes !== undefined) book.notes = String(updates.notes).trim();
  book.updatedAt = new Date().toISOString();

  books[idx] = book;
  writeBooks(books);
  return book;
}

function deleteBook(id) {
  const books = readBooks();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  books.splice(idx, 1);
  writeBooks(books);
  return true;
}

function getStats() {
  const books = readBooks();
  const total = books.length;
  const completed = books.filter((b) => b.status === 'completed').length;
  const reading = books.filter((b) => b.status === 'reading').length;
  const toRead = books.filter((b) => b.status === 'to-read').length;
  const totalPages = books.reduce((sum, b) => sum + (b.totalPages || 0), 0);
  const pagesRead = books.reduce((sum, b) => sum + (b.pagesRead || 0), 0);
  return { total, completed, reading, toRead, totalPages, pagesRead };
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getStats,
  _dataFile: DATA_FILE,
};
