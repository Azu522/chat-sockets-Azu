var express = require('express');
var socket = require('socket.io');

// Configuración de la aplicación
var app = express();

var server = app.listen(4000, function(){
    console.log('Servidor corriendo en http://localhost:4000');
});

// Archivos estáticos
app.use(express.static('public'));

// Configuración de Socket.io con espacio suficiente para archivos (100 MB) 🖼️
var io = socket(server, {
    maxHttpBufferSize: 1e8
});

// Objeto para guardar los usuarios conectados { socket.id: 'Nombre' } 👥
var usuariosConectados = {};

io.on('connection', function(socket){
    console.log('Hay una conexión:', socket.id);

// Escuchar cuando un usuario ingresa al chat 🚪
    socket.on('nuevo-usuario', function(data){
        // Si nos envían un objeto con nombre y avatar o solo un texto
        var nombreUsuario = typeof data === 'object' ? data.nombre : data;
        
        usuariosConectados[socket.id] = nombreUsuario;
        
        // Emitir la lista actualizada a TODOS los clientes
        io.sockets.emit('usuarios-actualizados', Object.values(usuariosConectados));
    });

    // Escuchar mensajes del chat 💬
    socket.on('chat', function(data){
        console.log(data);
        io.sockets.emit('chat', data);
    });

    // Escuchar evento de escritura ⌨️
    socket.on('typing', function(data){
        socket.broadcast.emit('typing', data);
    });

    // Detectar desconexión de un usuario ❌
    socket.on('disconnect', function(){
        if (usuariosConectados[socket.id]) {
            console.log('Se desconectó:', usuariosConectados[socket.id]);
            delete usuariosConectados[socket.id];
            // Enviar lista actualizada tras la salida
            io.sockets.emit('usuarios-actualizados', Object.values(usuariosConectados));
        }
    });

    // Escuchar cuando un usuario presiona "Salir del chat" 🚪
    socket.on('salir-usuario', function(){
        if (usuariosConectados[socket.id]) {
            console.log('El usuario salió:', usuariosConectados[socket.id]);
            delete usuariosConectados[socket.id];
            // Emitir la lista actualizada a todos los clientes
            io.sockets.emit('usuarios-actualizados', Object.values(usuariosConectados));
        }
    });
});