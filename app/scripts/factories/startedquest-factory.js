'use strict'

// These methods are for keeping track of quest instances
// that users have initiated and not yet completed
app.factory('StartedQuestFactory', function($http, Session, ENV) {

	var startedQuestCache = [];

	return {
		// get all startedQuests for user
		getStartedQuestsForUser: function(userId) {
			return $http.get(ENV.apiEndpoint + 'api/users/' + userId + '/startedQuests/')
			.then(function(res) {
				var startedQuests = res.data;
				angular.copy(startedQuests, startedQuestCache);
				return startedQuestCache;
			});
		},
		// add started quest for a user. Called when user sends text
		saveStartedQuestForUser: function(userId, questId, roomId) {
			return $http.post(ENV.apiEndpoint + 'api/users/' + userId + '/startedQuests/', {quest: questId, room: roomId})
			.then(function(res) {
				var newStartedQuest = res.data;
				startedQuestCache.push(newStartedQuest);
				return newStartedQuest;
			});
		},
		// increment startedquest.currentMapState and delete if done
		nextMapState: function(startedQuestId) {
			return $http.put(ENV.apiEndpoint + 'api/startedQuests/' + startedQuestId)
			.then(function(res) {
				var updatedStartedQuest = res.data;
				for (var i = 0; i < startedQuestCache.length; i++) {
					if (startedQuestCache[i] === res.data._id) startedQuestCache[i] = updatedStartedQuest;
				}
				return updatedStartedQuest;
			});
		},
		// delete a started quest (called by user, or automatically when the quest instance is completed)
		deleteStartedQuest: function(startedQuestId) {
			startedQuestCache = startedQuestCache.filter(function(startedQuest) {
				return startedQuest._id !== startedQuestId;
			});
			return $http.delete(ENV.apiEndpoint + 'api/startedQuests/' + startedQuestId);
		},
		fetchCache: function() {
			return startedQuestCache;
		}
	};

});