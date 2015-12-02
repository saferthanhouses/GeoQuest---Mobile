'use strict'

app.factory('NavigationFactory', function($state) {

	return {
		abandon: function(nsSocket) {
			console.log('ABANDONING!!!')
			$state.go('Home', {nsSocket: nsSocket});
		}
	};

});