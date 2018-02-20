/*
*	Japinder Sandhu
*	101021899
*	COMP2406 - Assignment 3
*	Due: March 20th, 2017
*
*/

//Load this function when the page initially loads
$(document).ready(function(){

	//Variable that saves the name of the user
	var userName = prompt("What's your name?")||"User";

	var socket = io(); //connect to the server that sent this page

	//Sends the intro path back to the server
	socket.on('connect', function(){
		socket.emit("intro", userName);
	});

	//Declare the array to hold the blocked users
	var blockedUsersArr = [];

	//Responds with the message that is to be sent to the server
	$('#inputText').keypress(function(ev){
			if(ev.which===13){
				//send message
				socket.emit("message",$(this).val());
				ev.preventDefault(); //if any
				$("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
				$(this).val(""); //empty the input
			}
	});

	//Path for recieveing private Messages
	socket.on("privateMessage", function(data){
		//Display the message
		var sentMsg = alert("Message from "+data.name+": "+data.message);

		//Prompt for a reply to the message recieved
		var pMsg = prompt("What is your reply to "+data.name+": ");

		//Creates the message object, which includes the user sending the message's name and the message
		var pMsgObj = {
			name:data.name,
			message:pMsgs
		}

		//If there was a reply to the private message, send it
		if(pMsg){
			console.log(pMsgObj);
			socket.emit("privateMessage", pMsgObj);
		}
	});


	//Sends the data/message to the screen
	socket.on("message",function(data){
		$("#chatLog").append(data+"\n");
		$('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
	});

	//Path for user related aspects
	socket.on("userList", function(data){
		var list = $("#userList").empty();
		list.html("");
		console.log(data);

		//Creates the list of users on the right side of the screen, also handles blocked users
		for (var i in data.users){

			//Checks if the user is blocked, returns a value
			var blockedUser = blockedUsersArr.indexOf(data.users[i]);

			//Adds the user to the list, if the user is blocked adds some css to their name
			if (blockedUser !==-1){
				list.append("<li class ='block'>" + data.users[i] + "</li>");
			}
			else{
				list.append("<li>" + data.users[i] + "</li>");
			}
		}

		//Path for when a double click occurs a users name
		$("li").dblclick(function (event) {

			//If the shift key is held while double clicking
			if(event.shiftKey){

				//Checks if the user is blocked, returns a value
				var blockedUser = blockedUsersArr.indexOf($(this).text());

				if($(this).text() === userName) {
					alert("You can't block yourself!");
				}
				else{

					//Handles a blocked user event
					socket.emit("blockUser", {name: $(this).text()});

					//If the user is already blocked then unblock them
					if(blockedUser !== -1){
						blockedUsersArr.splice(blockedUser, 0, $(this).text());
						$(this).css("text-decoration", "none");
					}

					//Block the user
					else{
						blockedUsersArr.push($(this).text());
						$(this).css("text-decoration", "line-through");
					}
				}
			}
			else{

				pMsg = "";

				if($(this).text() === userName) {
					alert("You can't send a private message to yourself!");
				}
				else{

					//Loops through until the user enters a message
					do
					{
						 pMsg = prompt("What is your private message to "+$(this).text()+": ");

						if (pMsg===""){
							alert("Don't leave the private message blank!, Enter a message!");
						}

						//Creates the message object, which includes the recievers user name and the message
						if(pMsg){
							var pMsgObj = {
								name:$(this).text(),
								message:pMsg
							}
						}

					}while (pMsg === "");


					//Print the object
					console.log(pMsgObj);

					//Send the object to the server with the private Message path
					socket.emit("privateMessage", pMsgObj);
				}
			}
		});
	});
});
