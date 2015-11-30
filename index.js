// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// UserNames which are currently connected to the chat
var UserNames = {};
var NumUsers = 0;

io.on('connection', function (Socket) {
  var AddedUser = false;
  Socket.emit('Connect',{
    Code    : 200,
    Message : "Connect Success"
  })

  // when the client emits 'new message', this listens and executes
  Socket.on('Message', function (Data) {
    // we tell the client to execute 'new message'
    console.log("Data: "+Data);
    Socket.broadcast.emit('new message', {
      UserName  : Data.UserName,
      Message   : Data.Message
    });
  });

  // when the client emits 'add user', this listens and executes
  Socket.on('Join', function (UserName) {
    console.log("Join : "+UserName);
    // we store the UserName in the Socket session for this client
    Socket.UserName = UserName;
    // add the client's UserName to the global list
    UserNames[UserName] = UserName;
    ++NumUsers;
    AddedUser = true;
    Socket.emit('Login', {
      Code      : 200,
      NumUsers  : NumUsers,
      Message   : "Login Success"
    });
    // echo globally (all clients) that a person has connected
    console.log("UserJoin");
    Socket.broadcast.emit('UserJoin', {
      UserName: Socket.UserName,
      NumUsers: NumUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  Socket.on('Typing', function () {
    Socket.broadcast.emit('Typing', {
      UserName: Socket.UserName
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  Socket.on('StopTyping', function () {
    Socket.broadcast.emit('StopTyping', {
      UserName: Socket.UserName
    });
  });

  // when the user disconnects.. perform this
  Socket.on('Disconnect', function () {
    // remove the UserName from global UserNames list
    if (AddedUser) {
      delete UserNames[Socket.UserName];
      --NumUsers;

      // echo globally that this client has left
      Socket.broadcast.emit('UserLeft', {
        UserName: Socket.UserName,
        NumUsers: NumUsers
      });
    }
  });
});
