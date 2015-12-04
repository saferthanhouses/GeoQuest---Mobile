'use strict'

app.factory('NavigationFactory', function($state) {

	return {
		abandon: function(nsSocket, socket) {
			if (nsSocket) nsSocket.disconnect();
			if (socket) socket.disconnect();
			$state.go('Home');
		}
	};

});