'use strict'

app.controller('MapCtrl', function ($scope, $rootScope, $timeout, $ionicModal, MapFactory, $stateParams, GeoFactory, SocketFactory, $cordovaGeolocation, QuestFactory, StartedQuestFactory, UserNotificationFactory) {


    console.log("$scope.startedQuest", $scope.startedQuest);
    // QUEST VARIABLES
    // If there's a startedQuest object, use the embedded quest as our quest object
    if ($stateParams.startedQuest) {  // Defined if creator was logged in when they went through 'Contacts'
        $scope.startedQuest = true;
    } 
    $scope.quest = $stateParams.quest ? $stateParams.quest : $stateParams.startedQuest.quest;
    console.log("$scope.quest", $scope.quest)
    $scope.steps = $scope.quest.questSteps;
    // $scope.startedQuest = $stateParams.startedQuest; 
    // If there's a startedQuest object, check to see whether we should pick up in the middle
    if ($scope.startedQuest && $scope.startedQuest.currentStep > 0) {
        $scope.currentStepIndex = $scope.startedQuest.currentStep; 
        $scope.currentStep = $scope.steps[$scope.currentStepIndex];
    } else {
        $scope.currentStep = $scope.steps[0];
        $scope.currentStepIndex = -1; // Incremented to 0 when first modal closes
        $scope.justStarting = true; // So know to show opening message on first modal
    }
    $scope.questNotOver = true;

    // USER VARIABLES 
    $scope.me = {};
    $scope.fellows = [];
    console.log("startedQuest", $scope.startedQuest)
    // CONNECT SOCKETS AND REGISTER LISTENERS
    $scope.abandon = SocketFactory.abandon; // To disconnect sockets and go to 'Home' state
    $rootScope.$on('sockets connected', function(event, theSockets) {
        $scope.mainSocket = theSockets.socket;
        $scope.nsSocket = theSockets.nsSocket;
        console.log('connected', $scope.mainSocket, $scope.nsSocket);
        registerSocketListeners();
    });
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

        // When a fellow makes progress in his/her quest, update user's progress tracker
        $scope.nsSocket.on('progress', function(eventData) {
            // update progress dictionary on scope, which will update progress bars
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
                $scope.nsSocket.emit('hereIAm', [e.latlng.lat, e.latlng.lng]);  
            }
            if ($scope.questNotOver) checkRegion();
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
        console.log("modal hidden");
        MapFactory.removeTargetCircle();
        if ($scope.questNotOver === false) {
            console.log("quest is over");
            return; //If quest is done, no need to continue 
        }
        goToNextStep(); 



        // All steps except the first one have a targetCircle
        // If quest is not over, add new targetCircle to map and reset map bounds
        if ($scope.currentStepIndex <= $scope.steps.length - 1) {
            MapFactory.addTargetCircle($scope.currentStep.targetCircle.center, $scope.currentStep.targetCircle.radius);
            // Set the map bounds to client and targetCircle
            MapFactory.fitBounds($scope.currentStep.targetCircle.center, GeoFactory.position);
        }
    });

    function goToNextStep() {
        if ($scope.justStarting) {
            $scope.justStarting = false;
        } else {
        // If that wasn't the opening modal, we now move to the next questStep      
            $scope.currentStep = $scope.steps[$scope.currentStepIndex + 1];
            updateStartedQuest();
        }
        // If quest is finished, delete startedQuest object, and call quest end modal
        $scope.currentStepIndex++;
        if ($scope.currentStepIndex > $scope.steps.length-1) {
            console.log("about to preparefor the end")
            $timeout(prepareForEnd, 500);
            
        }
        console.log("currentStepIndex", $scope.currentStepIndex)
        console.log("steps.length", $scope.steps.length);
    }

    // If there is a startedQuest object, increment currentStep
    function updateStartedQuest() { 
        if ($scope.startedQuest) {    
            StartedQuestFactory.nextMapStep($scope.startedQuest._id)
            .then(function(updatedStartedQuest) {
                $scope.startedQuest = updatedStartedQuest;
            });
        }
    }

    // If a question must be ansered to pass this new step, set the regex
    function setRegex() {
        // console.log("inside setReg", $scope.currentStep.transitionInfo.question.length)
        if ($scope.currentStep.transitionInfo.question) {
            console.log("inside setReg: there is a ", $scope.currentStep.transitionInfo)
            $scope.regex = new RegExp($scope.currentStep.transitionInfo.answer, 'i');
            console.log("regex", $scope.regex)
        }
    }

    // Delete startedQuest object if there is one, and call for questEnd modal
    function prepareForEnd() {
        if ($scope.startedQuest) {
            StartedQuestFactory.deleteStartedQuest($scope.startedQuest._id);
            $scope.startedQuest = null;
        }
        questEnd(); 
    }

    function questEnd(){
        console.log("quest is ending");
        $scope.questNotOver = false;
        console.log("questNotOver", $scope.questNotOver);
        openModal();
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
      $scope.modal.show();    
      // UserNotificationFactory.notifyUser("new region entered!");
    }

    $scope.attemptCloseModal = function(){
        // If there's a question to answer, only close modal if answer is correct
        if (!$scope.justStarting && $scope.currentStep.transitionInfo.question.length) {
          // will be undefined if the modal hasn't had time to load
          // need to have the regex defined before we close the modal.
          setRegex();
              if ($scope.currentStep.transitionInfo.question.length) {
                  console.log("currentStep.transitionInfo.question", $scope.currentStep.transitionInfo.question);
              }
            if ($scope.regex.test($scope.currentStep.transitionInfo.answer)) { 
                $scope.modal.hide();
            } else {
                console.log("wrong answer");
                // turn button gradually red than back
            }
        } else {
            $scope.modal.hide();
        }
    };

    // REVIEW
    $scope.isReviewSubmitted = false;

    $scope.submitReview = function(){
        $scope.isReviewSubmitted = true;
        QuestFactory.addReview($scope.quest._id, $scope.rating)
            .then(function(){
                $scope.isReviewSubmitted = false;
                $scope.reviewIsSubmitted = true;
                $timeout(function(){ $scope.hideReviewBox = true; }, 2000)
            })
    }

});





