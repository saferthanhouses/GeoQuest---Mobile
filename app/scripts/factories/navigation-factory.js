'use strict'

app.factory('NavigationFactory', function($state, $ionicHistory) {

	return {
		abandon: function(nsSocket, socket) {
			console.log('ABANDONING!!!');
			if (nsSocket) nsSocket.disconnect();
			if (socket) socket.disconnect();
			$state.go('Home');
		}
	};

});