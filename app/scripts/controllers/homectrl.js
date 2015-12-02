'use strict'

app.controller('HomeCtrl', function($scope, $stateParams, $ionicPlatform, $cordovaGeolocation, games, $state) {
    $scope.home = true;
    // If client arrived by hitting nav button, there was a socket connection
    // The socket was passed here via $state.go. We disconnect them
    // since a new connection is made in 'Pergatory'.
    $scope.socket = $stateParams.nsSocket; 
    if ($scope.socket) {
      $scope.socket.disconnect();
    }

    // Easier to pass complex objects using $state.go than ui-sref
    $scope.toPergatory = function(gameId, socket) {
      $state.go('Pergatory', {questId: gameId, theSocket: socket});
    };

    // We will use this to calculate the user's distance from the starting pt of each game
    // and sort the games in order of ascending distance from where the user is
    function getDistanceFromLatLonInMi(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return d/1.60934 // convert to miles;
    }

    function deg2rad(deg) {
      return deg * (Math.PI/180)
    }

    $ionicPlatform.ready(function() {
        $cordovaGeolocation
        .getCurrentPosition()
        .then(function (position) {
          return [position.coords.latitude, position.coords.longitude];
        })
        .then(function(myLocation) {
            games.forEach(function(game) {
                var args = [myLocation[0], myLocation[1], game.start[0], game.start[1]];
                game.distFromMe = getDistanceFromLatLonInMi.apply(null, args);
                game.distFromMe = Math.round(game.distFromMe * 100)/100;
            });
            games.sort(function(a,b) {
                return a.distFromMe - b.distFromMe;
            });
            $scope.games = games;
        })
        .catch(function(err) {
          console.log('Had a problem getting location: ' + err);
        });
    });

});