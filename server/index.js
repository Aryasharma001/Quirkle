const express = require("express");
const { Server } = require("socket.io");

const socketio = require("socket.io");
const cors=require('cors')

const http = require("http");
const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(cors({
    origin: "http://localhost:3000", 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    
  }));

const {addUser,removeUser,getUser,getUsersInRoom}=require('./users');

io.on('connect', (socket) => {
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });
        console.log(`${user.name} Joined room ${user.room}`);

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });
          
        io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)});
        

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', { user: user.name, text: message });
        }

        callback();
    });

    socket.on('disconnect', () => {
        console.log("user left!");
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` });
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        }
    });
});


app.use(router);


server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
  });
