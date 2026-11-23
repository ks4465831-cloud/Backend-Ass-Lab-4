const jwt = require('jsonwebtoken');
const { extractToken } = require('../middleware/auth');
const bus = require('../events/eventBus');

function initChat(io) {
  
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || extractToken(socket.handshake.headers);
    if (!token) return next(new Error('No token provided'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { username } = socket.user;
    console.log(`User connected: ${socket.id} (${username})`);

    socket.on('joinRoom', (room = 'general') => {
      socket.join(room);
      socket.room = room;
      console.log(`${socket.id} joined room ${room}`);
      io.to(room).emit('systemMessage', `${username} joined #${room}`);
    });

    socket.on('chatMessage', (text) => {
      const room = socket.room || 'general';
      if (!text || !String(text).trim()) return;
      const payload = { username, text: String(text).trim(), room, time: new Date().toISOString() };
      console.log(`[${room}] ${username}: ${payload.text}`);
      bus.emit('chat:message', payload);
      io.to(room).emit('chatMessage', payload);
    });

    socket.on('typing', () => {
      socket.to(socket.room || 'general').emit('typing', username);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id} (${username})`);
      if (socket.room) io.to(socket.room).emit('systemMessage', `${username} left #${socket.room}`);
    });
  });
}

module.exports = initChat;
