const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store users and messages
const users = new Map();
const messages = [];

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user join
  socket.on('join', (username) => {
    users.set(socket.id, username);
    socket.username = username;
    
    // Send previous messages
    socket.emit('previousMessages', messages);
    
    // Notify others of new user
    socket.broadcast.emit('userJoined', username);
    
    // Send updated user list
    io.emit('userList', Array.from(users.values()));
  });

  // Handle chat message
  socket.on('chatMessage', (message) => {
    const msg = {
      username: socket.username,
      message,
      timestamp: new Date().toISOString()
    };
    
    messages.push(msg);
    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.shift();
    }
    
    io.emit('message', msg);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('userTyping', { username: socket.username, isTyping });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.username) {
      socket.broadcast.emit('userLeft', socket.username);
      users.delete(socket.id);
      io.emit('userList', Array.from(users.values()));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
