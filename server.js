var express = require('express');
var exphbs = require('express-handlebars');
var http = require('http');

var app = express();

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var rooms = [];

function getRoom() {
  var min = 1000;
  var max = 9999;
  var roomNo;
  for (var i = min; i <= max; i++) {
    roomNo = Math.floor(Math.random() * (max - min)) + min;
    if (rooms.indexOf(roomNo) == -1) {
      rooms[roomNo] = true;
      break;
    }
  }
  return roomNo;
}

function leaveRoom(id) {
  var idx = rooms.indexOf(id);
  if (clientsInRoom(id) == 0 && idx > -1) {
    rooms.splice(idx, 1);
  }
}

function clientsInRoom(room) {
  if (typeof io.of('/').adapter.rooms[room] == 'undefined') {
    return 0;
  } else {
    return Object.keys(io.of('/').adapter.rooms[room]).length;
  }
}

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('public'));

app.get('/', function (req, res, next) {
  res.redirect('/session/' + getRoom());
});

app.get('/session/:id([1-9][0-9]{3})', function (req, res, next) {
  res.render('home', {
    layout: false
  });
});

app.get('/video_title/:vid([a-zA-Z0-9\-_]+)', function (req, res) {
  http.get('http://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + req.params.vid, function (response) {
    if (response.statusCode == 200) {
      response.setEncoding('utf8');
      response.on('data', function (data) {
        var video = JSON.parse(data);

        return res.json({
          'title': video.title
        });
      });

    } else if (response.statusCode == 404) {
      return res.status(404).send('Video not found').end();
    } else {
      return res.status(400).send('Error ' + response.statusMessage).end();
    }
  }).on('error', function (e) {
    return res.status(500).send('Error ' + e.message).end();
  });
});

var server = app.listen(server_port, server_ip_address, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});

var io = require('socket.io')(server);
io.on('connection', function (socket) {
  var sessionID = null;

  socket.on('register', function (id, callback) {
    if (!/^[1-9][0-9]{3}$/.test(id)) {
      socket.emit('ws-error', 'Invalid session id');
      return;
    }
    sessionID = parseInt(id);
    socket.join(sessionID);

    var otherClientsCount = clientsInRoom(sessionID) - 1;
    callback(otherClientsCount);

    if (otherClientsCount > 0) {
      socket.in(sessionID).emit('sync');
    }
  });

  socket.on('sync-ack', function (data) {
    if (sessionID == null) {
      socket.emit('ws-error', 'Not registered');
      return;
    }
    socket.in(sessionID).emit('sync-ack', data);
  });

  socket.on('select-video', function (data) {
    if (sessionID == null) {
      socket.emit('ws-error', 'Not registered');
      return;
    }
    socket.in(sessionID).emit('select-video', data);
  });

  socket.on('add-video', function (data) {
    if (sessionID == null) {
      socket.emit('ws-error', 'Not registered');
      return;
    }
    socket.in(sessionID).emit('add-video', data);
  });

  socket.on('item-remove', function (data) {
    if (sessionID == null) {
      socket.emit('ws-error', 'Not registered');
      return;
    }
    socket.in(sessionID).emit('item-remove', data);
  });

  socket.on('remove-completed', function () {
    if (sessionID == null) {
      socket.emit('ws-error', 'Not registered');
      return;
    }
    socket.in(sessionID).emit('remove-completed');
  })

  socket.on('control', function (data) {
    if (sessionID == null) {
      socket.emit('ws-error', 'Not registered');
      return;
    }
    socket.in(sessionID).emit('control', data);
  })

  socket.on('disconnect', function () {
    socket.leave(sessionID);
    leaveRoom(sessionID);
  });

});
