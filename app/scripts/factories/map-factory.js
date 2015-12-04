'use strict'

app.factory('MapFactory', function() {

	return {
		generateMap: function(mapElem) {
			var map = L.map(mapElem, {zoomControl:false});

			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		        maxZoom: 18,
		        id: 'scotteggs.o7614jl2',
		        accessToken: 'pk.eyJ1Ijoic2NvdHRlZ2dzIiwiYSI6ImNpaDZoZzhmdjBjMDZ1cWo5aGcyaXlteTkifQ.LZe0-IBRQmZ0PkQBsYIliw'
		    }).addTo(map);

			// L.tileLayer( 'http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
			//     attribution: '&copy; <a href="http://osm.org/copyright" title="OpenStreetMap" target="_blank">OpenStreetMap</a> contributors | Tiles Courtesy of <a href="http://www.mapquest.com/" title="MapQuest" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" width="16" height="16">',
			//     subdomains: ['otile1','otile2','otile3','otile4']
			// }).addTo( map );

			// disable auto rezoom on watch...
			map.on('zoomend', changeLocateZoom);
		    
		    function changeLocateZoom(e){
		      if (map._locateOptions){
		        map._locateOptions.maxZoom = map.getZoom();
		      }
		    }

		    return map;
		}
	};

});