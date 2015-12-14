'use strict';

app.controller('TransitionCtrl', function($scope, $state, ClickFactory, $stateParams, $rootScope, $timeout, StartedQuestFactory, resolvedQuest) {
	// Use the resolvedQuest if we have it (came from link and didn't log in),
	// or else use the quest on $stateParams (came from 'Home', didn't log in)
	
	$scope.quest = resolvedQuest ? resolvedQuest : $stateParams.quest;
	// When user logs in, get them on scope and their startedQuests on scope
    $rootScope.$on('auth-login-success', function(event, user) {
      $scope.user = user;
    });
    $rootScope.$on('logout', function() {$scope.user = null;});
    $scope.isLoggedInUser = function() {
    	if ($scope.user) {
    		return true;
    	}
    	return false;
    };

    $('button').click(function() {
        var theButton = $(this);
        ClickFactory.buttonReact(theButton);
    });

	$scope.toMap = function(trailName) {
		$scope.trailName = trailName;
		// If logged in, create a startedQuest and go to 'Map' state with that. Map will use embedded quest object
		if ($scope.user) { 
            StartedQuestFactory.saveStartedQuestForUser($scope.user._id, $scope.quest, $stateParams.room)
            .then(function(startedQuest) {
                $state.go('Map', {
                	startedQuest: startedQuest, 
                	name: $scope.user.userName
                });
            });
		} else if ($scope.trailName) {
			$state.go('Map', {
				quest: $scope.quest,
				room: $stateParams.room, 
				name: $scope.trailName
			});
		} else {
			$scope.noName = true;
			$timeout(function() {
				$scope.noName = false;
			}, 2000);
		}
	};

});

