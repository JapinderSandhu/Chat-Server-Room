/*
*	Japinder Sandhu
*	101021899
*	COMP2406 - Assignment 3
*	Due: March 20th, 2017
*
*/

/*SocketIO based chat room. Extended to not echo messages
to the client that sent them.*/

//Import all required elements
var http = require('http').createServer(handleRequest);
var io = require('socket.io')(http);
var fs = require('fs');
var mime = require('mime-types');
var url = require('url');
var ROOT = "./A3_Root";

//Open the server on port 2406
http.listen(2406);

//Post to console
console.log("Chat server listening on port 2406");

//Declare an empty array to hold all the clients
var clients = [];

function handleRequest(req,res){

	//Create the necesarry variables to read url's and filenames
	var urlObj = url.parse(req.url, true);
	var filename = ROOT+urlObj.pathname;

	fs.stat(filename, function (err, stats){

		//Try and open the file and handle the error, handle the error
		if(err){
			respondErr(err);
		}
		else{
			if(stats.isDirectory()){
				filename+="/index.html";
			}

			fs.readFile(filename, "utf8", function(err, data){
				if(err){
					respondErr(err);
				}
				else{
					respond(200, data);
				}
			});
		}
	});

	//Locally defined helper functions
	//Serves 404 files, takes nothing
	function serve404(){

		//Asynchronous
		fs.readFile(ROOT+"/404.html", "utf8", function(err, data){
			if(err){
				respond(500, err.message);
			}
			else{
				respond(404, data);
			}
		});
	}

	//Locally defined helper function
	//Takes an error, and outputs to the console
	function respondErr(err){

		console.log("Handling error: ", err);

		if(err.code === "ENOENT"){
			serve404();
		}
		else{
			respond(500, err.message);
		}
	}

	//Locally defined helper function
	//Sends off the response message, takes the data
	function respond(code, data){

		//Content header
		res.writeHead(code, {'content-type': mime.lookup(filename) || 'text/html'});

		//write message and signal communication is complete
		res.end(data);
	}
}; //End of handleRequest

//Socket path for when there is a connection
io.on("connection", function(socket){
	console.log("Got a connection");

	//Socket path for right when a user connects
	socket.on("intro",function(data){

		//Adds the username to each socket
		socket.username = data;

		//Adds the blocked list to each socket
		socket.blockedUsersArr = [];

		//Adds the socket to the clients array
		clients.push(socket);

		//Sends requests
		io.emit("userList", {'users' : getUserList()});
		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
		socket.emit("message","Welcome, "+socket.username+".");
	});

	//Socket path for when a private message is sent
	socket.on("privateMessage", function(data){

		//Declare the message object, contains the name of the reciever and the message itself
		var sentMessage = {
			name:socket.username,
			message:data.message
		};

		//Loop through the list of clients and send the message to the correct person
		for(var i=0; i<clients.length; i++){

			//Value to check if the user you are trying to send a message to has blocked you
			var blockedUser = (clients[i].blockedUsersArr.indexOf(socket.username));

			//Sends the private message if the reciever has not blocker current user
			if((clients[i].username === data.name && blockedUser === -1)){

				//Sends the message
				clients[i].emit("privateMessage", sentMessage);
				console.log(data.name+" got a private message: "+data.message);
			}
			else{
				console.log("Blocked, message was not sent");
			}
		}
	});

	//Socket path for when a message is sent
	socket.on("message", function(data){
		console.log("got message: "+data);
		socket.broadcast.emit("message",timestamp()+", "+socket.username+": "+data);
	});

	socket.on("blockUser", function(data){

		//Value to determine if the user should be blocked or not
		var blockedUser = socket.blockedUsersArr.indexOf(data.name);

		if (blockedUser !== -1){
			//Remove this user from the blocked list
			socket.blockedUsersArr.splice(blockedUser, 1);
			socket.emit("message", "Unblocked user: "+data.name);
		}
		else{
			//Add this user to the blocked list
			socket.blockedUsersArr.push(data.name);
			socket.emit("message", "Blocked user: "+data.name);
		}
	});

	//Socket path for when a user disconnects
	socket.on("disconnect", function(){
		console.log(socket.username+" disconnected");
		clients = clients.filter(function(ele){
			return ele!==socket;
		});
		io.emit("userList", {'users' : getUserList()});
		io.emit("message", timestamp()+": "+socket.username+" disconnected.");
	});


});

//Function that returns the array of client's usernames
function getUserList(){
    var ret = [];
    for(var i=0;i<clients.length;i++){
        ret.push(clients[i].username);
    }
    return ret;
}

//Function that returns the current time
function timestamp(){
	return new Date().toLocaleTimeString();
}
