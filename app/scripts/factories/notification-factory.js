'use strict'

app.factory('UserNotificationFactory', function($cordovaVibration, $cordovaLocalNotification){
	var factory = {
		notifyUser : function(message){
      		// $cordovaVibration.vibrate(200);
      		$cordovaLocalNotification.add({
        		id: 1,
        		title: 'GeoQuest Alert!',
        		text: message,
        		data: {
          			customProperty: 'custom value'
        		}
      		}).then(function(result){
        		console.log(result);
      		});
    	}
    };
    return factory;
});