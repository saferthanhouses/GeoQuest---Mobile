'use strict'

app.factory('NavigationFactory', function($state) {

	return {
		abandon: function(nsSocket, socket) {
			console.log('ABNDONING!!!')
			nsSocket.disconnect();
			socket.disconnect();
			$state.go('Home');
		}
	};

});