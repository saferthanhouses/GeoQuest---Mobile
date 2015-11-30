'use strict';

app.config(function($stateProvider){
  $stateProvider   
  .state('Map', {
       url: '/map',
       controller: 'MapCtrl',
       templateUrl: 'templates/map.html',
       params: {nsSocket: null}
   });
});