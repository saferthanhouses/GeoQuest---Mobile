app.factory('GeoFactory', function($cordovaGeolocation){
	var GeoFactory = {
		self: this,
		watchers : [],
		position : [],
		options : {enableHighAccuracy: true, timeout: 10000},
		getCurrentPosition : function(){
			 return $cordovaGeolocation.getCurrentPosition(GeoFactory.options)
				.then(function(pos){
					GeoFactory.position = [pos.coords.latitude, pos.coords.longitude];						
					GeoFactory.accuracy = pos.coords.accuracy;
					return GeoFactory.position;
				}, function(error){
					console.error(error);
				});
		}
	};

	return GeoFactory;
});