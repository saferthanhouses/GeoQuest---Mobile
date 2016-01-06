'use strict'

app.controller('MapCtrl', function ($scope, $rootScope, $timeout, $ionicModal, MapFactory, ClickFactory, $stateParams, GeoFactory, SocketFactory, $cordovaGeolocation, QuestFactory, StartedQuestFactory, UserNotificationFactory) {
    // QUEST VARIABLES
    $scope.justStarting = true;
    $scope.shouldShowUisref = function() {
        return $scope.showUisref;
    };

    $scope.currentStepIndex = 0; 
    $scope.questNotOver = true;
    $scope.startedQuest = $stateParams.startedQuest;
    $scope.viewProgress = false; // ng-show for the progress view
    // If there's a startedQuest object, use the embedded quest as our quest object
    if ($scope.startedQuest) {  // Defined if creator was logged in when they went through 'Contacts' state
        $scope.quest = $scope.startedQuest.quest;
        var room = $scope.startedQuest.room;
        // If this starteQuest is partially finished, pick up where user left off
        if ($scope.startedQuest.currentStepIndex > 0) {
            $scope.currentStepIndex = $scope.startedQuest.currentStepIndex;
            $scope.justStarting = false;
        } 
    } else if ($stateParams.quest) { // if user did not log in at 'Transition' state
        $scope.quest = $stateParams.quest;
        var room = $stateParams.room;
    } 
    
    // If creator wants questSteps to be shuffled, shuffle them and save new order in startedQuest object
    if ($scope.justStarting && $scope.quest.shuffle) {
        $scope.quest.questSteps = QuestFactory.shuffle($scope.quest.questSteps);
        // Reset questStep order in startedQuest object in database
        if ($scope.startedQuest) {
            $scope.startedQuest.quest.questSteps = $scope.quest.questSteps;
            StartedQuestFactory.shuffleSteps($scope.startedQuest);
        }
    }
    $scope.steps = $scope.quest.questSteps;

    $scope.currentStep = $scope.steps[$scope.currentStepIndex];
    $scope.button = {};
    $scope.form ={};
    $scope.form.answer = "";
    $scope.wins = {};
    var alreadyWon = false;

    $scope.review = {};

    // lame modal variables
    $scope.modalIsOpen = false;
    $scope.mainModalHidden = false;
    var openedWinModal = false;

    // USER VARIABLES 
    $scope.me = {name: $stateParams.name, color: getRandomColor()};
    $scope.fellows = [];
    
    // For progress tracking
    $scope.getPercentage = function(stepIndex) {
        var percentage = (stepIndex / $scope.steps.length) * 100;
        return percentage + '%';
    };

    // CONNECT SOCKETS AND REGISTER LISTENERS
    $scope.abandon = SocketFactory.abandon; // To disconnect sockets and go to 'Home' state
    $rootScope.$on('sockets connected', function(event, theSockets) {
        $scope.mainSocket = theSockets.socket;
        $scope.nsSocket = theSockets.nsSocket;
        registerSocketListeners();
    });
    var room = $stateParams.startedQuest ? $stateParams.startedQuest.room : $stateParams.room;
    SocketFactory.connectSockets($scope.quest._id, room);
    console.log('connecting sockets questId', $scope.quest._id, 'roomId', room);

    function registerSocketListeners() {
        // So client can differentiate itself from others
        $scope.nsSocket.on('yourId', function(id) {
            $scope.me.id = id;
        });
        // All fellow-related logic happens in the SocketsFactory, and a new fellows array is returned
        $scope.nsSocket.on('fellowEvent', function(eventData) {
            if (eventData.callMethod === 'fellowLocation') {

                if (!$scope.wins.winner) checkWinner(eventData.fellow);
                $scope.fellows = SocketFactory[eventData.callMethod](eventData, $scope.fellows, $scope.me.id);
                MapFactory.updateFellowMarkers($scope.fellows);
                $scope.$digest();
            } else if (eventData.callMethod === 'fellowMessage') {
                // if (messageData.name!==$scope.me.name){
                    console.log("fellowMessage EventHeard in fellowEvent", eventData);
                var name = eventData.messageData.name, color = eventData.messageData.color, message = eventData.messageData.message;
                // var a = [name, color, message];
                // a.forEach(function(elt){ 

                printChatMessage(name, color, message);
            // }
            }
        });
        $scope.nsSocket.on('disconnect', function(){
            console.log("disconnected");
            console.log(this);
        })
        $scope.nsSocket.on('fellowMessage', function(messageData){
            console.log("heardFellowMessageEvent", messageData);
            // how to pass in the name and the colour?
            // uncomment when testing non-locally
            if (messageData.name!==$scope.me.name){
                var name = messageData.name, color = messageData.color, message = messageData.message;
                // var a = [name, color, message];
                // a.forEach(function(elt){ 

                printChatMessage(name, color, message);
            }
        })
    }


    // QUEST LOGIC

    // Set the map (If returning to map state, reload map)
    MapFactory.reloadMap().then(function(){   
        // If we're just picking up in the middle of the quest, draw the target and setBounds
        if ($scope.currentStepIndex>0) {
            MapFactory.addTargetCircle($scope.currentStep.targetCircle.center, $scope.currentStep.targetCircle.radius);
            MapFactory.fitBounds($scope.currentStep.targetCircle.center);
            $scope.showUisref = true;
        }

        // linking the MapFactory with the game logic.
        MapFactory.map.on('locationfound', function (e) {
            //set user location
            GeoFactory.position = [e.latlng.lat, e.latlng.lng];
            // user marker
            MapFactory.updateUserMarker();        
            // Tell server where you are so it can tell others in the room
            if ($scope.nsSocket) {
                $scope.nsSocket.emit('hereIAm', {
                    location: [e.latlng.lat, e.latlng.lng],
                    currentStepIndex: $scope.currentStepIndex,
                    name: $scope.me.name,
                    color: $scope.me.color
                });
            }

            if ($scope.questNotOver) {
                checkRegion();
            } 
        });
    });

    // Gets called on 'locationfound'. 
    function checkRegion() {
        if ($scope.justStarting) {
            openModal();
        } else {
            var circleCenter = $scope.currentStep.targetCircle.center;
            var circleRadius = $scope.currentStep.targetCircle.radius;
            var distanceFromtargetCircleCenter = QuestFactory.getDistanceFromLatLonInMi(circleCenter[0], circleCenter[1], GeoFactory.position[0], GeoFactory.position[1]) * (1.60934 * 1000);
            if (distanceFromtargetCircleCenter < circleRadius) {
                $scope.showUisref = false; // modal.show is async, and disabling ui-sref until modal opens avoids problems
                openModal();
            } 
        }
    }

    function checkWinner(fellow){
        // if the fellow is at the end, and it's not me (cause get own events) and no one has 'won' previously
        if ((fellow.currentStepIndex == $scope.steps.length) && (fellow.name !== $scope.me.name) && (!$scope.wins.winner) && (!alreadyWon)){
            // close progress
            var viewProgress = false;
            // set the winner
            $scope.wins.winner = fellow.name;
            // send a notification
            UserNotificationFactory.notifyUser(fellow.name + " Won the game!")
            // hide the main modal if it's open
                // this will not work because the this will trigger modal.on('hidden')
            // if ($scope.modalIsOpen) { $scope.modal.hide() }
            // 
            $scope.mainModalHidden = true;
            $scope.winModal.show();
            openedWinModal = true;
        }
    }

    $scope.closeAllModals = function(){
        if ($scope.modal.isShown()) $scope.modal.hide();
        if ($scope.winModal.isShown()) $scope.winModal.hide();
    };

    $scope.closeWinModal = function() {
        $scope.winModal.hide();
    };

    // Closing of modal brings us to next step
    $scope.$on('modal.hidden', function () {
        if (openedWinModal===false) {
        // remove areas from map
            $timeout(function(){ 
                $scope.modalIsOpen = false;

                    MapFactory.removeTargetCircle();
                    if ($scope.questNotOver === false) {
                        return; //If quest is done, no need to continue 
                    }
                    goToNextStep(); 

                    // All steps except the first one have a targetCircle
                    // If quest is not over, add new targetCircle to map and reset map bounds
                    if ($scope.currentStepIndex <= $scope.steps.length - 1) {
                        MapFactory.addTargetCircle($scope.currentStep.targetCircle.center, $scope.currentStep.targetCircle.radius);
                        // Set the map bounds to client and targetCircle
                        MapFactory.fitBounds($scope.currentStep.targetCircle.center);
                    }

            }, 300);
        } else {
            openedWinModal = false;
            $scope.mainModalHidden = false;
        }
        $scope.showUisref = true;
    });

    function goToNextStep() {
        if ($scope.justStarting) {
            $scope.justStarting = false;
        } else {
        // If that wasn't the opening modal, we now move to the next questStep      
            $scope.currentStep = $scope.steps[++$scope.currentStepIndex];
            updateStartedQuest();
        }
        // If quest is finished, delete startedQuest object, and call quest end modal
        if ($scope.currentStepIndex > $scope.steps.length-1) {
            alreadyWon = true;
            $timeout(prepareForEnd, 500);
        }
    }

    // If there is a startedQuest object, increment currentStep
    function updateStartedQuest() { 
        if ($stateParams.startedQuest) {    
            StartedQuestFactory.nextMapStep($stateParams.startedQuest._id);
        }
    }

    // If a question must be ansered to pass this new step, set the regex
    function setRegex() {
        if ($scope.currentStep.transitionInfo.question) {
            $scope.regex = new RegExp($scope.currentStep.transitionInfo.answer, 'i');
        }
    }

    // Delete startedQuest object if there is one, and call for questEnd modal
    function prepareForEnd() {
        if ($stateParams.startedQuest) {
            StartedQuestFactory.deleteStartedQuest($stateParams.startedQuest._id);
        }
        questEnd(); 
    }

    function questEnd(){
        $scope.questNotOver = false;
        openModal();
        // Put up modal with quest.closingInfo.title and quest.closingInfo.text
            // modal has option to stay in room or go view quests
        // Maybe make a dynamic modalCreator function
    }

    // MODAL

    function areModals(){
        return $scope.modal.isOpen() || $scope.winModal.isOpen();
    }

    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal){
        $scope.modal = modal;
    });

    $ionicModal.fromTemplateUrl('templates/winModal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        backdropClickToClose: true,
        hardwareBackButtonClose: false
    }).then(function(modal){
        $scope.winModal = modal;
    });
 

    function openModal() {
        if (!$scope.justStarting && $scope.currentStep && $scope.currentStep.transitionInfo && $scope.currentStep.transitionInfo.question) {
            $scope.button.buttonMessage = "Submit!";
        } else {
            $scope.button.buttonMessage = "Got It!";
        }
        $scope.modal.show().then(function(){ 
            if ($scope.modalIsOpen === false && !$scope.justStarting && $scope.questNotOver){  
                UserNotificationFactory.notifyUser("new region entered!");
            }
            $scope.modalIsOpen = true;
        });
    }

    $scope.attemptCloseModal = function(){
        // If there's a question to answer, only close modal if answer is correct
        if ($scope.questNotOver && (!$scope.justStarting && $scope.currentStep.transitionInfo.question)) {
          // will be undefined if the modal hasn't had time to load
          // need to have the regex defined before we close the modal.
            setRegex();
            if ($scope.regex.test($scope.form.answer)) { 
                $scope.modal.hide();
            } else {
                $scope.wrongAnswer = true;
                $timeout(function(){
                    $scope.wrongAnswer = false;
                }, 2000);
            }
            $scope.form.answer = "";
        } else {
            $scope.modal.hide();
        }
    };

    $scope.timeToGoHome = function(){
        $scope.modal.hide()
        SocketFactory.abandon($scope.nsSocket, $scope.mainSocket);
    }

    // buttons

    $scope.showMap = true;
    $scope.showProgress = false;
    $scope.showChat = false;

    $scope.mapButton = function(){
        $scope.showMap = true;
        $scope.showProgress = false;
        $scope.showChat = false;
        // modal reveal
    }


    $scope.progressButton = function(){
        $scope.showMap = false;
        $scope.showProgress = true;
        $scope.showChat = false;
        // modal hide
    }


    $scope.chatButton = function(){
        $scope.showMap = false;
        $scope.showProgress = false;
        $scope.showChat = true;
        // modal hide
    }
    // REVIEW
    $scope.isReviewSubmitted = false;

    $scope.submitReview = function(){
        $scope.isReviewSubmitted = true;
        QuestFactory.addReview($scope.quest._id, $scope.review.rating)
            .then(function(){
                $scope.isReviewSubmitted = false;
                $scope.reviewIsSubmitted = true;
                $timeout(function(){ $scope.hideReviewBox = true; }, 2000)
            })
    }

    // Used for generating color that your fellows see you as
    function getRandomColor() {
        var letters = '0123456789ABCDEFABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 22)];
        }
        return color;
    }

    // Live Chat Functions
    
    // get the user name?
    $scope.chat = {
        chatInput : "...",
        lastSender : undefined
    };

    $scope.sendMessage = function(){
        // ...
        var message = $scope.chat.chatInput;
        $scope.chat.chatInput = "";
        var wrappedName = $("<p>" + $scope.me.name + ":</p>").css("color", $scope.me.color).addClass("chatName");
        var wrappedMessage = $("<p>" + message + "</p>" )
        if ($scope.chat.lastSender !== $scope.me.name){
            $('div.chatArea').append(wrappedName);    
        }
        $('div.chatArea').append(wrappedMessage);
        $scope.chat.lastSender = $scope.me.name;
        $scope.nsSocket.emit('chatMessage', {
            message: message,
            name: $scope.me.name,
            color: $scope.me.color
        });
    }

    function printChatMessage(name, color, message){
        var messageContainer = $("<div></div>").addClass("chatMessage");
        var wrappedName = $("<p>" + name + ":</p>").css("color", color).addClass("chatName");
        var wrappedMessage = $("<p>" + message + "</p>" )
        // .addClass("chatMessage");
        // var wrappedAfter = wrappedName.after(wrappedMessage);
        if (name === $scope.chat.lastSender){
            $(".chatArea span p").last().after(wrappedMessage);
        } else {
            messageContainer.append(wrappedName).append(wrappedMessage);
            $('div.chatArea').append(messageContainer);
        }

        // $('div.chatArea').append(wrappedAfter);

        $scope.chat.lastSender = name;
    }

    // Home and Progress links react to click
    $('a').click(function() {
      var theLink = $(this);
      ClickFactory.mapLinkReact(theLink);
    });

});





    
