'use strict';

app.controller('StartedQuestCtrl', function($scope, startedQuests, Session, StartedQuestFactory, NavigationFactory) {
	console.log('morning');
	$scope.user = Session.user;
	console.log('USER', $scope.user)
	$scope.startedQuests = startedQuests;
	$scope.deleteStartedQuest = function(startedQuestId) {
		StartedQuestFactory.deleteStartedQuest(startedQuestId);
		$scope.startedQuests = StartedQuestFactory.fetchCache();
	} 
	$scope.abandon = NavigationFactory.abandon;
});

// make so new started quest is posted if there's a user and they send a text
