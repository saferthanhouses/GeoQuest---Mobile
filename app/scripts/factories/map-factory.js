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
    });

	MapFactory.reloadMap = function(){
		if (this.map){
			this.map.destroy();
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
		console.log('fitting bounds');
	 	var usr = L.latLng(GeoFactory.position);
        var target = L.latLng(target[0], target[1]);
        var bounds = L.latLngBounds(usr, target);
        this.map.fitBounds(bounds);
	}

	MapFactory.updateUserMarker = function() {
		console.log('updating user marker');
		if (!MapFactory.myMarker) MapFactory.addUserMarker();
        else MapFactory.myMarker.setLatLng(GeoFactory.position);
	};

	MapFactory.updateFellowMarkers = function(fellowArr) {
		this.fellowMarkers.forEach(function(marker) {
			this.map.removeLayer(marker);
		});
		this.fellowMarkers = [];
		fellowArr.forEach(function(fellow) {
			var marker = new L.marker(fellow.location, {icon: fellowIcon});
			this.map.addLayer(marker);
			this.fellowMarkers.push(marker);
		});
	};

	MapFactory.setupWatchEvents = function(){
		this.map.locate({
			setView: false,
			maxZoom: 20, 
            watch: true,
            enableHighAccuracy: true
        }) ;
	};

	MapFactory.removeTargetCircle = function(){
		if(this.targetCirle) this.targetCirle.revoveFrom(this.map);
	};

	MapFactory.addTargetCircle = function(coords, radius){
		this.targetCirle = L.circle(coords, radius, {
			color: 'blue',
			fillColor: '#f03',
			fillOpacity: 0.5
		}).addTo(this.map);
		console.log('adding target circle', this.targetCirle);
	};

	MapFactory.stopWatch = function(){
		this.map.stopLocate();
	};

	MapFactory.addUserMarker = function(){
	    var meIcon = L.icon({
            iconUrl: 'http://icon-park.com/imagefiles/location_map_pin_red8.png',
            iconSize:     [38, 38], // size of the icon
            iconAnchor:   [19, 38], // point of the icon which will correspond to marker's location
            popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });
        //create new marker for my location and add it to map
        this.myMarker = new L.marker(GeoFactory.position, {icon: meIcon}).addTo(this.map);
    };

	return MapFactory;

});