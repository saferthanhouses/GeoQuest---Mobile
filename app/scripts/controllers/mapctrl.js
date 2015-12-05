'use strict'

app.controller('MapCtrl', function ($scope, $rootScope, $ionicModal, MapFactory, $stateParams, GeoFactory, $state, quest, SocketFactory, $cordovaGeolocation) {
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

    // Set the map.
    MapFactory.reloadMap().then(function(){
        
        // linking the MapFactory with the game logic.
        MapFactory.map.on('locationfound', function (e) {
                //set user location
                GeoFactory.position = [e.latlng.lat, e.latlng.lng];
                // user marker
                MapFactory.updateUserMarker()           
                // TODO: socketService
                //emit notification to server (function defined in 'generateSocketListeners') //possibly send $scope.me
                $scope.nsSocket.emit('hereIAm', $scope.me.location);
                checkRegion()
        })
    })

    // modal is being closed moves to the next state
    $scope.$on('modal.hidden', function () {
        goToNextState() 
        // remove areas from map
        MapFactory.removeRegionLayer();
        // should be visible regions because this will never be the first state 
        // (assumption that all other states have VRs bc at least a target region. 
        var visibleRegionsArray = getVisibleRegions();
        MapFactory.addRegionLayer(visibleRegionsArray);
        // bound the map...
        MapFactory.fitBounds($scope.mapStates.currentState.targetRegion.locationPoints);
    })

    // how to call checkRegion?
    function checkRegion () {
        // all states have a target region, even ones without a true 'target', so check their shapeObject
        if ($scope.mapStates.currentState.targetRegion.shapeObject) {
            if ($scope.mapStates.currentState.targetRegion.shapeObject.getBounds().contains(GeoFactory.position)){
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
















    // JO: obviously needs to be adapted to use the MapFactory...
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


