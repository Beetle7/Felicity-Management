const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}
const app = express();
const server = http.createServer(app);

// Socket.io setup
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

//cors
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']

}));


//Middleware 
app.use(express.json());

const connectDB = require('./config/db');
connectDB();

//routes
const authroute = require('./routes/authroute');
const adminroute = require('./routes/adminroute');
const eventroute = require('./routes/eventroute');
const regroute = require('./routes/regroute');
const profileroute = require('./routes/profileroute');
const clubroute = require('./routes/clubroute');
const resetroute = require('./routes/resetroute');
const feedbackroute = require('./routes/feedbackroute');
const messageroute = require('./routes/messageroute');


//hardcoded admin
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const createAdmin = async () => {
    try {
        const yesAdmin = await User.findOne({ role: 'Admin' });
        if (yesAdmin) {
            console.log('Admin user already exists');
            return;
        }
        else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('blub', salt);
            await User.create({
                email: 'wallelaval@gmail.com'.toLowerCase(),
                password: hashedPassword,
                role: 'Admin',
                firstName: 'Admin',
                lastName: 'User',
            });
            console.log('Admin user created')
        }
    }
    catch (error) {
        console.error('Error creating admin user:', error)
    }
};


app.use('/api/auth', authroute);
app.use('/api/admin', adminroute);
app.use('/api/events', eventroute);
app.use('/api/registrations', regroute);
app.use('/api/profile', profileroute);
app.use('/api/clubs', clubroute);
app.use('/api/password-reset', resetroute);
app.use('/api/feedback', feedbackroute);
app.use('/api/messages', messageroute);

// Socket.io connection handling
const jwt = require('jsonwebtoken');
const Message = require('./models/message');

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded.user;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.user.id);

    socket.on('join_event', (eventId) => {
        socket.join(`event_${eventId}`);
    });

    socket.on('leave_event', (eventId) => {
        socket.leave(`event_${eventId}`);
    });

    socket.on('send_message', async (data) => {
        try {
            const message = new Message({
                event: data.eventId,
                sender: socket.user.id,
                text: data.text,
                parentId: data.parentId || null
            });
            await message.save();
            const populated = await Message.findById(message._id)
                .populate('sender', 'firstName lastName role organizerName');
            io.to(`event_${data.eventId}`).emit('new_message', populated);
        } catch (err) {
            socket.emit('error', 'Failed to send message');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.user.id);
    });
});

//sanity test
app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        createAdmin();
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.log(err));
