var express = require('express');
var http = require('http');
var socketio = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

// Serve static files from ./public
app.use(express.static(__dirname + '/public'));

// Quiet you.
io.set('log level', 1);

// Store users.
var users = [];

// Store rooms.
var rooms = [];

// Listen for Socket.IO connections
io.sockets.on('connection', function (socket) {

  // Set user if already exist
  var user = getUser(socket.id);

  // Broadcast user joined event.
  io.sockets.emit('new user', 'New user joined!');

  // Listen for message events from clients and replay it to all listeners.
  socket.on('message', function (data) {
    // Broadcast data
    if (user) {
    	if (user.rooms.length > 0) {
    		// Loop all rooms for the current user
    		for (var i = 0; i < user.rooms.length; i++) {
	    		// Loop all users and broadcast message to those who are in the same room as the user
	    		for (var j = 0; j < users.length; j++) {
	    			console.log("t: ", users[j]);
	    			if (users[j].rooms.length > 0) {
	    				for (var k = 0; k < users[j].rooms.length; k++) {
	    					if (users[j].rooms[k].id == user.rooms[i].id) {
	    						io.sockets.socket(users[j].id).emit('message', { text: data })
	    					}
	    				}
	    			}
	    		}
    		}
    	}
    	else {
    		io.sockets.emit('message', { username: user.username, text: data });	
    	}
    }
    else {
    	io.sockets.emit('message', { text: data }); 
    }

    // Log the pretty data to the console.
    console.log(data);
  });

  // Listen for username events from clients and register the user.
  socket.on('username', function (data) {
  	for(var i = 0; i < users.length; i++) {
  		if(users[i].id == socket.id) {
  			users[i].username = data;
  		}
  	}

    // Set current user
    user = getUser(socket.id);

    // Log the pretty data to the console.
    console.log(data);
  });

  // Listen for room events from clients and add the user to the specified room.
  socket.on('room', function (data) {
    var room = getRoom(data);

    if (user) {
    	user.rooms.push(room);
    }
    else {
    	user = getUser(socket.id);
    	user.rooms.push(room);
    }

    // Log the pretty data to the console.
    console.log(data);
  });
});

function getRoom(roomId) {
	for(var i = 0; i < rooms.length; i++) {
		if (rooms[i].id == roomId) {
			return rooms[i];
		}
	}

	// Add room if it doesn't exist
	var r = { id: roomId };
	rooms.push(r);

	return r;
}

function getUser(socketId) {
	for(var i = 0; i < users.length; i++) {
		if (users[i].id == socketId) {
			return users[i];
		}
	}

	var u = { id: socketId, rooms: [] };
	users.push(u);

	return u;
}

// Check if we are testing
if(require.main === module) {
  // Not testing, spin it up!
  server.listen(8023);
  var appUrl = 'http://localhost:' + server.address().port;
  console.log('Running! Open ' + appUrl + ' in a browser to see');
} else {
  server.listen(8045);
  // Let our tests get at our server.
  module.exports = server;
}