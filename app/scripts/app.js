// Ionic Starter App
'use strict'

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('GeoQuest', ['ionic', 'ui.router', 'ngCordova', 'GeoQuest.controllers', 'GeoQuest.factories', 'ngAnimate'])

.run(function($ionicPlatform, $state, $rootScope, $ionicLoading) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    $state.go('Home');

  });

    $rootScope.$on('loading:show', function() {
      $ionicLoading.show({template: 'foo'})
    })

    $rootScope.$on('loading:hide', function() {
      $ionicLoading.hide()
    })

})

// this will show a loading modal during every http request.
// is this what we want? - this will be more obviouso n the phone?
.config(function($httpProvider){
   $httpProvider.interceptors.push(function($rootScope) {
    return {
      request: function(config) {
        $rootScope.$broadcast('loading:show')
        return config
      },
      response: function(response) {
        $rootScope.$broadcast('loading:hide')
        return response
      }
    }
  })
})

.config(function($stateProvider){
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
    })
    .state('Pergatory', {
      url: '/pergatory/:gameId',
      templateUrl: 'templates/pergatory.html',
      controller: 'PergatoryCtrl'
    })
    .state('Map', {
         url: '/map/:roomId',
         controller: 'MapCtrl',
         templateUrl: 'templates/map.html',
         params: {nsSocket: null}
     })
});
