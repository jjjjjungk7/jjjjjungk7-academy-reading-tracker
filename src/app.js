'use strict';

const express = require('express');
const path = require('path');
const store = require('./store');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET all books
app.get('/api/books', (req, res) => {
  try {
    const books = store.getAllBooks();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = store.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single book
app.get('/api/books/:id', (req, res) => {
  try {
    const book = store.getBookById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create book
app.post('/api/books', (req, res) => {
  try {
    const book = store.createBook(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update book
app.put('/api/books/:id', (req, res) => {
  try {
    const book = store.updateBook(req.params.id, req.body);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE book
app.delete('/api/books/:id', (req, res) => {
  try {
    const deleted = store.deleteBook(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Book not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
