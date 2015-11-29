'use strict'

angular.module('GeoQuest.controllers', [])

.controller('MapCtrl', function ($scope, $ionicModal, $cordovaLocalNotification, $ionicPlatform, $cordovaVibration, MapFactory, $stateParams) {
    var nsSocket = $stateParams.nsSocket;
    console.log('passed Sockect', nsSocket);

    // When a fellow arrives or moves
    nsSocket.on('fellowLocation', function(fellow) {
        console.log('fellow location', fellow);
        if (fellow.id === $scope.me.id) return;
        for (var i=0; i<$scope.fellows.length; i++) {
            if(fellow.id === $scope.fellows[i].id) {
                $scope.fellows[i].location = fellow.location;
                $scope.fellows[i].marker.setLatLng($scope.fellows[i].location);
                return;
            }
        }
        var newFellow = fellow;
        newFellow.marker = new L.marker(newFellow.location);
        $scope.map.addLayer(newFellow.marker);
        $scope.fellows.push(newFellow);
    });

    // When a fellow leaves
    nsSocket.on('death', function(id) {
        var index;
        for (var i=0; i< $scope.fellows.length; i++) {
            if($scope.fellows[i].id === id) {
                $scope.map.removeLayer($scope.fellows[i].marker);
                index = i;
            }
        }
        $scope.fellows.splice(index,1);
    });

    // When you first show up, so you can tell who you are relative to your fellows
    nsSocket.on('yourId', function(id) {
        console.log('my id is: ', id);
        $scope.me.id = id;
    });

    // When you first show up, so you know your fellows
    nsSocket.on('yourFellows', function (everyone) {
        for (var i=0; i< everyone.length; i++) {
            var newFellow = everyone[i];
            newFellow.marker = new L.marker(newFellow.location);
            $scope.map.addLayer(newFellow.marker);
            $scope.fellows.push(newFellow);
        }
    });

    $scope.map = MapFactory.generateMap(document.getElementById('map'));

 
    //object to contain current status of client
    $scope.me = {};
    $scope.me.currentRegion;
    $scope.me.regionsVisited = [];
    $scope.me.regionsVisible = []
    //object to contain shapes data
    $scope.shapes = {};
    //array containing information of others
    $scope.fellows = [];
    $scope.map.mapRegionLayer;

    $scope.shapes.polygon1 = {
        shapeobject: L.polygon([
            [40.705156, -74.010013],
            [40.705280, -74.009059],
            [40.704871, -74.008855],
            [40.704570, -74.009466]
        ]),
        name: 'polygon1'
    }
    $scope.shapes.polygon2 = {
        shapeobject: L.polygon([
            [40.705305, -74.009000],
            [40.704910, -74.008836],
            [40.705364, -74.008118],
            [40.705378, -74.008287]
        ]),
        name: 'polygon2'
    }

    $scope.shapes.polygon3 = {
        shapeobject: L.polygon([
            [40.704521, -74.009407],
            [40.704997, -74.008557],
            [40.705473, -74.007921],
            [40.705176, -74.007465],
            [40.704132, -74.008971]
        ]),
        name: 'polygon3'
    }


    //locate yourself continually, but don't annoyingly change the zoom
    $scope.map.locate({
        setView: true, 
        maxZoom: 20, 
        watch: true,
        zoom: 16,
        enableHighAccuracy: true
    })

    $scope.map.on('zoomend', changeLocateZoom);

    function changeLocateZoom(e){
      if ($scope.map._locateOptions){
        $scope.map._locateOptions.maxZoom = $scope.map.getZoom();
      }
    }

    $scope.map.on('locationfound', function (e) {
        console.log("locationfound, accuracy:", e.accuracy);
        $scope.me.location = e.latlng;
        console.log('location found event');

        //if no client marker exists, create new marker
        if (!$scope.myMarker) {
            var meIcon = L.icon({
                iconUrl: 'http://icon-park.com/imagefiles/location_map_pin_red8.png',
                iconSize:     [38, 38], // size of the icon
                iconAnchor:   [19, 38], // point of the icon which will correspond to marker's location
                popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
            });
            //create new marker for my location
            $scope.myMarker = new L.marker($scope.me.location, {icon: meIcon});
            //add my location to map
            $scope.map.addLayer($scope.myMarker);
        } else {
            //otherwise take myMarker and update location
            $scope.myMarker.setLatLng($scope.me.location);
        }
        //emit notification to server (function defined in 'generateSocketListeners') //possibly send $scope.me
        nsSocket.emit('hereIAm', $scope.me.location);

        //generate region based on client location within bounds
        // if not in a region what to do?
        var newRegion = $scope.generateRegion($scope.me.location);

        //check to see if status has changed, if so, update
        if(!_.isEqual(newRegion, $scope.me.currentRegion)) {
            //if status properties are not equal we update
            $scope.me.currentRegion = newRegion;
            //check not already visited
            if (!_.any($scope.me.regionsVisited, $scope.me.currentRegion)) {
                console.log("you have already visited this region");
            //if not add location to locations visited
              $scope.me.regionsVisited.push($scope.me.currentRegion)
            }
            //make regions visible based on current and visited regions
            $scope.makeVisible ();

            // open up modal to client showing map status, notification triggers
            $scope.openMapStatus();
            
            //generate array of visible regions
            var tempRegionArray = [];
            for (var key in $scope.me.regionsVisible) {
                tempRegionArray.push($scope.me.regionsVisible[key].shapeobject);
            }
            //define layer group to visible region array, if it exists, remove it
            if($scope.map.mapRegionLayer) {
                $scope.map.removeLayer($scope.map.mapRegionLayer);
            }
            //define new region layer after removal from map
            $scope.map.mapRegionLayer = L.layerGroup(tempRegionArray);
            //add layer to map
            $scope.map.addLayer($scope.map.mapRegionLayer);
        }
    });
    //function to detect if within bounds of polygon 1
    $scope.generateRegion = function (point) {
        for (var key in $scope.shapes) {
            // what is this doing?
            if($scope.shapes[key].shapeobject.getBounds().contains(point)) {
                return $scope.shapes[key]
            }
        }
        // if not in a region will return undefined.
    }
    //function to update visibility of regions based on user location
    $scope.makeVisible = function () {
        //empty array if not alreay empty
        $scope.me.regionsVisible = []
        //make visible polygon1 always
        $scope.me.regionsVisible.push($scope.shapes.polygon1)
        
        //if currently within polygon1, make visible polygon2
        if($scope.me.currentRegion === $scope.shapes.polygon1) {
            $scope.me.regionsVisible.push($scope.shapes.polygon2)
        }
        // if currently in region2, show region 3
        if ($scope.me.currentRegion === $scope.shapes.polygon2){
          $scope.me.regionsVisible.push($scope.shapes.polygon3)
        }

        console.log("visible regions", $scope.me.regionsVisible);

        return;
    };


    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
          scope: $scope,
          animation: 'slide-in-up'
      }).then(function(modal){
          $scope.modal = modal;
    });

    // later will want to pass custom message into the modal
    $scope.openMapStatus = function() {
      // will be undefined if the modal hasn't had time to load
      $scope.modal.show();    
      notifyUser('new region entered!'); 
    };

    function notifyUser(message){
      $cordovaVibration.vibrate(200);
      $cordovaLocalNotification.add({
        id: 1,
        title: 'GeoQuest Alert!',
        text: message,
        data: {
          customProperty: 'custom value'
        }
      }).then(function(result){
        console.log(result);
      });
    }

    $scope.closeModal = function(){
      $scope.modal.hide();
    };

})

