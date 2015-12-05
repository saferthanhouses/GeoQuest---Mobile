'use strict'

app.controller('MapCtrl', function ($scope, $rootScope, $ionicModal, $ionicPlatform, MapFactory, $stateParams, quest, SocketFactory, $cordovaGeolocation) {
    var questId = $stateParams.questId; // namespace is same as questId
    var room = $stateParams.room; // room Id was set when user entered 'Pergatory' state
    $scope.startedQuest = $stateParams.startedQuest;
    $scope.abandon = SocketFactory.abandon; // To disconnect sockets and go to 'Home' state

    // CONEECT SOCKETS AND REGISTER LISTENERS
    $rootScope.$on('sockets connected', function(event, theSockets) {
        $scope.mainSocket = theSockets.socket;
        $scope.nsSocket = theSockets.nsSocket;
        console.log('registering!!!!! socket', $scope.mainSocket, 'nsSocket', $scope.nsSocket);
        registerSocketListeners();
    });
    SocketFactory.connectSockets(questId, room);

    // Called when sockets are connected
    function registerSocketListeners() {
        // All fellow-related logic happend in the SocketsFactory
        $scope.nsSocket.on('fellowEvent', function(eventData) {
            console.log('fellowEvent', eventData);
            SocketFactory[eventData.callMethod](eventData, $scope.fellows);
        });
        // Also need a listener for when it's time to go to next step,
        // and for when a region in a step is knocked off
        // and for when a team makes progress 
    }

    // MAPSTATES
    $scope.mapStates = {
        states: quest.mapstates,
        regions: quest.regions,
    };

    $scope.mapStates.startingState =  $scope.mapStates.states[0],
    $scope.mapStates.endingState = $scope.mapStates.states[$scope.mapStates.states.length-1],
    $scope.mapStates.currentState = $scope.mapStates.states[0];
    $scope.mapStates.currentStateIndex = 0;

    // USER VARIABLES 
    $scope.me = {};
    // Comes from socket factory when user enters Map state
    $rootScope.$on('yourId', function(id) {
        $scope.me.id = id;
    });
    $scope.fellows = [];
    // Any time there's a 'fellowEvent' registered
    $rootScope.$on('fellows', function(fellowArr) {
        console.log('fellowEvent', fellowArr);
        $scope.fellows = fellowArr;
        // Call map function to delete previous markers and lay down new ones
    });

    // MAP INITIALISATION
    // get user position, set user on map, start watching --- kicks everything off.
    $cordovaGeolocation.getCurrentPosition({enableHighAccuracy: true, timeout: 10000})
        .then(function(pos){
            // generate the map
            $scope.map = MapFactory.generateMap('map');
            // need to set a position to start loading tileLayer
            $scope.me.location = [pos.coords.latitude, pos.coords.longitude];
            $scope.map.setView($scope.me.location, 15);
            // show user's position
            addUserMarker();
            // set the map watcher
            setupWatchEvents();
        })
    
    // fit bounds with one target of [lat, lng]
    function fitBounds(target){
         var usr = L.latLng($scope.me.location.lat, $scope.me.location.lng);
         var target = L.latLng(target[0], target[1]);
         var bounds = L.latLngBounds(usr, target);
        $scope.map.fitBounds(bounds)
    }

    function setupWatchEvents(){
        $scope.map.locate({
            setView: false, 
            maxZoom: 20, 
            watch: true,
            enableHighAccuracy: true
        })

        $scope.map.on('locationfound', function (e) {
                //set user location
                $scope.me.location = e.latlng;
                // user marker
                if (!$scope.myMarker) addUserMarker();
                else $scope.myMarker.setLatLng($scope.me.location);
                //emit notification to server (function defined in 'generateSocketListeners') //possibly send $scope.me
                if ($scope.snSocket) $scope.nsSocket.emit('hereIAm', $scope.me.location);
                console.log('I AM SAYING HERE I AM')
                checkRegion();
        })
    }

    // modal is being closed moves to the next state
    $scope.$on('modal.hidden', function () {
        goToNextState() 
        // remove areas from map
        if($scope.map.mapRegionLayer) {
            $scope.map.removeLayer($scope.map.mapRegionLayer);
        }
        // should be visible regions because this will never be the first state 
        // (assumption that all other states have VRs bc at least a target region. 
        var visibleRegionsArray = getVisibleRegions();
        $scope.map.mapRegionLayer = L.layerGroup(visibleRegionsArray);
        $scope.map.addLayer($scope.map.mapRegionLayer);
        // bound the map...
        fitBounds($scope.mapStates.currentState.targetRegion.locationPoints);
    })


    function checkRegion () {
        // all states have a target region, even ones without a true 'target', so check their shapeObject
        if ($scope.mapStates.currentState.targetRegion.shapeObject) {
            if ($scope.mapStates.currentState.targetRegion.shapeObject.getBounds().contains($scope.me.location)){
                // if the last state we might want to do something
                if ($scope.mapStates.currentState.name == $scope.mapStates.endingState.name){
                    questEnd();
                }
                // otherwise open the modal.
                openModal();
            }
        // if there isn't a targetRegion.shapeObject, there isn't a target, so move through the state by opening the modal ... 
        } else {
            openModal();
        }
    }

    // only one visible region currently - the target - kept the return as an array for future regions...
    function getVisibleRegions() {
        var tempRegionArray = [];
        for (var i =0; i<$scope.mapStates.currentState.visibleRegions.length; i++) {
            for (var j=0; j<$scope.mapStates.regions.length; j++) {
                if($scope.mapStates.currentState.visibleRegions[i] === $scope.mapStates.regions[j]._id) {
                    tempRegionArray.push($scope.mapStates.regions[j].shapeObject)
                }
            }
        }
        return tempRegionArray; 
    }


    function addUserMarker() {
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
    }
 
    function questEnd(){
        console.log("You have finished the quest");
    }

    function goToNextState() {
        $scope.mapStates.currentState = $scope.mapStates.states[$scope.mapStates.currentStateIndex + 1];
        $scope.mapStates.currentStateIndex ++;
    }


    // // MODAL

    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal){
        $scope.modal = modal;
    });

    // later will want to pass custom message into the modal
    function openModal() {
      // will be undefined if the modal hasn't had time to load
      $scope.modal.show();    
      // UserNotificationFactory.notifyUser("new region entered!");
    };

    $scope.closeModal = function(){
      $scope.modal.hide();
    };


    // helper funcs

    function convertToArr(object) {
        var arr = [];
        for (var key in object) {
            if(object.hasOwnProperty(key)) {
                arr.push(object[key])
            }
        }
        return arr;
    };


});


