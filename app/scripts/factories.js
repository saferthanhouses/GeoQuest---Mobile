'use strict'

angular.module('GeoQuest.factories', [])

.factory('GamesFactory', function($http) {

	return {

		getAllGames: function() {
			return $http.get('https://damp-ocean-1851.herokuapp.com/api/games')
			.then(function(res) {
				return res.data;
			});
		}
	};
})

.factory('MapFactory', function() {

	return {
		generateMap: function(mapElem) {
			var map = L.map(mapElem);
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		        maxZoom: 18,
		        id: 'scotteggs.o7614jl2',
		        accessToken: 'pk.eyJ1Ijoic2NvdHRlZ2dzIiwiYSI6ImNpaDZoZzhmdjBjMDZ1cWo5aGcyaXlteTkifQ.LZe0-IBRQmZ0PkQBsYIliw'
		    }).addTo(map);
		    return map;
		}
	};

})