.controller('PergatoryCtrl', function($scope, $stateParams, $state, $cordovaContacts){
    $scope.gameId = $stateParams.gameId;
    $scope.chosenFellows = [];
    var nsSocket; // Assigned a value once server says it's cool to join a namespace

    function onSuccess(contacts) {
        var parsedContacts = [];
        contacts.forEach(function(contact) {
            if (contact.phoneNumbers) {
                contact.phoneNumbers.forEach(function(number) {
                    if (number.type === 'mobile') {
                        parsedContacts.push({
                            name: contact.displayName,
                            number: number.value
                        });
                    } 
                });
            }
        });
        $scope.contacts = parsedContacts;
        console.log('contacts', $scope.contacts);
    }

    function onError(contactError) {
        console.log(contactError);
    }

    // find all contacts with 'Bob' in any name field
    var options      = new ContactFindOptions();
    options.multiple = true;
    options.desiredFields = ['phoneNumbers', 'displayName', 'name'];
    options.hasPhoneNumber = true;
    var fields       = ['displayName', 'phoneNumbers'];
    navigator.contacts.find(fields, onSuccess, onError, options);

    // Make a general connection, then ask to connect to the namespace for this game using $scope.gameId as namespace path.
    var socket = io.connect('https://damp-ocean-1851.herokuapp.com');
    socket.on('connect', function(){console.log('gottem');});
    socket.emit('joinNs', $scope.gameId);

    // When a contact is clicked, it's added to text queue and highlighted.
    // If already selected, it's spliced out of queue and ungighlighted.
    $('.contact').on('click', function() {
        var number = $(this).find('.number').val();
        var ind = $scope.chosenFellows.indexOf(number);
        if (ind < 0) {
            $scope.chosenFellows.push(number);
            $(this).addClass('active');
        } else {
            $scope.chosenFellows.splice(ind,1);
            $(this).removeClass('active');
        }
    });

    // when click one, highlight as active and push into array
        // when click again, unhighlight and splice from array
    // When click 'invite', send text and go to 

    // When the server confirms the namespace exists, the client joins it.
    // Client is then asked to type in a code to join a game instance (room),
    // or to start a new game instance (create a new room).
    socket.on('setToJoinNs', function(gameId) {
        var roomId; // Might need this later for link to join a room
        nsSocket = io.connect('https://damp-ocean-1851.herokuapp.com/' + gameId);
        nsSocket.on('connect', function() {
            console.log('joined namespace ' + gameId);

            // Register listener for confirmation that client is joined the room
            nsSocket.on('joinedRoom', function(roomId) {
                console.log('joined room ' + roomId);
                // $state.go('Map', {nsSocket: nsSocket});
            });
            // Request to join room (may or may not specify Id based on how they get here)
            nsSocket.emit('joinRoom', roomId);
        });
    }); 
})

.controller('HomeCtrl', function($scope, $ionicPlatform, $cordovaGeolocation, games) {

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

})





