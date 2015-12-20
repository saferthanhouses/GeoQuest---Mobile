'use strict'

app.factory('QuestFactory', function($http, ENV, $cordovaGeolocation, $rootScope, $ionicLoading) {

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
      $ionicLoading.show({template: '<ion-spinner></ion-spinner>'})
  		return $http.get(ENV.apiEndpoint + 'api/quests/')
		.then(function(res) {
      $ionicLoading.hide()
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
    $ionicLoading.show({template: '<ion-spinner></ion-spinner>'})
    return $http.put(ENV.apiEndpoint + 'api/quests/' + questId + '/review', { reviewToAdd: review })
      .then(function() {
        $ionicLoading.hide();
      });  
  };

	QuestFactory.sortQuestsByDistanceFromMe = function(quests) {
    $ionicLoading.show('<ion-spinner></ion-spinner>');
		return $cordovaGeolocation.getCurrentPosition()
        .then(function (position) {
          $ionicLoading.hide();
          return [position.coords.latitude, position.coords.longitude];
        })
        .then(function(myLocation) {
            var withSteps = [];
            var withoutSteps = [];
            quests.forEach(function(quest) {
              if (quest.active && quest.questSteps[0] && quest.questSteps[0].targetCircle) withSteps.push(quest);
              else if (quest.active) withoutSteps.push(quest);
            });
            withSteps.forEach(function(quest) {
              var questStartLat = quest.questSteps[0].targetCircle.center[0];
              var questStartLon = quest.questSteps[0].targetCircle.center[1];
              var args = [myLocation[0], myLocation[1], questStartLat, questStartLon];
              quest.distFromMe = QuestFactory.getDistanceFromLatLonInMi.apply(null, args);
              quest.distFromMe = Math.round(quest.distFromMe * 100)/100;
            });
            withSteps.sort(function(a,b) {
                return a.distFromMe - b.distFromMe;
            });
            return withSteps.concat(withoutSteps);
        })
        .catch(function(err) {
          console.log('Had a problem getting location: ' + err);
        });
	};

  QuestFactory.shuffle = function(array) {
      var currentIndex = array.length, temporaryValue, randomIndex;
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
    };

	return QuestFactory;

});