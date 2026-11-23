const bus = require('./eventBus');

const stamp = () => new Date().toISOString();

function registerListeners() {
  bus.on('user:registered', (user) => {
    console.log(`[event ${stamp()}] user:registered -> ${user.username} (${user.email})`);
  });

  bus.on('user:loggedIn', (user) => {
    console.log(`[event ${stamp()}] user:loggedIn -> ${user.username}`);
  });

  bus.on('auth:failed', ({ email }) => {
    console.warn(`[event ${stamp()}] auth:failed -> login attempt for ${email}`);
  });

  bus.on('note:created', (note) => {
    console.log(`[event ${stamp()}] note:created -> "${note.title}" by ${note.owner}`);
  });

  bus.on('note:deleted', ({ id, owner }) => {
    console.log(`[event ${stamp()}] note:deleted -> ${id} by ${owner}`);
  });

  bus.on('chat:message', ({ room, username }) => {
    console.log(`[event ${stamp()}] chat:message -> ${username} in #${room}`);
  });
}

module.exports = registerListeners;
