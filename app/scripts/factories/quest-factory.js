'use strict';

app.factory('QuestFactory', function($http, ENV) {

	return {

		getAllQuests: function() {
			return $http.get(ENV.apiEndpoint + 'api/quests/')
			.then(function(res) {
				return res.data;
			});
		}
	};
});