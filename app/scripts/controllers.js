'use strict'

angular.module('GeoQuest.controllers', [])

.controller('MapCtrl', function ($scope, $ionicModal, $cordovaLocalNotification, $ionicPlatform, $cordovaVibration, MapFactory, $stateParams) {
    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal){
        $scope.modal = modal;
        $scope.startMapFunctions()
    });


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
    //generate map object
    $scope.map = MapFactory.generateMap(document.getElementById('map'));
    //object to contain arrays and other quest information - > to b pulled from db
    $scope.mapStates = {
        states: [],
        regions: []
    }
    //array of states data - > to be pulled from db
    $scope.mapStates.states[0] = {
        name: 'mapOpen',
        visibleRegions: [],
        nextState: 'startingPoint',
        modal: {
            title: 'Welcome to the Brooklyn Bridge Tour',
            imageUrl: 'http://philhaberphotography.photoshelter.com/image/I0000CXCpZOo.6Kg',
            text: 'Head on over to the starting point to meet up with your group'
        },
        transitionCondition: {
            name: 'clientWithinRegion',
            region: 'any'
        }
    }
    $scope.mapStates.states[1] = {
        name: 'startingPoint',
        visibleRegions: ['startingPoint'],
        nextState: 'bridgeBegin',
        modal: {
            title: 'You have arrived at the beginning',
            imageUrl: 'http://philhaberphotography.photoshelter.com/image/I0000CXCpZOo.6Kg',
            text: 'Welcome to the bridge, wait here for your fellow questers to arrive. Take a quick look around, you\'re currently near city hall and the office of the Manhattan Borough President'
        },
        transitionCondition: {
            name: 'clientWithinRegion',
            region: 'startingPoint'
        }
    }
    $scope.mapStates.states[2] = {
        name: 'bridgeBegin',
        visibleRegions: ['bridgeBegin'],
        nextState: 'towerOne',
        modal: {
            title: 'You are now on the Bridge',
            imageUrl: 'http://philhaberphotography.photoshelter.com/image/I0000CXCpZOo.6Kg',
            text: 'You are now on the bridge, please do not fall off'
        },
        transitionCondition: {
            name: 'clientWithinRegion',
            region: 'bridgeBegin'
        }
    }
    $scope.mapStates.states[3] = {
        name: 'towerOne',
        visibleRegions: ['towerOne'],
        nextState: 'midway',
        modal: {
            title: 'Welcome to tower 1',
            imageUrl: 'http://philhaberphotography.photoshelter.com/image/I0000CXCpZOo.6Kg',
            text: 'People got the bends going down under the water to dig the foundation'
        },
        transitionCondition: {
            name: 'clientWithinRegion',
            region: 'towerOne'
        }
    }
    $scope.mapStates.states[4] = {
        name: 'midway',
        visibleRegions: ['midway'],
        nextState: 'towerTwo',
        modal: {
            title: 'Welcome to midway',
            imageUrl: 'http://philhaberphotography.photoshelter.com/image/I0000CXCpZOo.6Kg',
            text: 'the cables used to make this bridge are pretty long... we think.'
        },
        transitionCondition: {
            name: 'clientWithinRegion',
            region: 'midway'
        }
    }
    $scope.mapStates.states[5] = {
        name: 'towerTwo',
        visibleRegions: ['towerTwo'],
        nextState: 'bridgeEnd',
        modal: {
            title: 'Welcome to towerTwo',
            imageUrl: 'http://philhaberphotography.photoshelter.com/image/I0000CXCpZOo.6Kg',
            text: 'Tower two was easier to build than tower one. Trust me, it was.'
        },
        transitionCondition: {
            name: 'clientWithinRegion',
            region: 'towerTwo'
        }
    }
    $scope.mapStates.states[6] = {
        name: 'bridgeEnd',
        visibleRegions: ['bridgeEnd'],
        nextState: null,
        modal: {
            title: 'Welcome to the end of the bridge',
            imageUrl: 'http://philhaberphotography.photoshelter.com/image/I0000CXCpZOo.6Kg',
            text: 'You have just walked a pretty long ways. Take the stairs up and to the left to drop down into DUMBO'
        },
        transitionCondition: {
            name: 'clientWithinRegion',
            region: 'bridgeEnd'
        }
    }

    //define other properties of $scope.mapStates
    $scope.mapStates.startingState = $scope.mapStates.states[0];
    $scope.mapStates.endingState = $scope.mapStates.states[$scope.mapStates.states.length-1];
    $scope.mapStates.currentState = $scope.mapStates.startingState;

    //array of shapes data - > to be pulled from db
    $scope.mapStates.regions[0] = {
        shapeobject: L.circle([40.712655, -74.004928], 200),
        name: 'startingPoint',
        location: [40.712655, -74.004928],
        radius: 200 
    }
    $scope.mapStates.regions[1] = {
        shapeobject: L.circle([40.710884, -74.002919], 50),
        name: 'bridgeBegin',
        location: [40.710884, -74.002919],
        radius: 50
    }
    $scope.mapStates.regions[2] = {
        shapeobject: L.circle([40.707629, -73.998792], 50),
        name: 'towerOne',
        location: [40.707629, -73.998792],
        radius: 50
    }
    $scope.mapStates.regions[3] = {
        shapeobject: L.circle([40.706077, -73.996841], 50),
        name: 'midway',
        location: [40.706077, -73.996841],
        radius: 50
    }
    $scope.mapStates.regions[4] = {
        shapeobject: L.circle([40.704540, -73.994944], 50),
        name: 'towerTwo',
        location: [40.704540, -73.994944],
        radius: 50
    }
    $scope.mapStates.regions[5] = {
        shapeobject: L.circle([40.701132, -73.990630], 50),
        name: 'bridgeEnd',
        location: [40.701132, -73.990630],
        radius: 50
    }
    //object to contain current status of client
    $scope.me = {};
    // currently not using this
    $scope.me.regionsVisited = [];
    //information on others in the same quest room
    $scope.fellows = [];
    //currently visible regions on the map, in a single array of shape object
    $scope.map.mapRegionLayer;
    //used later to define the targetRegion which will be our trip wire for changing state
    var targetRegion;
    //locate yourself continually, but don't annoyingly change the zoom
    $scope.map.locate({
        setView: false, 
        maxZoom: 20, 
        watch: true,
        enableHighAccuracy: true
    })
    $scope.map.on('zoomend', changeLocateZoom);

    function changeLocateZoom(e){
      if ($scope.map._locateOptions){
        $scope.map._locateOptions.maxZoom = $scope.map.getZoom();
      }
    }
    //this only executes after we have the modal template loaded from file
    $scope.startMapFunctions = function () {
        //this runs at each location found event from the client
        $scope.map.on('locationfound', function (e) {
            console.log("locationfound, accuracy:", e.accuracy);
            $scope.me.location = e.latlng;
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
            
            if($scope.mapStates.currentState.transitionCondition.region === 'any' || targetRegion[0].shapeobject.getBounds().contains($scope.me.location)) {
                // open up modal to client showing map status, notification triggers
                $scope.openMapStatus(); //needs to not move forward until the modal change
                //when you exit the modal udate the currentState
            }
        })
    }
    $scope.$on('modal.hidden', function () {
        //loop through the states to see which is next, assign current state to the next state
        var nextState = $scope.mapStates.currentState.nextState
        for (var i = 0; i < $scope.mapStates.states.length; i ++) {
            if ($scope.mapStates.states[i].name === nextState) {
                $scope.mapStates.currentState = $scope.mapStates.states[i]
            }
        }
        //find the next target region of the transition point for the next map state
        //?? there is a big chance this will not work at all, but...yolo
        targetRegion = _.filter($scope.mapStates.regions, {name: $scope.mapStates.currentState.transitionCondition.region})
        console.log('targetRegion2', targetRegion)
        //generate array of shape objects based on what should be visible
        var tempRegionArray = [];
        for (var i =0; i<$scope.mapStates.currentState.visibleRegions.length; i++) {
            for (var j=0; j<$scope.mapStates.regions.length; j++)
                if($scope.mapStates.currentState.visibleRegions[i] === $scope.mapStates.regions[j].name)
                    tempRegionArray.push($scope.mapStates.regions[j].shapeobject)
        }
        //if the region layer exists, remove it
        if($scope.map.mapRegionLayer) {
            $scope.map.removeLayer($scope.map.mapRegionLayer);
        }
        //define new region layer from array of shape objects
        $scope.map.mapRegionLayer = L.layerGroup(tempRegionArray);
        //add layer to map
        $scope.map.addLayer($scope.map.mapRegionLayer);
        //set map view to include yourself and location
        $scope.map.fitBounds([$scope.convertToArr($scope.me.location), targetRegion[0].location])
        //end of redrawing map
    })
    // later will want to pass custom message into the modal
    $scope.openMapStatus = function() {
      // will be undefined if the modal hasn't had time to load
      $scope.modal.show();    
      // notifyUser('new region entered!'); 
    };
    $scope.convertToArr = function(object) {
        var arr = [];
        for (var key in object) {
            if(object.hasOwnProperty(key)) {
                arr.push(object[key])
            }
        }
        return arr;
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

.controller('PergatoryCtrl', function($scope, $stateParams, $state, $cordovaContacts, $cordovaSms){
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
        // Remove doubles (don't know why there are doubles), and sorting
        var numbers = [];
        var noDoubles = [];
        parsedContacts.filter(function(contact) {
            if (numbers.indexOf(contact.number.replace(/[^\w]/g,'')) < 0) noDoubles.push(contact);
            numbers.push(contact.number.replace(/[^\w]/g,''));
        });
        $scope.contacts = noDoubles.sort(function(a, b){
            if(a.name < b.name) return -1;
            if(a.name > b.name) return 1;
            return 0;
        });
        $scope.$digest();
    }

    function onError(contactError) {
        console.log(contactError);
    }

    // find all contacts with 'Bob' in any name field
    // var options      = new ContactFindOptions();
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
    $(document).ready(function() {
        $('.contacts').on('click', '.contact', function() {
            var number = $(this).find('.number').html();
            var ind = $scope.chosenFellows.indexOf(number);
            if (ind < 0) {
                $scope.chosenFellows.push(number);
                $(this).addClass('chosen');
            } else {
                $scope.chosenFellows.splice(ind,1);
                $(this).removeClass('chosen');
            }
        });
    });

    var message = 'Hello from GeoQuest!';

    var success = function () { console.log('Message sent successfully'); };
    var error = function (e) { console.log('Message Failed:' + e); };
    $('.send-text').click(function() {
        $scope.chosenFellows.forEach(function(fellowNumber) {
            $cordovaSms.send(fellowNumber, message, {}, success, error);
        });
        $state.go('Map', {nsSocket: nsSocket});
    });

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





