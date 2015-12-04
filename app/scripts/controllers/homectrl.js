'use strict'

app.controller('HomeCtrl', function($scope, $rootScope, $stateParams, $ionicPlatform, $cordovaGeolocation, $state, quests, Session, StartedQuestFactory) {
    console.log('home')
    $scope.home = true;
    $scope.user = Session.user;
    console.log('ueer hehe', $scope.user);
    // When user logs in, get them on scope and their startedQuests on scope
    $rootScope.$on('auth-login-success', function(event, user) {
      $scope.user = user;
      $scope.getStartedQuests();
    });
    $scope.getStartedQuests = function() {
      if ($scope.user) {
        StartedQuestFactory.getStartedQuestsForUser($scope.user._id)
        .then(function(startedQuests) {
          $scope.startedQuests = startedQuests;
          console.log('got the quetsts')
        });
      }
    };
    $scope.getStartedQuests();

    $scope.viewStartedQuests = function(userId) {
      $state.go('StartedQuests', {userId: userId}, {reload: true});
    };

    // If client arrived by hitting 'back to quests' button, there was a socket connection
    // The socket was passed here via $state.go. We disconnect them
    // since a new connection will be made in 'Pergatory' state.
    $scope.socket = $stateParams.nsSocket; 
    if ($scope.socket) {
      $scope.socket.disconnect();
    }

    // Easier to pass complex objects using $state.go than ui-sref
    $scope.toPergatory = function(questId, socket) {
      $state.go('Pergatory', {questId: questId, theSocket: socket});
    };

    // We will use this to calculate the user's distance from the starting pt of each quest
    // and sort the quests in order of ascending distance from where the user is
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
            quests.forEach(function(quest) {
                var args = [myLocation[0], myLocation[1], quest.start[0], quest.start[1]];
                quest.distFromMe = getDistanceFromLatLonInMi.apply(null, args);
                quest.distFromMe = Math.round(quest.distFromMe * 100)/100;
            });
            quests.sort(function(a,b) {
                return a.distFromMe - b.distFromMe;
            });
            $scope.quests = quests;
        })
        .catch(function(err) {
          console.log('Had a problem getting location: ' + err);
        });
    });

});