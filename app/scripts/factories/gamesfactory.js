'use strict'

app.factory('GamesFactory', function($http, ENV) {

	return {

		getAllGames: function() {
			return $http.get(ENV.apiEndpoint + 'api/quests/')
			.then(function(res) {
				return res.data;
			});
		}
	};
});