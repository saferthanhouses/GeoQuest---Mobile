'use strict';

app.config(function($stateProvider){
  $stateProvider   
  .state('Map', {
       cache: false,
       url: '/map',
       controller: 'MapCtrl',
       templateUrl: 'templates/map.html',
       params: {
        room: null,
        quest: null,
        startedQuest: null,
        questId: null,
        myName: null
      },
      resolve: {
        quest: function($stateParams, QuestFactory) {
          if ($stateParams.questId) {
            return QuestFactory.getOneQuest($stateParams.questId);
          }
        }
      }
   });
});