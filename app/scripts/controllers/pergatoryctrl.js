'use strict'

app.controller('PergatoryCtrl', function($scope, $rootScope, $stateParams, $state, $cordovaContacts, $cordovaSms, NavigationFactory, Session, StartedQuestFactory, ContactsFactory){
    // Receive contacts and put them on scope when factory gets them
    $rootScope.$on('contacts', function(event, contacts) {
        $scope.contacts = contacts;
        $scope.$digest();
    });
    ContactsFactory.getAndParseContacts();
    var questId = $stateParams.questId; // Defined if client came from home state
    console.log('questId', questId);
    $scope.user = Session.user;  // Get user on scope
    $scope.abandon = NavigationFactory.abandon;
    $scope.chosenFellows = [];

    // Make a general connection, then ask to connect to the namespace for this quest using $scope.questId as namespace path.
    $scope.socket = io.connect('https://damp-ocean-1851.herokuapp.com', {'forceNew': true, 'sync disconnect on unload': true });
    console.log('soooocket', $scope.socket)
    $scope.socket.on('connect', function(){console.log('gottem');});
    $scope.nsSocket; // Assigned a value once server says it's cool to join a namespace
    // Connects to namespace when server says good to go, and asks to join room
    // If arrived via external link, room will be defined, and after joined room
    // will be sent to map state
    $scope.socket.on('setToJoinNs', function(questId) {
        $scope.nsForSMS = questId;
        $scope.nsSocket = io.connect('https://damp-ocean-1851.herokuapp.com/' + questId);
        $scope.nsSocket.on('connect', function() {
            console.log('joined namespace ' + questId);
            // Register listener for confirmation that client is joined the room
            $scope.nsSocket.on('joinedRoom', function(roomData) {
                console.log('joined room ' + roomData.room);
                $scope.roomForSMS = roomData.room;
                // Now that we have id's on scope, set the text message
                message = 'You have been invited on a GeoQuest! Follow this path to join: https://glacial-sands-1292.herokuapp.com/_' + $scope.nsForSMS + '_' + $scope.roomForSMS;
                // If client knew the room they wanted to join, they followed a link,
                // and thus should be taken to map state without choosing fellows
                console.log("questId on redirect", questId)
                if (!roomData.newRoom) $state.go('Map', {nsSocket: $scope.nsSocket, socket: $scope.socket, questId: questId});
            });
            // Request to join room (room will be null if they got here from home state)
            // If room is undefined, server will create a new room in the namespace for this quest
            $scope.nsSocket.emit('joinRoom', room);
        });
    }); 
    $scope.socket.emit('joinNs', toEmit);

    // Registers method to send a text to each chosen contact, then go to map state. 
    var message; // Defined in socket listener
    $scope.summonFellows = function() {
        ContactsFactory.summonFellows($scope.chosenFellows, message);
        $('.chosen').removeClass('chosen');
        if ($scope.user) StartedQuestFactory.saveStartedQuestForUser($scope.user._id, $scope.nsForSms, $scope.roomForSMS);
        $state.go('Map', {nsSocket: $scope.nsSocket, socket: $scope.socket, questId: questId});        
    };

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

