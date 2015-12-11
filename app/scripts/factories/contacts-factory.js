'use strict'

// This factory is for getting contacts from the user's phone
// and texting them the link to the quest
app.factory('ContactsFactory', function($cordovaContacts, $cordovaSms, $q, $ionicLoading) {

	// Success and error callbacks for sending the sms
	var success = function () { console.log('Message sent successfully');};
	var error = function (e) { console.log('Message Failed:' + e);};
  
	var removeDoublesAndSort = function(parsedContacts) {
		var numbers = [];
        var noDoubles = [];
        parsedContacts.filter(function(contact) {
            if (numbers.indexOf(contact.number.replace(/[^\w]/g,'')) < 0) noDoubles.push(contact);
            numbers.push(contact.number.replace(/[^\w]/g,''));
        });
        return noDoubles.sort(function(a, b){
            if(a.name < b.name) return -1;
            if(a.name > b.name) return 1;
            return 0;
        });
	};

    // Parses array of contacts that plugin brings forth
    var onSuccess = function(contacts) {
        $ionicLoading.hide();
        var parsedContacts = [];
        contacts.forEach(function(contact) {
            if (contact.phoneNumbers) {
                contact.phoneNumbers.forEach(function(number) {
                    if (number.type === 'mobile') {
                        if (ionic.Platform.isAndroid()) {
                            parsedContacts.push({
                                name: contact.displayName,
                                number: number.value
                            });
                        } else {
                            var parsedNumber = number.value.replace(/[\W]/g,'');
                            parsedNumber = parsedNumber.match(/^[0-9]*/)[0];
                            parsedContacts.push({
                                name: contact.name.givenName,
                                number: parsedNumber
                            });
                        }
                    } 
                });
            }
        });
        return removeDoublesAndSort(parsedContacts);
    };

	return {
		getAndParseContacts: function() {
		    // find all contacts that have phone numbers, populate displayname and phoneNumbers
            $ionicLoading.show({template: '<ion-spinner></ion-spinner>'})
		    var options = new ContactFindOptions();
		    options.multiple = true;
		    options.desiredFields = ['phoneNumbers', 'displayName', 'name'];
		    options.hasPhoneNumber = true;
		    var fields = ['displayName', 'phoneNumbers'];
		    // Return promise for processed and sorted contacts
		    return $q(function(resolve, reject) {
		    	navigator.contacts.find(fields, function(contacts){resolve(onSuccess(contacts))}, reject, options);
		    });
		},

		// Send each chosen fellow an sms with the link to the quest instance
	    summonFellows: function(chosenFellows, questId, room) {
            // $ionicLoading.show({template: '<ion-spinner></ion-spinner>'})            
	    	var message = 'You have been invited on a GeoQuest! Follow this path to join: https://glacial-sands-1292.herokuapp.com/?ns=' + questId + '&room=' + room;
	        chosenFellows.forEach(function(fellowNumber) {
	            $cordovaSms.send(fellowNumber, message, {}, success, error);
	        });      
	    }
	};

});



