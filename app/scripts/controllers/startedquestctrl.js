'use strict';

app.controller('StartedQuestCtrl', function($scope, startedQuests, Session, StartedQuestFactory, SocketFactory) {
	$scope.user = Session.user;
	$scope.startedQuests = startedQuests;

	$scope.deleteStartedQuest = function(startedQuestId) {
		StartedQuestFactory.deleteStartedQuest(startedQuestId);
		$scope.startedQuests = StartedQuestFactory.fetchCache();
	};

	$scope.abandon = SocketFactory.abandon;
});