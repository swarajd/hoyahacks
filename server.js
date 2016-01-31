var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var bodyParser = require('body-parser');
var morgan = require('morgan');

var low = require('lowdb');
var storage = require('lowdb/file-sync');
var db = low();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(morgan('combined'));

app.get('/', function (req, res) {
  res.send('<h1>Hello world</h1>');
});

// === === === === === REGISTRY FINISHED === === === === ===
app.post('/register/:arduinoid/:phoneid', function(req, res) {
  console.log(req.params.arduinoid);
  console.log(req.params.phoneid);
  var arduino = db('systems').find({arduinoid: req.params.arduinoid});
  if (arduino == null) {
    io.sockets.emit('registerarduino', {
      phoneid: req.params.phoneid,
      arduinoid: req.params.arduinoid
    });
    db('systems').push({
      arduinoid: req.params.arduinoid,
      phoneid: req.params.phoneid,
      validphones: []
    });
    db('users').push({
      phoneid: req.params.phoneid,
      houses: [req.params.arduinoid]
    });
    res.send('Success!');
  } else {
    res.send('Already registered.');
  }
})


app.post('/unlock/:arduinoid/:phoneid', function(req, res) {
  console.log('you are trying to unlock this arduino: ', req.params.arduinoid);
  var arduino = db('systems').find({arduinoid: req.params.arduinoid});
  if (arduino == null) {
    res.send('this house does not exist...');
  } else {
    var validphones = arduino.validphones;
    //if it's not in the valid phones and not the original id of the arduino
    console.log(validphones.indexOf(req.params.phoneid));
    console.log(req.params.phoneid);
    console.log(arduino.phoneid);
    if (validphones.indexOf(req.params.phoneid) == -1 && req.params.phoneid != arduino.phoneid) {
      res.send('this phone is not paired with this house');
    } else {
      io.sockets.emit('unlockhouse', {
        phoneid: req.params.phoneid,
        arduinoid: req.params.arduinoid
      })
      res.send('you have unlocked an arduino');
    }
  }
});

// THIS WORKS
app.get('/houses/:phoneid', function(req, res) {
  var curUser = db('users').find({
    phoneid: req.params.phoneid
  });
  console.log(curUser);
  if (curUser) {
    res.send({
      houses: curUser.houses
    });
  } else {
    res.send('no houses!');
  }
});

// THIS WORKS
app.get('/phones/:arduinoid', function(req, res) {
  var curSystem = db('systems').find({
    arduinoid: req.params.arduinoid
  });
  console.log(curSystem);
  if (curSystem) {
    res.send({
      people: curSystem.validphones
    });
  } else {
    res.send('this system does not exist');
  }
});


app.post('/addphone/:arduinoid/:phoneid', function(req, res) {

  console.log('you are trying to add a valid phone to this arduino: ', req.params.arduinoid);
  var arduino = db('systems').find({
    arduinoid: req.params.arduinoid
  });

  var validphones = arduino.validphones;
  console.log(validphones);

  if (validphones.indexOf(req.params.phoneid) == -1) {
    io.sockets.emit('addphone', {
      phoneid: req.params.phoneid,
      arduinoid: req.params.arduinoid,
    });

    // add the phone to the db system
    var arduino = db('systems').find({
      arduinoid: req.params.arduinoid
    });

    console.log(arduino);

    var initialphones = arduino.validphones;

    db('systems')
    .chain()
    .find({
      arduinoid: req.params.arduinoid
    }).assign({
      validphones: initialphones.push(req.params.phoneid)
    });

    // add the arduino to the user
    var curUser = db('users').find({
      phoneid: req.params.phoneid
    });

    if (!curUser) {
      db('users').push({
        phoneid: req.params.phoneid,
        houses: [req.params.arduinoid]
      });
    } else {
      var userHouses = curUser.houses;

      db('users')
      .chain()
      .find({
        phoneid: req.params.phoneid
      }).assign({
        houses: userHouses.push(req.params.arduinoid)
      });
    }

    res.send('you have added a phone to the arduino');
  } else {
    res.send('the phone is already registered with the arduino');
  }
});

io.on('connection', function (socket) {
  console.log('someone connected');
});

server.listen(3000, function(){
  console.log('listening on *:3000');
});
