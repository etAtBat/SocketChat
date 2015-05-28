var app = require('express')();
//express initializes app to be a function handler that you can supply to an HTTP server
var http = require('http').Server(app);
var io = require("socket.io")(http);
var arnoldPhrases = [
  "I'll be back",
  "Hasta la vista, baby",
  "Consider that a divorce",
  "It's not a tumor",
  "Let off some steam, Bennett",
  "Get to the chopper!",
  "A freeze is coming",
  "You want to be a farmer? Here's a couple of acres!",
  "See you at the party, Richter!",
  "Honey, you shouldn't drink and bake"
];
var robotName = "arnoldBot";
var users = {};
var usersJSON = [];
//users will hold the list of active users
var namePresent = false;
//namePresent is false as long as the submitted username is valid, else true, to be used in name checking callback
users[robotName] = "";
usersJSON.push({"name":robotName});
var spamLimit = 500;
//spamLimit is time between messages, implemented to stop spam

function getIndexUsingName(findThisName){
      var indexOfObj = -1;
      each(usersJSON, function(a){
        if(a["name"] === findThisName){
          indexOfObj = usersJSON.indexOf(a);
        }
      })
      return indexOfObj;
    };

function each(something, doThis){
    if(something === {} || something === []){
      return undefined;
    }else if(Array.isArray(something)){
      for(var i = 0; i < something.length; i++){
        doThis(something[i]);
      };
    }else{
      //something is an object
      for(var key in something){
        if(something.hasOwnProperty(key)){
          doThis(something[key]);
        }
      };
    }
};


app.get("/", function(req,res){
	res.sendFile(__dirname+"/index.html")
});
//define route handler '/' that gets called when we hit our website home

io.on('connection', function(socket){
  console.log("a user connected");

  function updateUsers(){
    io.emit('usernames', usersJSON);
    //Object.keys returns an array
  };

  socket.on('new user', function(data, callback){
    namePresent = false;

    each(usersJSON, function(a){
      if(a["name"] === data){
        //one of the objects has the name (nickname submitted is taken)
        namePresent = true;
      }
    });

    if(namePresent){
      callback(false);
    } else {
      socket.nickname = data;
      each(users, function(a){
        if(data in users){
          return;
        }else{
          users[socket.nickname] = socket;
        }
      });
      usersJSON.push({"name":socket.nickname,
                      "lastMessage": undefined,
                      "notSpam": true});
      callback(true);
      updateUsers();
      io.emit('enterExit', "  " + data + " has entered the chat");
    }

  });

  socket.on('chat message', function(msg, callback){
    var date = new Date();
    var notSpam = true;
    var msg = msg.trim();

    //the following checks to prevent users from spamming chat
    each(usersJSON, function(a){
      if(a["lastMessage"] === undefined){
        a["lastMessage"] = date;
      }else if((date - a["lastMessage"]) <= spamLimit){
        //wait for specified interval between messages, trying to limit spam
        a["notSpam"] = false;
      }else{
        a["lastMessage"] = date;
        a["notSpam"] = true;
      }
    });

    date = date.toLocaleString('en-US');

    if(usersJSON[getIndexUsingName(socket.nickname)]["notSpam"]){
      if(msg.substr(0,3) === '/w ' || msg.substr(0,2) === '/w'){
        msg = msg.substr(3);
        var firstSpace = msg.indexOf(' ');
        if(firstSpace !== -1){
          //check to see username is valid
          var isValidName  = msg.substr(0, firstSpace);
          msg = msg.substr(firstSpace + 1);
          if(isValidName == robotName){
            var messageFromWhisperer = date+" | to "+isValidName+": "+ msg;
            var fromRobot = date+" | from "+robotName+": hi "+ socket.nickname + ", beep boop beep I'm a robot";
            users[socket.nickname].emit('new whisper', messageFromWhisperer);
            users[socket.nickname].emit('new whisper', fromRobot);
          }else if(isValidName in users){
            var messageFromWhisperer = date+" | to "+isValidName+": "+ msg;
            msg = date+" | from "+socket.nickname+": "+ msg;
            users[isValidName].emit('new whisper', msg);
            users[socket.nickname].emit('new whisper', messageFromWhisperer);
            console.log('whisper');  
          }else{
            callback("Please enter a valid username");
          }
        }else{
          callback("Please enter a message to whisper");
        }
      }else{
        var indexOfUser = getIndexUsingName(socket.nickname);
        msg = date+" | "+socket.nickname+": "+ msg;
        io.emit('chat message', msg);
        console.log(msg);
      }
    }
  });

  socket.on('disconnect', function(){
    if(!socket.nickname){
      return;
    }
    delete users[socket.nickname];
    namePresent = false;
    var toDelete = getIndexUsingName(socket.nickname);
    usersJSON.splice(toDelete,1);
    updateUsers();
    io.emit('enterExit', "  " + socket.nickname + " has left the chat");
		console.log(socket.nickname+" disconnected");
	});
});

//shuffle will take an array and return the array with the elements randomly ordered, to be used by arnoldBot
function shuffle(arr){
  for(var i = arr.length -1; i > 0; i--){
    var randomIndex = Math.floor(Math.random(i+1));
    var temp = arr[randomIndex];
    arr[randomIndex] = arr[i];
    arr[i] = temp;
  }
  return arr;
};

//this is arnoldBot speaking every 10 seconds
setInterval(function(){
  var date = new Date();
  date = date.toLocaleString('en-US');
  var arnoldSpeak = shuffle(arnoldPhrases)[0];
  console.log(date+" | "+robotName+": "+ arnoldSpeak);
  io.emit("chat message", date+" | "+robotName+": "+ arnoldSpeak);
},10000);


http.listen(3000, function(){
	console.log("listening on *:3000")
});
//http server listening on port 3000