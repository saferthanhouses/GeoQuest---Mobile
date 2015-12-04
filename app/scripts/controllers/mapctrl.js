'use strict'

app.controller('MapCtrl', function ($scope, $rootScope, $ionicModal, $ionicPlatform, MapFactory, $stateParams, $state, quest, SocketFactory, $cordovaGeolocation) {
    var questId = $stateParams.questId; // namespace is same as questId
    var room = $stateParams.room; // room Id was set when user entered 'Pergatory' state
    $scope.startedQuest = $stateParams.startedQuest;
    $scope.abandon = SocketFactory.abandon; // To disconnect sockets and go to 'Home' state

    // CONNECT SOCKETS
    $rootScope.$on('sockets connected', function(event, socketData) {
        $scope.mainSocket = socketData.socket;
        $scope.nsSocket = socketData.nsSocket;
        console.log('registering!!!!! socket', $scope.mainSocket, 'nsSocket', $scope.nsSocket);
        registerSocketListeners();
    });
    console.log('connecting sockets')
    SocketFactory.connectSockets(questId, room);

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
    $scope.fellows = [];

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
                $scope.nsSocket.emit('hereIAm', $scope.me.location);
                checkRegion()
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

















    // SOCKETS

    
    function registerSocketListeners() {
        // When a fellow arrives or moves
        $scope.nsSocket.on('fellowLocation', function(fellow) {
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
        $scope.nsSocket.on('death', function(id) {
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
        $scope.nsSocket.on('yourId', function(id) {
            console.log('my id is: ', id);
            $scope.me.id = id;
        });

        // When you first show up, so you know your fellows
        $scope.nsSocket.on('yourFellows', function (everyone) {
            for (var i=0; i< everyone.length; i++) {
                var newFellow = everyone[i];
                newFellow.marker = new L.marker(newFellow.location);
                $scope.map.addLayer(newFellow.marker);
                $scope.fellows.push(newFellow);
            }
        });
    }
    

});


