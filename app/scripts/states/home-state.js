'use strict';

app.config(function($stateProvider){
  $stateProvider
  .state('Home', {
    url: '/',
    cache: false,
    templateUrl: 'templates/home.html',
    controller: 'HomeCtrl',
    resolve: {
      quests: function(QuestFactory) {
        return QuestFactory.getAllQuests();
      },
      startedQuests: function(StartedQuestFactory, Session) {
        if (Session.user) {
          console.log('resolving startedquests')
          return StartedQuestFactory.getStartedQuestsForUser(Session.user._id);
        }
      }
    }    
  });
});