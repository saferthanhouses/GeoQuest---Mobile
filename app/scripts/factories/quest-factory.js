'use strict'

app.factory('QuestFactory', function($http, ENV) {

	return {

		getAllQuests: function() {
			return $http.get(ENV.apiEndpoint + 'api/quests/')
			.then(function(res) {
				return res.data;
			});
		},

		getOneQuest: function(questId){
			return $http.get(ENV.apiEndpoint + 'api/quests/' + questId)
			.then(function(res) {
				return res.data;
			})
		}
	};
});