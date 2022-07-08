const divSelectUsers = document.querySelector('.div_select_users');
const divUser = document.querySelector('.div_user');
const divRooms = document.querySelector('.div_rooms');
const divChat = document.querySelector('.div_chat');
const domain = ('http://localhost:8000/api/');
let userLoggedId; // ID текущего пользователя
let currentRoom = ''; // Держим в памяти чтобы отключиться от нее при переходе в новую комнату

// формируем случайный номер для WS для возможности одновременного открытия на разных вкладках
let sn =  'sn' + Math.floor(Math.random() * 10000 + 1);
console.log("Сформирован случайный номер для WebSoket:", sn);

// подключаемся с использованием генератора чисел чтобы можно было запустить копии в разных вкладках
// открываем 2 канала чтобы при отправке сообщения через чат, совпадающего с какой-нить командой не было ошибок

const socket = new WebSocket('ws://localhost:8000/ws/instructions/' + sn); // командный канал
const chatSocket = new WebSocket('ws://localhost:8000/ws/chat/' + sn); // канал сообщений чата
socket.onclose = async (event) => {
    console.error(event);
    window.alert('НЕТ СВЯЗИ С СЕРВЕРОМ DJANGO! ПРОВЕРЬТЕ СОСТОЯНИЕ СЕРВЕРА!');    
    console.log('НЕТ СВЯЗИ С СЕРВЕРОМ DJANGO! ПРОВЕРЬТЕ СОСТОЯНИЕ СЕРВЕРА!');
};

// localStorage.setItem('socket', socket);
socket.onerror = (evt) => document.querySelector('#message').innerText = evt[key];
chatSocket.onerror = (evt) => document.querySelector('#message').innerText = evt[key];


socket.onopen = () => load_users();
function load_users() {
    socket.send(JSON.stringify({'load': 'users'}));
};

socket.onmessage = function(event) {
    let data = JSON.parse(event.data);
    console.log(data);

    // Если в сообщении ключ 'message' то печатаем содержимое ключа на html странице
    if ('message' in data) {
        document.querySelector('#message').innerText = data.message;
    };
    // Если ключ 'UserList' то выводим из jsona список юзеров 
    if ('UserList' in data) {
        // Вывод делать только когда div_user должен быть отображен
        if (userLoggedId) {
            viewUserCard(userLoggedId);
        } else {
            console.log('текущий юзер не выбран');
            printUsers(data);
        };
    };
    // Если ключ 'RoomList' то выводим из jsona список комнат
    if ('RoomList' in data) {
        // Вывод делать только когда div_rooms должен быть отображен
        if (userLoggedId) {
            printRooms(data);
        };
    };
    // Если ключ 'RoomList' то выводим из jsona список комнат
    if ('MessageList' in data) {
        // Вывод делать только когда div_rooms должен быть отображен
        if (userLoggedId) {
            printChat(data);
        };
    };
};

// Вывод на экран списка юзеров
function printUsers(data) {
    delete data.UserList;
    let list = '';
    for (let key in data) {
        const newString = `<tr><td>${data[key]}</td>
        <td><button onclick="userLogged(${key})">выбрать</button></td>
        <td><button onclick="deleteUser(${key})">удалить</button></td>`;
        list = list + newString;
    };
    divSelectUsers.innerHTML = `<table> ${list}</table><br>`;
};

// Создание нового юзера
document.querySelector('.btn_create_user').addEventListener('click', () => {
    let name = document.getElementById("input_user");
    if (name.value !== "") {
        socket.send(JSON.stringify({'create_user': name.value}));
        console.log({'create_user': name.value});
        name.value = "";
    };
});

// Удаление юзера
function deleteUser(id) {
    socket.send(JSON.stringify({'delete_user': id}));
    console.log({'delete_user': id});
};

// Точка входа в отображение карточки юзера + комнат + чата
function userLogged(userId) {
    // удалим уже ненужный div выбора юзера если он был выбран
    if (userLoggedId == undefined) {
        document.querySelector('.div_main').removeChild(document.querySelector('.div_start'));
    };
    userLoggedId = userId;
    viewUserCard(userId);
};

// Запрос данных с сервера юзера + комнат
function viewUserCard(userId) {
    fetch(domain + 'users/' + userId +'/')
        .catch(err => console.log(err))
        .then(response => response.json())
        .then(result => printUserCard(result))
    socket.send(JSON.stringify({'load': 'rooms'}));
};

// Вывод на страницу содержимого карточки юзера
function printUserCard(item) {
    if (item.room == null) {
        room = "не выбрана";
    } else {
        let idRoom = item.room[item.room.length-2];
        room = listrooms[idRoom];
    };

    divUser.innerHTML = `
    <div class="div">
        <img src="${item.avatar}">
        <br>
        <strong>Сменить аватарку:</strong><br>
        <input id="avatar-input" type="file" accept="image/*"><br>
        <button onclick="editAvatar(${item.id})">отправить</button>
        <p>ID: ${item.id}</p>
        <p>Имя: ${item.name} <button onclick="changeUserName(${item.id})">изменить</button></p>
        <p>Комната в чате: ${room}</p>
        <h4 class="message" id="message"></h4>
    </div>
    `;
};

