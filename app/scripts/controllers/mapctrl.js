'use strict'

app.controller('MapCtrl', function ($scope, $ionicModal, $ionicPlatform, MapFactory, $stateParams, $state, NavigationFactory, quest, $cordovaGeolocation) {

    
    // MAPSTATE VARIABLES
    $scope.mapStates = {
        states: quest.mapstates,
        regions: quest.regions,
    };

    $scope.mapStates.startingState =  $scope.mapStates.states[0],
    $scope.mapStates.endingState = $scope.mapStates.states[$scope.mapStates.states.length-1],
    $scope.mapStates.currentState = $scope.mapStates.states[0];
    $scope.mapStates.currentStateIndex = 0;
    $scope.mapStates.states.map(function(state){ 
        if (state.targetRegion.shapeObject) {
            state.targetRegion.shapeObject = L.circle(state.targetRegion.locationPoints, state.targetRegion.radius)
        }
        return state;
    })
    $scope.mapStates.regions.map(function(region){
        region.shapeObject = L.circle(region.locationPoints, region.radius);
    })

    console.log("$scope.mapStates", $scope.mapStates);
    var targetRegion;

    // USER VARIABLES 
    $scope.me = {};
    $scope.fellows = [];


    // MAP VARIABLES
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
            startWatchingUser();

            $scope.map.whenReady(function(){
                setLocationFoundFunctions()

            }, function(err){
                console.error(err);
            })
        })
    
    // fit bounds with one target of [lat, lng]
    function fitBounds(target){
         var usr = L.latLng($scope.me.location.lat, $scope.me.location.lng);
         var target = L.latLng(target[0], target[1]);
         var bounds = L.latLngBounds(usr, target);
         console.log(usr, target, bounds);
        $scope.map.fitBounds(bounds)
    }

    function startWatchingUser() {
        $scope.map.locate({
            setView: false, 
            maxZoom: 20, 
            watch: true,
            enableHighAccuracy: true
        })
    }

    function setLocationFoundFunctions(){
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
    // EXECUTION LOOP
    $scope.$on('modal.hidden', function () {
        // sequential now.
        goToNextState()
        
        //if the region layer exists, remove it
        if($scope.map.mapRegionLayer) {
            $scope.map.removeLayer($scope.map.mapRegionLayer);
        }

        // should be visible regions because this will never be the first state (assumption that all other states have VRs) 
        var visibleRegionsArray = getVisibleRegions();
        

        console.log("visibleRegionsArray", visibleRegionsArray)
        console.log("targetRegion.locationPoints", $scope.mapStates.currentState.targetRegion.locationPoints)
        // problems in these two parst.

        $scope.map.mapRegionLayer = L.layerGroup(visibleRegionsArray);
        $scope.map.addLayer($scope.map.mapRegionLayer);
        
        // bound the map...
        fitBounds($scope.mapStates.currentState.targetRegion.locationPoints);
    })

    function checkRegion () {
    // if inside the target region, or target region is undefined.
        // target region is undefinedo n the first go-through
        if ($scope.mapStates.currentState.targetRegion.shapeObject) {
            if ($scope.mapStates.currentState.targetRegion.shapeObject.getBounds().contains($scope.me.location)){
                if ($scope.mapStates.currentState.name == $scope.mapStates.endingState.name){
                    questEnd();
                }
                openModal();
            }
        // if there isn't a targetRegion.shapeObject, there isn't a target anyway ... 
        } else {
            openModal();
        }
    }

    // MAIN FUNCS
    function questEnd(){
        console.log("You have finished the quest");
    }


    function goToNextState() {
        $scope.mapStates.currentState = $scope.mapStates.states[$scope.mapStates.currentStateIndex + 1];
        $scope.mapStates.currentStateIndex ++;
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
 

    // // MODAL

    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal){
        $scope.modal = modal;
        // $scope.startMapFunctions()
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


    // // helper funcs

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