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
          questId: null,
          startedQuest: null
        },
       resolve: {
          quest: function(QuestFactory, $stateParams){
            return QuestFactory.getOneQuest($stateParams.questId);
          }
       }
   });
});