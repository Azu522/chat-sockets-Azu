// Conexión dinámica con el servidor Socket.io 🔌
var socket = io();
var sonido = document.getElementById('sonido-notificacion');

// Elementos del DOM 📄
var persona = document.getElementById('persona'),
    appChat = document.getElementById('app-chat'),
    panelBienvenida = document.getElementById('panel-bienvenida'),
    usuario = document.getElementById('usuario'),
    mensaje = document.getElementById('mensaje'),
    botonEnviar = document.getElementById('enviar'),
    escribiendoMensaje = document.getElementById('escribiendo-mensaje'),
    output = document.getElementById('output'),
    inputArchivo = document.getElementById('archivo'),
    textoNombre = document.getElementById('nombre-archivo');

// Tamaño máximo permitido en bytes (10 MB) 📏
var TAMANO_MAXIMO = 10 * 1024 * 1024; 

// Variable para almacenar el avatar seleccionado 🎭
var avatarSeleccionado = 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';

// Función para seleccionar avatar visualmente 🖼️
function seleccionarAvatar(elemento) {
    var avatares = document.querySelectorAll('.avatar-opcion');
    avatares.forEach(function(img) {
        img.classList.remove('seleccionada');
    });
    elemento.classList.add('seleccionada');
    avatarSeleccionado = elemento.src;
}

// Función para entrar al chat al presionar "Enter" ⌨️
function detectarEnterBienvenida(evento) {
    if (evento.key === 'Enter') {
        ingresarAlChat();
    }
}

// Función para mostrar alertas personalizadas estilo neón 🚨
function mostrarAlertaPersonalizada(texto) {
    var alertaExistente = document.getElementById('alerta-neon');
    if (alertaExistente) alertaExistente.remove();

    var alerta = document.createElement('div');
    alerta.id = 'alerta-neon';
    alerta.innerHTML = texto;
    
    // Estilos alineados con la interfaz futurista 🌌
    Object.assign(alerta.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#110b29',
        color: '#ff4d4d',
        border: '2px solid #ff4d4d',
        boxShadow: '0 0 15px rgba(255, 77, 77, 0.6)',
        padding: '12px 24px',
        borderRadius: '12px',
        fontWeight: 'bold',
        fontSize: '14px',
        zIndex: '9999',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: '0'
    });

    document.body.appendChild(alerta);

    // Animación de entrada
    setTimeout(function() {
        alerta.style.opacity = '1';
        alerta.style.transform = 'translateX(-50%) translateY(10px)';
    }, 10);

    // Ocultar y eliminar después de 3.5 segundos
    setTimeout(function() {
        alerta.style.opacity = '0';
        alerta.style.transform = 'translateX(-50%) translateY(0px)';
        setTimeout(function() { alerta.remove(); }, 400);
    }, 3500);
}

// Función auxiliar para obtener la hora formateada ⏰
function obtenerHoraActual() {
    var ahora = new Date();
    return ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Actualizar el texto y validar tamaño al seleccionar un archivo 📎
inputArchivo.addEventListener('change', function () {
    if (inputArchivo.files.length > 0) {
        var archivoSeleccionado = inputArchivo.files[0];

        // Validar si supera el tamaño máximo ⚠️
        if (archivoSeleccionado.size > TAMANO_MAXIMO) {
            mostrarAlertaPersonalizada('⚠️ El archivo supera el límite permitido de 10 MB.');
            inputArchivo.value = ''; // Limpiar la selección
            textoNombre.textContent = 'Ningún archivo seleccionado';
            textoNombre.style.color = '#ff4d4d'; // Color de advertencia
        } else {
            textoNombre.textContent = archivoSeleccionado.name;
            textoNombre.style.color = '#00f0ff'; // Color neón
        }
    } else {
        textoNombre.textContent = 'Ningún archivo seleccionado';
        textoNombre.style.color = '#fff';
    }
});

botonEnviar.addEventListener('click', function(){
    var archivo = inputArchivo.files[0];
    var horaActual = obtenerHoraActual();

    // Verificación de seguridad adicional
    if (archivo && archivo.size > TAMANO_MAXIMO) {
        mostrarAlertaPersonalizada('⚠️ No se puede enviar un archivo mayor a 10 MB.');
        return;
    }

    if (archivo) {
        var lector = new FileReader();
        
        lector.onload = function(e) {
            socket.emit('chat', {
                usuario: usuario.value,
                avatar: avatarSeleccionado, // 🎭 <--- AGREGADO AQUÍ
                mensaje: mensaje.value,
                hora: horaActual,
                archivoData: e.target.result,
                nombreArchivo: archivo.name,
                tipoArchivo: archivo.type
            });
            
            mensaje.value = '';
            inputArchivo.value = ''; 
            textoNombre.textContent = 'Ningún archivo seleccionado';
            textoNombre.style.color = '#fff';
        };

        lector.readAsDataURL(archivo);
    } 
    else if (mensaje.value.trim() !== '') {
        socket.emit('chat', {
            usuario: usuario.value,
            avatar: avatarSeleccionado, // 🎭 <--- AGREGADO AQUÍ
            mensaje: mensaje.value,
            hora: horaActual,
            archivoData: null,
            nombreArchivo: null,
            tipoArchivo: null
        });
        mensaje.value = '';
    }
});

// Enviar con tecla "Enter" ⌨️
mensaje.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        botonEnviar.click();
    }
});

