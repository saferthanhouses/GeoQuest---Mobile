
angular.module('GeoQuest.controllers', [])

.controller('MapCtrl', function ($scope, $ionicModal, $cordovaLocalNotification, $ionicPlatform, $cordovaVibration) {

    //main map object
    $scope.map = L.map('map');
    //object to contain current status of client
    $scope.me = {};
    $scope.me.currentRegion;
    $scope.me.regionsVisited = [];
    $scope.me.regionsVisible = []
    //object to contain shapes data
    $scope.shapes = {};
    //array containing information of others
    $scope.fellows = [];

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        maxZoom: 18,
        id: 'scotteggs.o7614jl2',
        accessToken: 'pk.eyJ1Ijoic2NvdHRlZ2dzIiwiYSI6ImNpaDZoZzhmdjBjMDZ1cWo5aGcyaXlteTkifQ.LZe0-IBRQmZ0PkQBsYIliw'
    }).addTo($scope.map);

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


    //locate and zoom map
    $scope.map.locate({
        setView: true, 
        maxZoom: 20, 
        watch: false,
        zoom: 16, 
        enableHighAccuracy: true
    });

    //locate yourself continually, but don't annoyingly change the zoom
    $scope.map.locate({
        setView: true, 
        maxZoom: 20, 
        watch: true,
        enableHighAccuracy: true
    });

    // TODO : - if location not in $scope.shapes
    //        - if location already in regionsVisited

    $scope.map.on('locationfound', function (e) {
        $scope.me.location = e.latlng;
        console.log('new location found')

        //if no client marker exists, create new marker
        if (!$scope.myMarker) {
            var meIcon = L.icon({
                iconUrl: 'http://icon-park.com/imagefiles/location_map_pin_red8.png',
                iconSize:     [38, 38], // size of the icon
                iconAnchor:   [19, 38], // point of the icon which will correspond to marker's location
                popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
            });
            $scope.myMarker = new L.marker($scope.me.location, {icon: meIcon});
            $scope.map.addLayer($scope.myMarker);
        } else {
            //otherwise take myMarker and update location
            $scope.myMarker.setLatLng($scope.me.location);
        }
        //emit notification to server //possibly send $scope.me
        socket.emit('hereIAm', $scope.me.location);

        //generate region based on client location within bounds
        var newRegion = $scope.generateRegion($scope.me.location)

        //check to see if status has changed, if so, update
        if(!_.isEqual(newRegion, $scope.me.currentRegion)) {
            //if status properties are not equal we update
            $scope.me.currentRegion = newRegion;
            //check not already visited
            if (!_.any($scope.me.regionsVisited, $scope.me.currentRegion)) {
            //add location to locations visited
              $scope.me.regionsVisited.push($scope.me.currentRegion)
            }
            //make regions visible based on current and visited regions
            $scope.makeVisible();

            // modal opening triggers notification.
            //open up modal to client showing map status
            $scope.openMapStatus();
            //redraw map based on regions set to true
            for (var key in $scope.me.regionsVisible) {

                $scope.me.regionsVisible[key].shapeobject.addTo($scope.map)
            }
            console.log($scope.me)   
        }

    });
    //function to detect if within bounds of polygon 1
    $scope.generateRegion = function (point) {
        for (var key in $scope.shapes) {
            if($scope.shapes[key] && $scope.shapes[key].shapeobject.getBounds().contains(point)) {
                console.log('region found')
                return $scope.shapes[key]
            }
        }
    }
    //function to update visibility of regions
    $scope.makeVisible = function () {
        //empty array if not alreay empty
        $scope.me.regionsVisible = []
        //make visible polygon1 always
        $scope.me.regionsVisible.push($scope.shapes.polygon1)
        
        //if currently within polygon1, make visible polygon2
        if($scope.me.currentRegion === $scope.shapes.polygon1) {
          console.log("you are within region 1")
            $scope.me.regionsVisible.push($scope.shapes.polygon2)
        }
        //if at any time you have visited polygon1, make visible polygon 3
        // if($scope.me.regionsVisited.indexOf($scope.shapes.polygon1) > -1) {
        //     $scope.me.regionsVisible.push($scope.shapes.polygon3)
        // }

        // TODO: delete regions from map on exit event

        // if currently in region2, show region 3
        if ($scope.me.currentRegion === $scope.shapes.polygon2){
          $scope.me.regionsVisible.push($scope.shapes.polygon3)
        }

        return;
    }


    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
          scope: $scope,
          animation: 'slide-in-up'
      }).then(function(modal){
          $scope.modal = modal;
    })

    // later will want to pass custom message into the modal
    $scope.openMapStatus = function() {
      $scope.modal.show();    
      notifyUser("new region entered!"); 
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
        console.log(result)
      })
    }


    $scope.closeModal = function(){
      $scope.modal.hide();
    }


    // When a fellow arrives or moves
    socket.on('fellowLocation', function(fellow) {
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
    socket.on('death', function(id) {
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
    socket.on('yourId', function(id) {
        $scope.me.id = id;
    });

    // When you first show up, so you know your fellows
    socket.on('yourFellows', function (everyone) {
        for (var i=0; i< everyone.length; i++) {
            var newFellow = everyone[i];
            newFellow.marker = new L.marker(newFellow.location);
            $scope.map.addLayer(newFellow.marker);
            $scope.fellows.push(newFellow);
        }
    });


})

.controller('MapStatusCtrl', function($scope){

})