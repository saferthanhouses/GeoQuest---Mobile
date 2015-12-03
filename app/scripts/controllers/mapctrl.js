'use strict'

app.controller('MapCtrl', function ($scope, $ionicModal, $ionicPlatform, MapFactory, $stateParams, $state, NavigationFactory, quest) {
    
    // QUEST VARIABLES
    console.log("resolved quest", quest)
    $scope.mapStates = {
        states: quest.mapstates,
        regions: quest.regions,
        startingState: this.states[0],
        endingState: this.states[this.states.length-1],
        currentStateIndex: 0
    };
    //used later to define the targetRegion which will be our trip wire for changing state
    var targetRegion;

    // USER VARIABLES 
    //object to contain current status of client
    $scope.me = {};
    $scope.fellows = [];


    // MAP
    $scope.map = MapFactory.generateMap(document.getElementById('map'));
    //object to contain arrays and other quest information - > to b pulled from db
    $scope.map.locate({
        setView: false, 
        maxZoom: 20, 
        watch: true,
        enableHighAccuracy: true
    })
    //currently visible regions on the map, in a single array of shape object
    $scope.map.mapRegionLayer;
    
    // fix the zoom - do we still need this?
    // $scope.map.on('zoomend', changeLocateZoom);
    // function changeLocateZoom(e){
    //   if ($scope.map._locateOptions){
    //     $scope.map._locateOptions.maxZoom = $scope.map.getZoom();
    //   }
    // }

    // $scope.map.whenReady(function(){
    //     $scope.startMapFunctions();
    // })


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
 
    $scope.map.on('locationfound', function (e) {
            //set user location
            $scope.me.location = e.latlng;
            // user marker
            if (!$scope.myMarker) addUserMarker();
            else $scope.myMarker.setLatLng($scope.me.location);
            //emit notification to server (function defined in 'generateSocketListeners') //possibly send $scope.me
            $scope.nsSocket.emit('hereIAm', $scope.me.location);
    }

    // EXECUTION LOOP
    $scope.startMapFunctions = function () {
        //this runs at each location found event from the client
        $scope.map.on('locationfound', function (e) {
            $scope.me.location = e.latlng;
            //if no client marker exists, create new marker
            if (!$scope.myMarker) addUserMarker();
            else $scope.myMarker.setLatLng($scope.me.location);
            //emit notification to server (function defined in 'generateSocketListeners') //possibly send $scope.me
            $scope.nsSocket.emit('hereIAm', $scope.me.location);
            
            // target region is undefinedo n the first go-through
            // if the transition condition is not bound to a region, or the 

            // if there is a target region, this is not the first go around
            if ($scope.targetRegion) {
                console.log("$scope.targetRegion in conditional", $scope.targetRegion);
                if ($scope.targetRegion[0].shapeObject.getBounds().contains($scope.me.location)){
                    $scope.openMapStatus();
                }
            // if there isn't a targetRegion, there isn't a transition condition anyway ... ?
            } else {
                $scope.openMapStatus();
            }
            // console.log("targetRegion[0]", $scope.targetRegion[0]);
            //     // if the current state doesn't have a transition condition region ...
            // if((!$scope.mapStates.currentState.transitionCondition.region) || $scope.targetRegion[0].shapeObject.getBounds().contains($scope.me.location)) {
            //     // open up modal to client showing map status, notification triggers
            //     $scope.openMapStatus(); //needs to not move forward until the modal change
            //     //when you exit the modal udate the currentState
            // }
        })
    }
    $scope.$on('modal.hidden', function () {

        // increment to the next state - this is linear.
        $scope.mapStates.currentState = $scope.mapStates.states[$scope.mapStates.currentStateIndex + 1];
        $scope.mapStates.currentStateIndex ++;

        // to make a non-linear state-change, we could check to see which transition condition they are within 

        //find the next target region of the transition point for the next map state
        //?? there is a big chance this will not work at all, but...yolo
        //generate array of shape objects based on what should be visible
        var tempRegionArray = [];
        for (var i =0; i<$scope.mapStates.currentState.visibleRegions.length; i++) {
            for (var j=0; j<$scope.mapStates.regions.length; j++) {
                if($scope.mapStates.currentState.visibleRegions[i] === $scope.mapStates.regions[j]._id) {
                    console.log("$scope.mapStates.regions[j]", $scope.mapStates.regions[j])
                    tempRegionArray.push($scope.mapStates.regions[j].shapeObject)
                }
            }
        }

        console.log("tempRegionArray", tempRegionArray);

        //if the region layer exists, remove it
        if($scope.map.mapRegionLayer) {
            $scope.map.removeLayer($scope.map.mapRegionLayer);
        }
        
        $scope.targetRegion = _.filter($scope.mapStates.regions, {_id: $scope.mapStates.currentState.transitionCondition.region})

        console.log("targetRegion", $scope.targetRegion);

        // if there is a target region for this state...
        if ($scope.targetRegion) {
        //define new region layer from array of shape objects
            $scope.map.mapRegionLayer = L.layerGroup(tempRegionArray);
            //add layer to map
            console.log("mapRegionLayer", $scope.map.mapRegionLayer)
            $scope.map.addLayer($scope.map.mapRegionLayer);
            //set map view to include yourself and location
            console.log("$scope.convertToArr($scope.me.location)", convertToArr($scope.me.location))
            console.log("scope.targetRegion[0].location", $scope.targetRegion[0].location)
            var bounds = [[$scope.convertToArr($scope.me.location), $scope.targetRegion[0].location]];

            console.log("$scope.map", $scope.map);
            //end of redrawing map
        } else {
            // draw the map on yourself?
            console.log("no targetRegion")
        }
    })



    // modal stuff

    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal){
        $scope.modal = modal;
        // $scope.startMapFunctions()
    });

    // later will want to pass custom message into the modal
    $scope.openMapStatus = function() {
      // will be undefined if the modal hasn't had time to load
      $scope.modal.show();    
      UserNotificationFactory.notifyUser("new region entered!");
    };

    $scope.closeModal = function(){
      $scope.modal.hide();
    };


    // helper funcs

    function convertToArr = function(object) {
        var= [];
        for (var key in object) {
            if(object.hasOwnProperty(key)) {
                arr.push(object[key])
            }
        }
        return arr;
    };

















    // SOCKETS

    $scope.nsSocket = $stateParams.nsSocket;
    $scope.socket = $stateParams.socket;
    $scope.abandon = NavigationFactory.abandon;

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






})