// Indicador de escritura ⌨️
mensaje.addEventListener('keyup', function(){
    if (persona.value) {
        socket.emit('typing', {
            nombre: usuario.value,
            texto: mensaje.value
        });
    }
});

// Escuchar eventos del servidor 🎧
socket.on('chat', function(data){
    escribiendoMensaje.innerHTML = '';

    // Imagen por defecto por si no viene avatar en el paquete 🎭
    var avatarUrl = data.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';

    // Cabecera con Avatar + Nombre + Hora ⏱️
    var contenido = '<p>' +
        '<span style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 6px;">' +
            '<span style="display: flex; align-items: center; gap: 8px;">' +
                '<img src="' + avatarUrl + '" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #00f0ff; object-fit: cover;">' +
                '<strong style="color: #ffaa00; margin: 0;">' + data.usuario + '</strong>' +
            '</span>' +
            '<span style="font-size: 11px; color: #00f0ff;">' + (data.hora || '') + '</span>' +
        '</span>' +
        (data.mensaje || '');

    // Renderizar archivos adjuntos si existen 📎
    if (data.archivoData) {
        if (data.tipoArchivo && data.tipoArchivo.startsWith('image/')) {
            contenido += '<br><img src="' + data.archivoData + '" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">';
        } else if (data.tipoArchivo && data.tipoArchivo.startsWith('video/')) {
            contenido += '<br><video controls src="' + data.archivoData + '" style="max-width: 100%; border-radius: 8px; margin-top: 8px;"></video>';
        } else {
            contenido += '<br><a href="' + data.archivoData + '" download="' + data.nombreArchivo + '" style="display: inline-block; margin-top: 8px; color: #00f0ff; text-decoration: underline; font-weight: bold;">📄 Descargar ' + data.nombreArchivo + '</a>';
        }
    }

    contenido += '</p>';
    output.innerHTML += contenido;
    output.scrollTop = output.scrollHeight;

    if (sonido) {
        sonido.play().catch(function(err){ console.log(err); });
    }
});

socket.on('typing', function(data){
    if (data.texto) {
        escribiendoMensaje.innerHTML = '<p><em>' + data.nombre + ' está escribiendo un mensaje...</em></p>';
    } else {
        escribiendoMensaje.innerHTML = '';
    }
});

// Actualización de la función ingresarAlChat() 🚪
function ingresarAlChat(){
    if (persona.value.trim() !== '') {
        panelBienvenida.style.display = "none";
        appChat.style.display = "flex";
        usuario.value = persona.value;
        usuario.readOnly = true;

        // 🟢 Avisar al servidor con el nombre y el avatar seleccionado
        socket.emit('nuevo-usuario', {
            nombre: persona.value,
            avatar: avatarSeleccionado
        });
    } else {
        mostrarAlertaPersonalizada('⚠️ Por favor ingresa tu nombre.');
    }
}

// Escuchar actualización de usuarios conectados (fuera de cualquier función) 👥
socket.on('usuarios-actualizados', function(usuarios){
    var elementoLista = document.getElementById('lista-usuarios');
    if (elementoLista) {
        elementoLista.textContent = usuarios.join(', ');
    }
});
// Función para salir del chat 🚪
function salirDelChat(){
    // 1. Avisar al servidor que este usuario se retira
    socket.emit('salir-usuario');

    // 2. Ocultar el chat y mostrar el panel de bienvenida
    appChat.style.display = "none";
    panelBienvenida.style.display = "block";

    // 3. Limpiar los campos de entrada
    persona.value = '';
    usuario.value = '';
    usuario.readOnly = false;
    mensaje.value = '';
    inputArchivo.value = '';
    textoNombre.textContent = 'Ningún archivo seleccionado';
}
