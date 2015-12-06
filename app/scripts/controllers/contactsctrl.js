'use strict'

app.controller('ContactsCtrl', function($scope, $rootScope, $stateParams, $state, $cordovaContacts, $cordovaSms, SocketFactory, AuthService, StartedQuestFactory, ContactsFactory){
    
    // Get contacts and put them on scope 
    ContactsFactory.getAndParseContacts()
    .then(function(contacts) {
        $scope.contacts = contacts;
    });

    // Get other necessary things on $scope
    $scope.quest = $stateParams.quest; // From user's choice in Home state
    $scope.room = Date.now(); // This will be the roomId that the user asks server to join
    AuthService.getLoggedInUser()
    .then(function(loggedInUser) {
        $scope.user = loggedInUser;
    });
    $scope.abandon = SocketFactory.abandon; // For going back to Home state
    $scope.chosenFellows = []; // Array gets populated as user selects contacts

    // Registers method to send a text to each chosen contact, then go to map state. 
    $scope.summonFellows = function() {
        ContactsFactory.summonFellows($scope.chosenFellows, $scope.quest._id, $scope.room);
        $scope.chosenFellows = [];
        $('.chosen').removeClass('chosen');
        // Save the quest instance as a startedQuest in the DB
        if ($scope.user) {
            StartedQuestFactory.saveStartedQuestForUser($scope.user._id, $scope.quest, $scope.room)
            .then(function(startedQuest) {
                $state.go('Map', {room: $scope.room, startedQuest: startedQuest});
            });
        } else {
            $state.go('Map', {quest: $scope.quest, room: $scope.room});        
        }
    };

    // When a contact is clicked, it's added to text queue and highlighted.
    // If already selected, it's spliced out of queue and ungighlighted.
    // SHOULD BE DONE IN ANGULAR
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

