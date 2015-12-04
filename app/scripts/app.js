// Ionic Starter App
'use strict'

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('GeoQuest', ['ionic', 'ui.router', 'ngCordova', 'ngAnimate', 'config']);

app.run(function($ionicPlatform, $state, $rootScope, $ionicLoading, $ionicModal, AuthModal) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    var externalUrl = window.localStorage.getItem('external_load');
    if (externalUrl) {
      var arr = externalUrl.split('_');
      var ns = arr[1];
      var room = arr[2];
      console.log('in app.run: ns', ns, 'room', room);
      window.localStorage.clear();
      $state.go('Map', {questId: ns, room: room});
    } else {
      $state.go('Home');
    }

  });

})

// this will show a loading modal during every http request.
// is this what we want? - this will be more obvious on the phone?
.config(function($httpProvider){
   $httpProvider.interceptors.push(function($rootScope) {
    return {
      request: function(config) {
        $rootScope.$broadcast('loading:show')
        return config
      },
      response: function(response) {
        $rootScope.$broadcast('loading:hide')
        return response;
      }
    }
  })
});
