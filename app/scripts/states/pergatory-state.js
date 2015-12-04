'use strict';

app.config(function($stateProvider){
  $stateProvider
  .state('Pergatory', {
    url: '/pergatory/:questId',
    templateUrl: 'templates/pergatory.html',
    controller: 'PergatoryCtrl',
    params: {
      questId: null
    }
  });
});