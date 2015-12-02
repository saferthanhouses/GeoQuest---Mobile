'use strict'

app.factory('GamesFactory', function($http, ENV) {

	return {

		getAllGames: function() {
			return $http.get('https://damp-ocean-1851.herokuapp.com/api/games')
			.then(function(res) {
				return res.data;
			});
		}
	};
});