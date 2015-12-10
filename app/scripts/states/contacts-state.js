'use strict';

app.config(function($stateProvider){
  $stateProvider
  .state('Contacts', {
    url: '/contacts',
    templateUrl: 'templates/contacts.html',
    controller: 'ContactsCtrl',
    params: {
      quest: null
    },
    cache: false
  });
});