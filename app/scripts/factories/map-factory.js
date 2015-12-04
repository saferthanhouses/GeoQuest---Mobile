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

			// disable auto rezoom on watch...
			map.on('zoomend', changeLocateZoom);
		    
		    function changeLocateZoom(e){
		      if ($scope.map._locateOptions){
		        $scope.map._locateOptions.maxZoom = $scope.map.getZoom();
		      }
		    }

		    return map;
		}
	};

});