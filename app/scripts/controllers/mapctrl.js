'use strict'

app.controller('MapCtrl', function ($scope, $rootScope, $ionicModal, MapFactory, $stateParams, GeoFactory, SocketFactory, $cordovaGeolocation, QuestFactory, StartedQuestFactory, quest) {

    // QUEST VARIABLES
    console.log('$stateParams in map', $stateParams);
    // If there's a startedQuest object, use the embedded quest as our quest object
    if ($stateParams.startedQuest) {  // Defined if creator was logged in when they went through 'Contacts' state
        $scope.quest = $stateParams.startedQuest.quest;
        var room = $stateParams.startedQuest.room;
        // If this starteQuest is partially finished, pick up where user left off
        if ($stateParams.startedQuest.currentStepIndex > 0) {
            $scope.currentStepIndex = $scope.quest.currentStepIndex; 
        } else {
            $scope.currentStepIndex = -1; // Incremented to 0 when first modal closes
        }
    } else if ($stateParams.quest) { // if user did not log in at 'Transition' state
        $scope.quest = quest;
        var room = $stateParams.room;
        $scope.currentStepIndex = -1; // Incremented to 0 when first modal closes
    } 
    $scope.steps = $scope.quest.questSteps;
    // Set currentStep if the currentStep index is 0 or greater (true once first modal is closed)
    if ($scope.currentStepIndex >= 0) $scope.currentStep = $scope.steps[$scope.currentStepIndex]; 

    $scope.questNotOver = true;
    $scope.viewProgress = false;

    // USER VARIABLES 
    $scope.me = {name: $stateParams.name};
    $scope.fellows = [];
    $scope.getPercentage = function(stepIndex) {
        var percentage = (stepIndex / $scope.steps.length) * 100;
        return percentage + '%';
    };

    // CONNECT SOCKETS AND REGISTER LISTENERS
    $scope.abandon = SocketFactory.abandon; // To disconnect sockets and go to 'Home' state
    $rootScope.$on('sockets connected', function(event, theSockets) {
        $scope.mainSocket = theSockets.socket;
        $scope.nsSocket = theSockets.nsSocket;
        console.log('connected', $scope.mainSocket, $scope.nsSocket);
        registerSocketListeners();
    });
    var room = $stateParams.startedQuest ? $stateParams.startedQuest.room : $stateParams.room;
    console.log('rooooom', room);
    SocketFactory.connectSockets($scope.quest._id, $stateParams.room);

    function registerSocketListeners() {
        // So I can differentiate myself from others
        $scope.nsSocket.on('yourId', function(id) {
            $scope.me.id = id;
        });
        // All fellow-related logic happens in the SocketsFactory, and a new fellows array is returned
        $scope.nsSocket.on('fellowEvent', function(eventData) {
            $scope.fellows = SocketFactory[eventData.callMethod](eventData, $scope.fellows, $scope.me.id);
            MapFactory.updateFellowMarkers($scope.fellows);
        });

    }


    // QUEST LOGIC

    // Set the map (If returning to map state, reload map)
    MapFactory.reloadMap().then(function(){   
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
                    name: $scope.me.name
                });
            }
            checkRegion();
        });
    });

    // Gets called on 'locationfound'. 
    function checkRegion () {
        if ($scope.justStarting) {
            openModal();
        } else {
            var circleCenter = $scope.currentStep.targetCircle.center;
            var circleRadius = $scope.currentStep.targetCircle.radius;
            var distanceFromtargetCircleCenter = QuestFactory.getDistanceFromLatLonInMi(circleCenter[0], circleCenter[1], GeoFactory.position[0], GeoFactory.position[1]) * (1.60934 * 1000);
            if (distanceFromtargetCircleCenter < circleRadius) openModal();
        }
    }

    // Closing of modal brings us to next step
    $scope.$on('modal.hidden', function () {
        // remove areas from map
        MapFactory.removeTargetCircle();
        if (!$scope.questNotOver) return; //If quest is done, no need to continue 
        goToNextStep(); 
        // All steps except the first one have a targetCircle
        // If quest is not over, add new targetCircle to map and reset map bounds
        if ($scope.currentStepIndex < $scope.steps.length - 1) {
            MapFactory.addTargetCircle($scope.currentStep.targetCircle.center, $scope.currentStep.targetCircle.radius);
            // Set the map bounds to client and targetCircle
            MapFactory.fitBounds($scope.currentStep.targetCircle.center, GeoFactory.position);
        }
    });

    function goToNextStep() {
        if ($scope.justStarting) {
            $scope.justStarting = false;
            $scope.currentStep = $scope.steps[++$scope.currentStepIndex];
        } else {
        // If that wasn't the opening modal, we now move to the next questStep      
            $scope.currentStep = $scope.steps[$scope.currentStepIndex + 1];
            setRegex();
            updateStartedQuest();
        }
        // If quest is finished, delete startedQuest object, and call quest end modal
        if (++$scope.currentStepIndex > $scope.steps.length) {
            prepareForEnd();
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
        if ($scope.currentStep.question.length) {
            $scope.regex = new RegExp('/' + $scope.currentStep.answer + '/', 'i');
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
        // Put up modal with quest.closingInfo.title and quest.closingInfo.text
            // modal has option to stay in room or go view quests
        // Maybe make a dynamic modalCreator function
    }


    // MODAL

    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal){
        $scope.modal = modal;
    });

    function openModal() {
      // will be undefined if the modal hasn't had time to load
      $scope.modal.show();    
      // UserNotificationFactory.notifyUser("new region entered!");
    }

    $scope.attemptCloseModal = function(){
        // If there's a question to answer, only close modal if answer is correct
        if (!$scope.justStarting && $scope.currentStep.question.length) {
            if ($scope.regex.test($scope.currentStep.answer)) { 
                $scope.modal.hide();
            } else {
                // turn button gradually red than back
            }
        } else {
            $scope.modal.hide();
        }
    };

});





