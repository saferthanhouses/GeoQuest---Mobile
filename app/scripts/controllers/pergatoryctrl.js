'use strict'

app.controller('PergatoryCtrl', function($scope, $stateParams, $state, $cordovaContacts, $cordovaSms){
    var questId = $stateParams.questId; // Defined if came from home state
    $scope.chosenFellows = [];
    // These will be defined if the client got here via external link
    var ns = $stateParams.ns;
    var room = $stateParams.room;
    var nsSocket; // Assigned a value once server says it's cool to join a namespace

    // Registers method to send a text to each chosen contact, then go to map state. 
    var message; // Defined in socket listener
    var success = function () { console.log('Message sent successfully'); };
    var error = function (e) { console.log('Message Failed:' + e); };
    $('.send-text').click(function() {
        $scope.chosenFellows.forEach(function(fellowNumber) {
            $cordovaSms.send(fellowNumber, message, {}, success, error);
        });
        $scope.chosenFellows = []
        $state.go('Map', {nsSocket: nsSocket, socket: socket});
    });

    // Make form inline if window widens (should really be a directive)
    $(window).resize(function() {
        if ($(window).width() > 600) {
            $('form').addClass('form-inline');
        } else {
            $('form').removeClass('form-inline');
        }
    });

    // Make a general connection, then ask to connect to the namespace for this game using $scope.questId as namespace path.
    var socket = io.connect('https://damp-ocean-1851.herokuapp.com', {
        'sync disconnect on unload': true });
    socket.on('connect', function(){console.log('gottem');});

    // Connects to namespace when server says good to go, and asks to join room
    // If arrived via external link, room will be defined, and after joined room
    // will be sent to map state
    socket.on('setToJoinNs', function(questId) {
        var nsForSMS = questId;
        nsSocket = io.connect('https://damp-ocean-1851.herokuapp.com/' + questId);
        nsSocket.on('connect', function() {
            console.log('joined namespace ' + questId);
            // Register listener for confirmation that client is joined the room
            nsSocket.on('joinedRoom', function(roomData) {
                console.log('joined room ' + roomData.room);
                var roomForSMS = roomData.room;
                // Now that we have id's on scope, set the text message
                message = 'You have been invited on a GeoQuest! Follow this path to join: https://glacial-sands-1292.herokuapp.com/_' + nsForSMS + '_' + roomForSMS;
                // If client knew the room they wanted to join, they followed a link,
                // and thus should be taken to map state without choosing fellows
                if (!roomData.newRoom) $state.go('Map', {nsSocket: nsSocket, socket: socket});
            });
            // Request to join room (room will be null if they got here from home state)
            // If room is undefined, server will create a new room in the namespace for this quest
            nsSocket.emit('joinRoom', room);
        });
    }); 

    // Ask to join namespace. Use questId passed in if came from home state,
    // ns if came from external link
    var toEmit = (ns) ? ns : questId;
    socket.emit('joinNs', toEmit);

    // Parses array of contacts that plugin brings forth
    function onSuccess(contacts) {
        console.log('contact objects from phone!!!', contacts);
        var parsedContacts = [];
        contacts.forEach(function(contact) {
            if (contact.phoneNumbers) {
                contact.phoneNumbers.forEach(function(number) {
                    if (number.type === 'mobile') {
                        parsedContacts.push({
                            name: contact.displayName,
                            number: number.value
                        });
                    } 
                });
            }
        });
        // Remove doubles (don't know why there are doubles), and sort by name
        var numbers = [];
        var noDoubles = [];
        parsedContacts.filter(function(contact) {
            if (numbers.indexOf(contact.number.replace(/[^\w]/g,'')) < 0) noDoubles.push(contact);
            numbers.push(contact.number.replace(/[^\w]/g,''));
        });
        $scope.contacts = noDoubles.sort(function(a, b){
            if(a.name < b.name) return -1;
            if(a.name > b.name) return 1;
            return 0;
        });
        $scope.$digest();
    }
    // If plugin can't fetch contacts
    function onError(contactError) {
        console.log(contactError);
    }

    // find all contacts that have phone numbers, populate displayname and phoneNumbers
    var options      = new ContactFindOptions();
    options.multiple = true;
    options.desiredFields = ['phoneNumbers', 'displayName', 'name'];
    options.hasPhoneNumber = true;
    var fields       = ['displayName', 'phoneNumbers'];
    navigator.contacts.find(fields, onSuccess, onError, options);

    // When a contact is clicked, it's added to text queue and highlighted.
    // If already selected, it's spliced out of queue and ungighlighted.
    $(document).ready(function() {
        $('.contacts').on('click', '.contact', function() {
            var number = $(this).find('.number').html();
            var ind = $scope.chosenFellows.indexOf(number);
            if (ind < 0) {
                $scope.chosenFellows.push(number);
                $(this).addClass('chosen');
            } else {
                $scope.chosenFellows.splice(ind,1);
                $(this).removeClass('chosen');
            }
        });
    });

});