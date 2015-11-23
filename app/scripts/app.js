// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('GeoQuest', ['ionic', 'ui.router', 'ngCordova', 'GeoQuest.controllers', 'ngAnimate'])

.run(function($ionicPlatform, $state) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider){
  $stateProvider
    .state('home', {
      url: '/',
      template: "this is the home"    
    })
    .state('map', {
         url: '/map',
         controller: 'MapCtrl',
         templateUrl: '/templates/map.html'
     })
});
