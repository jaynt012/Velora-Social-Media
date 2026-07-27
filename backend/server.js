require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const db = require('./src/config/db'); // Initialize DB connection

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes          = require('./src/routes/auth.routes');
const searchRoutes        = require('./src/routes/search.routes');
const usersRoutes         = require('./src/routes/users.routes');
const messagesRoutes      = require('./src/routes/messages.routes');
const postsRoutes         = require('./src/routes/posts.routes');
const notificationsRoutes = require('./src/routes/notifications.routes');

app.use('/api/auth',          authRoutes);
app.use('/api/search',        searchRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/messages',      messagesRoutes);
app.use('/api/posts',         postsRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Velora Backend is running' });
});

// Socket.io Implementation
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretvelorakey';

// Map of userId -> socketId
const connectedUsers = new Map();

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
});

io.on('connection', (socket) => {
    const userId = socket.user.id;
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} connected (Socket: ${socket.id})`);

    socket.on('send_message', (data, callback) => {
        const { receiverId, content } = data;
        
        db.run('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', 
            [userId, receiverId, content], 
            function(err) {
                if (err) return callback({ error: 'Failed to send' });
                
                const messageObj = {
                    id: this.lastID,
                    sender_id: userId,
                    receiver_id: receiverId,
                    content,
                    timestamp: new Date().toISOString()
                };

                // Emit to receiver if online
                const receiverSocketId = connectedUsers.get(parseInt(receiverId));
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', messageObj);
                }
                
                // Return success to sender
                callback({ success: true, message: messageObj });
            }
        );
    });

    socket.on('disconnect', () => {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
