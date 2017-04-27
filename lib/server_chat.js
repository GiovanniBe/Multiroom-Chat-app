
const socketio = require('socket.io');
const io;
const guestNumber = 1;
const nickNames = {};
const namesUsed = [];
const currentRoom = {};

exports.listen = function(server) {
  io = socket.listen(server);
  io.set('log level', 1);
  io.sockets.on('connection', function (socket) {

    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on('rooms', function() {
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed);

  });
};

/**
 * handles the naming of new users.
 * @param  {[type]} socket      [description]
 * @param  {[type]} guestNumber [description]
 * @param  {[type]} nickNames   [description]
 * @param  {[type]} namesUsed   [description]
 * @return {[type]}             [description]
 */

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  let name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  namesUsed.push(name);
  return guestNumber + 1;
}

/**
 * handles logic related to a user joining a chat room.
 * @param  {[type]} socket    [description]
 * @param  {[type]} room_name [description]
 * @return {[type]}           [description]
 */

function joinRoom(socket, room_name) {
  socket.join(room_name);
  currentRoom[socket.id] = room_name;
  socket.emit('joinResult', {room_name : room_name});
  socket.broadcast.to(room_name).emit('message', {
    text : nickNames[socket.id] + ' has joined ' + room_name + '.'
  });

  let usersInRoom = io.sockets.clients(room_name);
  if (usersInRoom.length > 1) {
    let usersInRoomSummary = 'Users currently in ' + room_name + ' : ';
    for (let index in usersInRoom) {
      let userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary +=', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInroomSummary});
  }
}

/**
 * handles requests by users to change their name.
 * @param  {[type]} socket    [description]
 * @param  {[type]} nickNames [description]
 * @param  {[type]} nameUsed  [description]
 * @return {[type]}           [description]
 */

function handleNameChangeAttempts(socket, nickNames, nameUsed) {
  socket.on('nameAttempt', function(name) {
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      if (nameUsed.indexOf(name) == -1) {
        let previuosName = nickNames[socket.id];
        let previuosNameIndex = nameUsed.indexOf(previuosName);
        nameUsed.push(name);
        nickNames[socket.id] = name;
        delete nameUsed[previuosNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previuosName + ' is known as ' + name + '.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        });
      }
    }
  });
}
