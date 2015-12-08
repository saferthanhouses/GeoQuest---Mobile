'use strict'

app.factory('QuestFactory', function($http, ENV, $cordovaGeolocation, $rootScope) {

    function deg2rad(deg) {
      return deg * (Math.PI/180)
    }

    var QuestFactory = {};

	// Use this to get user's locaton from each quest's starting point
    QuestFactory.getDistanceFromLatLonInMi = function(lat1,lon1,lat2,lon2) {
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
      return d/1.60934; // convert to miles;
    };

	QuestFactory.getAllQuests = function() {
		return $http.get(ENV.apiEndpoint + 'api/quests/')
		.then(function(res) {
			return res.data;
		});
	};

	QuestFactory.getOneQuest = function(questId){
		return $http.get(ENV.apiEndpoint + 'api/quests/' + questId)
		.then(function(res) {
			return res.data;
		});
	};

  QuestFactory.addReview = function(questId, review){
    return $http({
      method: 'PUT',
      url: ENV.apiEndpoint + 'api/quests/' + questId + '/review', review,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: { reviewToAdd: review }      
    })
  }

	QuestFactory.sortQuestsByDistanceFromMe = function(quests) {
		return $cordovaGeolocation.getCurrentPosition()
        .then(function (position) {
          return [position.coords.latitude, position.coords.longitude];
        })
        .then(function(myLocation) {
            quests.forEach(function(quest) {
                var args = [myLocation[0], myLocation[1], quest.start[0], quest.start[1]];
                quest.distFromMe = QuestFactory.getDistanceFromLatLonInMi.apply(null, args);
                quest.distFromMe = Math.round(quest.distFromMe * 100)/100;
            });
            quests.sort(function(a,b) {
                return a.distFromMe - b.distFromMe;
            });
            return quests;
        })
        .catch(function(err) {
          console.log('Had a problem getting location: ' + err);
        });
	};

  QuestFactory.shuffle = function(array) {
      var currentIndex = array.length, temporaryValue, randomIndex ;
      // While there remain elements to shuffle...
      while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
      return array;
    }

	return QuestFactory;

});