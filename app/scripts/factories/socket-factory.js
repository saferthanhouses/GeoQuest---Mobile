'use strict'

app.factory('SocketFactory', function($rootScope, $state, ENV) {

	return {
		connectSockets: function(questId, room) {
			// 1. Make a general connection.
			// 2. Ask to connect to the namespace for this quest using questId as namespace path
			// 3. Ask to join room
		    // 4. Emit sockets back to MapCtrl
		    var socket = io.connect(ENV.apiEndpoint, {'forceNew': true, 'sync disconnect on unload': true });
		    // Register listener for 'ok' to join specified namespace
		    socket.on('setToJoinNs', function(questId) {
		        var nsSocket = io.connect(ENV.apiEndpoint + questId);
		        nsSocket.on('connect', function() {
		            // Register listener for confirmation that client is joined the room
		            nsSocket.on('joinedRoom', function(roomId) {
		            	$rootScope.$broadcast('sockets connected', {socket: socket, nsSocket: nsSocket});
		            });
		            // Request to join room
		            nsSocket.emit('joinRoom', room);
		        });
		    }); 
		    // Request to join specified namespace (for a certain quest)
		    socket.emit('joinNs', questId);
		},

		// When you first show up, you are told who's already there. 
		yourFellows: function(eventData) {
			return eventData.fellows;
		},

		// Any time a fellow moves or a new one appears
		fellowLocation: function(eventData, fellowArr, myId) {
			var fellow = eventData.fellow;
            if (fellow.id === myId) return fellowArr;
            for (var i = 0; i < fellowArr.length; i++) {
                if(fellow.id === fellowArr[i].id) {
                    fellowArr[i].location = fellow.location;
                    fellowArr[i].currentStepIndex = fellow.currentStepIndex;
                    return fellowArr;
                }
            }
            // If not already have them, include them. 
            fellowArr.push(fellow);
            return fellowArr;
		},

		// When a fellow leaves the game
		death: function(eventData, fellowArr) {
			var newFellowArr = fellowArr.filter(function(fellow) {
				return fellow.id !== eventData.deathId;
			});
			return newFellowArr;
		},

		// Disconnect from quest and go to 'Home' state
		abandon: function(nsSocket, socket) {
			if (nsSocket) nsSocket.disconnect();
			if (socket) socket.disconnect();
			$state.go('Home');
		}
	};

});

