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

// Middleware to serve static files from the Angular app
app.use(express.static(path.join(__dirname, 'public')));

// Example socket.io configuration
io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('message', (message) => {
    console.log('message: ' + message);
    io.emit('message', message); // Broadcast the message to all connected clients
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// API example route
app.get('/api', (req, res) => {
  res.send('API is working');
});

// All other routes should serve the Angular app
app.get('/', (req, res) => {
  res.send("OK")
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
