'use strict';

app.config(function($stateProvider){
  $stateProvider
  .state('Contacts', {
    url: '/contacts/:questId',
    templateUrl: 'templates/pergatory.html',
    controller: 'ContactsCtrl',
    params: {
      questId: null,
      startedQuestId: null, 
    }
  });
});