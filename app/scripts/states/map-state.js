'use strict';

app.config(function($stateProvider){
  $stateProvider   
  .state('Map', {
       url: '/map',
       controller: 'MapCtrl',
       templateUrl: 'templates/map.html',
       params: {
          nsSocket: null,
          socket: null,
          questId: null
        },
       resolve: {
          quest: function(QuestFactory, $stateParams){
            return QuestFactory.getOneQuest($stateParams.questId)
          }
       }
   });
});