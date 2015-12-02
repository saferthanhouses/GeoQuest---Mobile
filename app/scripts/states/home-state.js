'use strict';

app.config(function($stateProvider){
  $stateProvider
    .state('Home', {
      url: '/',
      templateUrl: 'templates/home.html',
      controller: 'HomeCtrl',
      resolve: {
        games: function(GamesFactory) {
          return GamesFactory.getAllGames();
        }
      }    
    });
});