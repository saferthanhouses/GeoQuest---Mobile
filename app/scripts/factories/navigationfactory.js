'use strict'

app.factory('NavigationFactory', function($state) {

	return {
		abandon: function(nsSocket) {
			console.log('ABNDONING!!!')
			nsSocket.disconnect();
			$state.go('Home');
		}
	};

});