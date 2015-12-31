'use strict';

app.controller('StartedQuestCtrl', function($scope, $state, startedQuests, Session, StartedQuestFactory, SocketFactory, ClickFactory) {
	$scope.user = Session.user;
	$scope.startedQuests = startedQuests;

	$scope.deleteStartedQuest = function(startedQuestId) {
		StartedQuestFactory.deleteStartedQuest(startedQuestId)
		.then(function() {
			$scope.startedQuests = StartedQuestFactory.fetchCache();
			if (!$scope.startedQuests.length) $state.go('Home');
		});
	};

	$scope.toMapFromStartedQuests = function(startedQuest) {
		$state.go('Map', {
			startedQuest: startedQuest,
			name: $scope.user.userName
		});
	};

	$('button').click(function() {
      var theButton = $(this);
      ClickFactory.buttonReact(theButton);
    });

});