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
				var quest = res.data;
				// map the quest with shapeObjects.
				quest.mapstates.map(function(state){ 
        			if (state.targetRegion.shapeObject) {
            			state.targetRegion.shapeObject = L.circle(state.targetRegion.locationPoints, state.targetRegion.radius)
        			}
        			return state;
   				});
		    	quest.regions.map(function(region){
		        	region.shapeObject = L.circle(region.locationPoints, region.radius);
		    	});

				return quest;
			})
		}
	};
});