// Функция выгрузки на сервер аватарки юзера
async function editAvatar(userId) {
    const formData = new FormData();
    let fileField = document.querySelector('#avatar-input');
    if (fileField.files[0]) {
        formData.append('avatar', fileField.files[0]);
        formData.append('avatar_small', fileField.files[0]);
        try {
            const response = await fetch(domain + 'users/' + userId +'/', {
                method: 'PATCH',
                body: formData
            });
            const result = await response.json();
            console.log('Фото юзера сохранено:', JSON.stringify(result));
        } catch (error) {
            console.log('Все пропало!!!');
            console.error('Ошибка:', error);
        }
        viewUserCard(userId);
    } else {
        console.log('Файл не выбран!');
        document.querySelector('#message').innerText = '!!! файл не выбран';
    };
};

// Изменение имени юзера
function changeUserName(userId) {
    let name = prompt('Введите новое имя');
    socket.send(JSON.stringify({'order': 'changeUserName', 'id': userId, 'name': name }));
    console.log('Отправлен запрос на сервер изменить имя на:', name);
};

// Вывод на страницу списка комнат
function printRooms(data) {
    delete data.RoomList;
    let list = '';
    for (let key in data) {
        const newString = `<tr><td><b>${data[key]}</b></td>
        <td><button onclick="deleteRoom(${key})">удалить</button></td>
        <td><button onclick="editRoom(${key})">изменить</button></td>
        <td><button onclick="selectRoom(${key})">подключиться</button></td></tr>`;
        list = list + newString;
    };
    list = '<table>' + list + '</table><br>'
    list = list + `<input type="text" id="input_room" name="name_new_room" size="22" placeholder="Введите имя новой комнаты"><br>`
    list = list + `<button class="btn btn_new_room">Создать комнату</button>`
    divRooms.innerHTML = list;

    // Создание новой комнаты
    document.querySelector('.btn_new_room').addEventListener('click', () => {
        let name = document.getElementById("input_room");
        if (name.value !== "") {
            socket.send(JSON.stringify({'create_room': name.value}));
            console.log({'create_room': name.value});
            name.value = "";
        };
    });
};

// Удаление комнаты
function deleteRoom(id) {
    socket.send(JSON.stringify({'delete_room': id}));
    console.log({'delete_room': id});
}

// Переименование комнаты
function editRoom(id) {
    let name = prompt('Введите новое имя комнаты');
    socket.send(JSON.stringify({'order': 'changeRoomName', 'id': id, 'name': name }));
    console.log('Отправлен запрос на сервер изменить имя комнаты на:', name);
};

// Рисуем модуль чата
function printChat(data) {
    divChat.innerHTML = `<h3 style="text-align: center;">Комната: ${data['MessageList']}</h3>
    <textarea class="textarea" name="textarea"></textarea><br>
    <input type="text" id="input_message" name="input_message" size="22" placeholder="Введите сообщение"><br>
    <button class="btn btn_message">Отправить</button>`;
    delete data.MessageList;
    let textarea = document.querySelector('.textarea');

    for (let messageElement in data) {
        for (let key in data[messageElement]) {
            let newString = `${key}: ${data[messageElement][key]}\n`;
            textarea.value += newString;
        };
    };

    // Отправка сообщения
    document.querySelector('.btn_message').addEventListener('click', () => {
        let message = document.getElementById("input_message");
        if (message.value !== "") {
            chatSocket.send(JSON.stringify({'usersendcommandroom': 'message', 'room_id': currentRoom, 'userid': userLoggedId, 'message': message.value}));
            console.log({'usersendcommandroom': 'message', 'room_id': currentRoom, 'user': userLoggedId, 'message': message.value});
            message.value = "";
        };
    });

    // слушаем сокет и принимаем входящие сообщения от подключенной комнаты
    chatSocket.onmessage = function(event) {
        let data = JSON.parse(event.data);
        console.log(data);
        textarea.value += `${data['name']}: ${data['message']}\n`;
    };
};

    function selectRoom(id) {
        // Запрашиваем список сообщений комнаты в !!! командном канале
        socket.send(JSON.stringify({'load': 'messageList', 'newroom_id': id}));
        console.log({'load': 'messageList', 'newroom_id': id});
        // Запрашиваем на сервере подключение к выбранной комнате и отключение от прежней (если была)
        chatSocket.send(JSON.stringify({'usersendcommandroom': 'roomselect', 'newroom_id': id, 'oldroom_id': currentRoom}));
        currentRoom = id; // после отключения обновляем id (для следующего переподключения)
    };




