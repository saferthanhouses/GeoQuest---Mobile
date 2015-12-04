'use strict'

app.controller('HomeCtrl', function($scope, $rootScope, $stateParams, $ionicPlatform, $state, quests, startedQuests, Session, QuestFactory, StartedQuestFactory) {
  console.log('back home'); // to insure controller is running again

    // Get user's location, and sort in ascending order of distance from user
    $ionicPlatform.ready(function() {
      QuestFactory.sortQuestsByDistanceFromMe(quests);
      $rootScope.$on('sorted quests', function(event, quests) {
        $scope.quests = quests;
      });
    });

    $scope.home = true;
    $scope.user = Session.user;
    $scope.startedQuests = startedQuests;

    // When user logs in, get them on scope and their startedQuests on scope
    $rootScope.$on('auth-login-success', function(event, user) {
      $scope.user = user;
      getStartedQuests($scope.user._id);
    });

    // Get user's startedQuests on $scope. Called when there's a login event fired.
    function getStartedQuests(userId) {
      StartedQuestFactory.getStartedQuestsForUser(userId)
      .then(function(startedQuests) {
        $scope.startedQuests = startedQuests;
      });
    }
        
});

