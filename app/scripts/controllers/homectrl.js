'use strict'

app.controller('HomeCtrl', function($scope, $rootScope, $state, ClickFactory, $ionicPlatform, $location, quests, startedQuests, AuthService, QuestFactory, StartedQuestFactory) {
    
    // Get user's location, and sort in ascending order of distance from user
    $ionicPlatform.ready(function() {
      QuestFactory.sortQuestsByDistanceFromMe(quests)
      .then(function(sortedQuests) {
        $scope.quests = sortedQuests;
      });
    });

    $scope.toContacts = function(quest) {
      $state.go('Contacts', {quest: quest}, {reload: true});
    };

    // Set other $scope paramerters
    $scope.home = true;
    AuthService.getLoggedInUser()
    .then(function(loggedInUser) {
        $scope.user = loggedInUser;
    });
    $scope.startedQuests = startedQuests;

    // When user logs in, get them on scope and their startedQuests on scope
    $rootScope.$on('auth-login-success', function(event, user) {
      $scope.user = user;
      getStartedQuests($scope.user._id);
    });
    $rootScope.$on('logout', function() {$scope.user = null;});

    // Get user's startedQuests on $scope. Called when there's a login event fired.
    function getStartedQuests(userId) {
      StartedQuestFactory.getStartedQuestsForUser(userId)
      .then(function(startedQuests) {
        $scope.startedQuests = startedQuests;
      });
    }

    $('a').click(function() {
      var theLink = $(this);
      ClickFactory.linkReact(theLink);
    });

  
});


