const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const { verifyToken } = require('../middleware/auth');
const bus = require('../events/eventBus');

const router = express.Router();
router.use(verifyToken); // every notes route is protected

const validId = (id) => mongoose.Types.ObjectId.isValid(id);


const scope = (req, extra = {}) =>
  req.user.role === 'admin' ? extra : { ...extra, owner: req.user.id };


router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body || {};
    if (!title || !content) {
      return res.status(400).json({ message: 'title and content are required' });
    }
    const note = await Note.create({ title, content, owner: req.user.id });
    bus.emit('note:created', note);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const notes = await Note.find(scope(req)).sort({ createdAt: 1 });
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid note id' });
  const note = await Note.findOne(scope(req, { _id: req.params.id }));
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.status(200).json(note);
});


router.put('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid note id' });
  const { title, content } = req.body || {};
  const update = {};
  if (title) update.title = title;
  if (content) update.content = content;

  const note = await Note.findOneAndUpdate(scope(req, { _id: req.params.id }), update, {
    new: true,
  });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.status(200).json(note);
});


router.delete('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid note id' });
  const note = await Note.findOneAndDelete(scope(req, { _id: req.params.id }));
  if (!note) return res.status(404).json({ message: 'Note not found' });
  bus.emit('note:deleted', { id: note._id, owner: req.user.username });
  res.status(200).json({ message: 'Note deleted' });
});

module.exports = router;
