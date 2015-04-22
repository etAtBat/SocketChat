var app = require('express')();
//express initializes app to be a function handler that you can supply to an HTTP server
var http = require('http').Server(app);
var io = require("socket.io")(http);

app.get("/", function(req,res){
	res.sendFile(__dirname+"/index.html")
});
//define route handler '/' that gets called when we hit our website home

io.on('connection', function(socket){
  	console.log("a user connected");
  	socket.on('chat message', function(msg){
    	io.emit('chat message', msg);
    	console.log("message: " + msg);
  	});
  	socket.on('disconnect', function(){
		console.log("user disconnected");
	});
});


http.listen(3000, function(){
	console.log("listening on *:3000")
});
//http server listening on port 3000