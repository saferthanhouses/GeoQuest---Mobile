'use strict';

app.config(function($stateProvider){
  $stateProvider
  .state('StartedQuests', {
    url: '/StartedQuests/:userId',
    cache: false,
    templateUrl: 'templates/startedquests.html',
    controller: 'StartedQuestCtrl',
    resolve: {
      startedQuests: function($stateParams, StartedQuestFactory) {
        return StartedQuestFactory.getStartedQuestsForUser($stateParams.userId);
      }
    }
  });
});