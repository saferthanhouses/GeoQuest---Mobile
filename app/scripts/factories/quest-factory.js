'use strict'

app.factory('QuestFactory', function($http, ENV, $cordovaGeolocation, $rootScope) {

	// Use this to get user's locaton from each quest's starting point
    function getDistanceFromLatLonInMi(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return d/1.60934 // convert to miles;
    }

    function deg2rad(deg) {
      return deg * (Math.PI/180)
    }

	return {

		getAllQuests: function() {
			return $http.get(ENV.apiEndpoint + 'api/quests/')
			.then(function(res) {
				return res.data;
			});
		},

		getOneQuest: function(questId){
			return $http.get(ENV.apiEndpoint + 'api/quests/' + questId)
			.then(function(res) {
				var quest = res.data;
				// map the quest with shapeObjects.
				quest.mapstates.map(function(state){ 
        			if (state.targetRegion.shapeObject) {
            			state.targetRegion.shapeObject = L.circle(state.targetRegion.locationPoints, state.targetRegion.radius)
        			}
        			return state;
   				});
		    	quest.regions.map(function(region){
		        	region.shapeObject = L.circle(region.locationPoints, region.radius);
		    	});

				return quest;
			})
		},

		sortQuestsByDistanceFromMe: function(quests) {
			return $cordovaGeolocation.getCurrentPosition()
	        .then(function (position) {
	          return [position.coords.latitude, position.coords.longitude];
	        })
	        .then(function(myLocation) {
	            quests.forEach(function(quest) {
	                var args = [myLocation[0], myLocation[1], quest.start[0], quest.start[1]];
	                quest.distFromMe = getDistanceFromLatLonInMi.apply(null, args);
	                quest.distFromMe = Math.round(quest.distFromMe * 100)/100;
	            });
	            quests.sort(function(a,b) {
	                return a.distFromMe - b.distFromMe;
	            });
	            $rootScope.$broadcast('sorted quests', quests); //OB/CZ: return a promise so you don't have to do this
	        })
	        .catch(function(err) {
	          console.log('Had a problem getting location: ' + err);
	        });
		}
	};

});