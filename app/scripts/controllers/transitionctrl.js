'use strict';

app.controller('TransitionCtrl', function($scope, $state, $stateParams, $rootScope, $timeout) {
	$scope.transitionState = true;

	// When user logs in, get them on scope and their startedQuests on scope
    $rootScope.$on('auth-login-success', function(event, user) {
      $scope.user = user;
    });
    $rootScope.$on('logout', function() {$scope.user = null;});
    $scope.isLoggedInUser = function() {
    	if ($scope.user) {
    		console.log('ther eis');
    		return true;
    	}
    	return false;
    };

	$scope.toMap = function(trailName) {
		$scope.trailName = trailName;
		if ($scope.user) $scope.name = $scope.user.userName;
		else if ($scope.trailName) $scope.name = $scope.trailName;

		if ($scope.name) {
			$state.go('Map', {
				quest: $stateParams.quest,
				questId: $stateParams.questId, 
				room: $stateParams.room, 
				name: $scope.name
			});
		} else {
			$scope.forgotName = true;
			$timeout(function() {
				$scope.forgotName = false;
			}, 2000);
		}
	};

});