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
var nicknames = [];
//nicknames wll hold the user list

app.get("/", function(req,res){
	res.sendFile(__dirname+"/index.html")
});
//define route handler '/' that gets called when we hit our website home

io.on('connection', function(socket){
  console.log("a user connected");

  function updateUsers(){
    io.emit('usernames', nicknames)
  };

  socket.on('new user', function(data, callback){
    if(nicknames.indexOf(data) != -1){
      callback(false);
    } else {
      socket.nickname = data;
      nicknames.push(data);
      callback(true);
      updateUsers();
    }

  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log("message: " + msg);
  });

  socket.on('disconnect', function(){
    if(!socket.nickname){
      return;
    }
    nicknames.splice(nicknames.indexOf(socket.nickname), 1);
    updateUsers();
		console.log("user disconnected");
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
  console.log(date+" | arnoldBot: "+ arnoldSpeak);
  io.emit("chat message", date+" | arnoldBot: "+ arnoldSpeak);
},10000);


http.listen(3000, function(){
	console.log("listening on *:3000")
});
//http server listening on port 3000