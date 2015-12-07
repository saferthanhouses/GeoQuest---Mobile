'use strict'

app.factory('MapFactory', function($cordovaGeolocation, GeoFactory) {

	// map factory holds the map, allows the map to be reloaded when 
	// the controller is reloaded
	var MapFactory = {};
	MapFactory.map = undefined;
	MapFactory.mapElem = 'map';
	MapFactory.fellowMarkers = [];
	MapFactory.targetCirle;

	var fellowIcon = L.icon({
        iconUrl: 'http://2.bp.blogspot.com/-fQuA-G2XLw8/VX4TFzAtVeI/AAAAAAAAB-w/-MWtUdnzOAw/s1600/BlueDot64.png',
        iconSize:     [38, 38], // size of the icon
        iconAnchor:   [19, 38], // point of the icon which will correspond to marker's location
        popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
    	// iconSize: [10,10],
    	// IconAnchor: [5,5]
    	// popupAnchor: [0,0]
    });

	MapFactory.reloadMap = function(){
		if (MapFactory.map){
			console.log("inside map reload destroy map", MapFactory.map);
			if (MapFactory.targetCirle) MapFactory.removeTargetCircle();
			MapFactory.map.remove();
		}
		return GeoFactory.getCurrentPosition()
			.then(function() { 
				MapFactory.generateMap();
				return MapFactory.map;
			});
	};

	MapFactory.generateMap = function() {
		MapFactory.map = L.map(MapFactory.mapElem, {zoomControl:false});
		MapFactory.map.setView(GeoFactory.position, 15);
		MapFactory.addUserMarker();

		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
	        maxZoom: 18,
	        id: 'scotteggs.o7614jl2',
	        accessToken: 'pk.eyJ1Ijoic2NvdHRlZ2dzIiwiYSI6ImNpaDZoZzhmdjBjMDZ1cWo5aGcyaXlteTkifQ.LZe0-IBRQmZ0PkQBsYIliw'
	    }).addTo( MapFactory.map );

	    MapFactory.setupWatchEvents();
	 }

	MapFactory.fitBounds = function(target){
	 	var usr = L.latLng(GeoFactory.position);
        var target = L.latLng(target[0], target[1]);
        var bounds = L.latLngBounds(usr, target);
        MapFactory.map.fitBounds(bounds);
	};

	MapFactory.updateUserMarker = function() {
		if (!MapFactory.myMarker) MapFactory.addUserMarker();
        else MapFactory.myMarker.setLatLng(GeoFactory.position);
	};

	MapFactory.updateFellowMarkers = function(fellowArr) {
		MapFactory.fellowMarkers.forEach(function(marker) {
			MapFactory.map.removeLayer(marker);
		});
		MapFactory.fellowMarkers = [];
		fellowArr.forEach(function(fellow) {
			var marker = new L.marker(fellow.location, {icon: fellowIcon});
			MapFactory.map.addLayer(marker);
			MapFactory.fellowMarkers.push(marker);
		});
	};

	MapFactory.setupWatchEvents = function(){
		MapFactory.map.locate({
			setView: false,
			maxZoom: 20, 
            watch: true,
            enableHighAccuracy: true
        }) ;
	};

	MapFactory.removeTargetCircle = function(){
		if(MapFactory.targetCirle) {
			MapFactory.map.removeLayer(MapFactory.targetCirle);
		} 
	};

	MapFactory.addTargetCircle = function(coords, radius){
		MapFactory.targetCirle = L.circle(coords, radius, {
			color: '#2a9e56',
			fillColor: '#2a9e56',
			fillOpacity: 0.5
		}).addTo(MapFactory.map);
	};

	MapFactory.stopWatch = function(){
		MapFactory.map.stopLocate();
	};

	MapFactory.addUserMarker = function(){
	    var meIcon = L.icon({
            iconUrl: 'http://icon-park.com/imagefiles/location_map_pin_red8.png',
            iconSize:     [38, 38], // size of the icon
            iconAnchor:   [19, 38], // point of the icon which will correspond to marker's location
            popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });
        //create new marker for my location and add it to map
        MapFactory.myMarker = new L.marker(GeoFactory.position, {icon: meIcon}).addTo(MapFactory.map);
    };

	return MapFactory;

});