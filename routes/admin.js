const express = require('express');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();


router.get('/users', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json(users);
});


router.get('/me', verifyToken, (req, res) => {
  res.status(200).json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

module.exports = router;
