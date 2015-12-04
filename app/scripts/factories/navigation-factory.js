'use strict'

app.factory('NavigationFactory', function($state, $ionicHistory) {

	return {
		abandon: function(nsSocket) {
			console.log('ABANDONING!!!')
			$state.go('Home', {nsSocket: nsSocket}, {reload:true});
		}
	};

});