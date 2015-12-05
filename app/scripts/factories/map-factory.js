'use strict'

app.factory('MapFactory', function($cordovaGeolocation, GeoFactory) {

	// map factory holds the map, allows the map to be reloaded when 
	// the controller is reloaded
	var MapFactory = {};
	MapFactory.map = undefined;
	MapFactory.mapElem = 'map';

	MapFactory.reloadMap = function(){
		if (this.map){
			map.destroy();
		}
		
		return GeoFactory.getCurrentPosition()
			.then(function() { 
				MapFactory.generateMap()
				return MapFactory.map;
			})
	}

	MapFactory.generateMap = function() {
		MapFactory.map = L.map(MapFactory.mapElem, {zoomControl:false});
		console.log("GeoFactory.position", GeoFactory.position);
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
        this.map.fitBounds(bounds);
	}

	MapFactory.updateUserMarker = function() {
		if (!MapFactory.myMarker) MapFactory.addUserMarker();
        else MapFactory.myMarker.setLatLng(GeoFactory.position);
	}

	MapFactory.setupWatchEvents = function(){
		this.map.locate({
			setView: false,
			maxZoom: 20, 
            watch: true,
            enableHighAccuracy: true
        }) 
	}

	MapFactory.removeRegionLayer = function(){
		if(this.map.mapRegionLayer) {
            this.map.removeLayer(this.map.mapRegionLayer);
        }
	}

	MapFactory.addRegionLayer = function(region){
		this.map.mapRegionLayer = L.layerGroup(region);
        this.map.addLayer(this.map.mapRegionLayer);
	}

	MapFactory.stopWatch = function(){
		this.map.stopLocate();
	}

	MapFactory.addUserMarker = function(){
	    var meIcon = L.icon({
            iconUrl: 'http://icon-park.com/imagefiles/location_map_pin_red8.png',
            iconSize:     [38, 38], // size of the icon
            iconAnchor:   [19, 38], // point of the icon which will correspond to marker's location
            popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });
        //create new marker for my location
        this.myMarker = new L.marker(GeoFactory.position, {icon: meIcon});
        //add my location to map
        this.map.addLayer(this.myMarker);
    }

	return MapFactory;

});