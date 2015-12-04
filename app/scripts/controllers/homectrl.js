'use strict'
//OB/CZ: do you need all these dependencies? remove the ones you don't need
app.controller('HomeCtrl', function($scope, $rootScope, $stateParams, $ionicPlatform, $state, quests, startedQuests, Session, QuestFactory, StartedQuestFactory) {

    // Get user's location, and sort in ascending order of distance from user
    $ionicPlatform.ready(function() {
      QuestFactory.sortQuestsByDistanceFromMe(quests);
      $rootScope.$on('sorted quests', function(event, quests) {
        $scope.quests = quests;
      });
    });

    // Set other $scope paramerters
    $scope.home = true;
    $scope.user = Session.user; //OB/CZ: AuthService.getLoggedInUser
    $scope.startedQuests = startedQuests;

    // When user logs in, get them on scope and their startedQuests on scope
    $rootScope.$on('auth-login-success', function(event, user) {
      $scope.user = user; //OB/CZ: resolve
      getStartedQuests($scope.user._id); //OB/CZ: resolve
    });

    // Get user's startedQuests on $scope. Called when there's a login event fired.
    function getStartedQuests(userId) {
      StartedQuestFactory.getStartedQuestsForUser(userId)
      .then(function(startedQuests) {
        $scope.startedQuests = startedQuests;
      });
    }
        
});

