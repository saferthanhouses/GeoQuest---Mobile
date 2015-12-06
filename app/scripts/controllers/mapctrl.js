'use strict'

app.controller('MapCtrl', function ($scope, $rootScope, $ionicModal, MapFactory, $stateParams, GeoFactory, quest, SocketFactory, $cordovaGeolocation, QuestFactory, StartedQuestFactory) {

    // QUEST VARIABLES
    $scope.steps = quest.questSteps;
    $scope.currentStep = $scope.steps[0];
    $scope.currentStepIndex = 0;
    $scope.questNotOver = true;
    $scope.startedQuest = $stateParams.startedQuest; // Defined if creator was logged in when they summoned
    $scope.abandon = SocketFactory.abandon; // To disconnect sockets and go to 'Home' state

    // USER VARIABLES 
    $scope.me = {};
    $scope.fellows = [];

    // CONNECT SOCKETS AND REGISTER LISTENERS
    $rootScope.$on('sockets connected', function(event, theSockets) {
        $scope.mainSocket = theSockets.socket;
        $scope.nsSocket = theSockets.nsSocket;
        console.log('connected', $scope.mainSocket, $scope.nsSocket);
        registerSocketListeners();
    });
    SocketFactory.connectSockets($stateParams.questId, $stateParams.room);

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
            checkRegion();
        });
    });

    // Closing of modal brings us to next step
    $scope.$on('modal.hidden', function () {
        // remove areas from map
        MapFactory.removeTargetCircle();
        goToNextStep(); 
        // All steps except the first one have a targetCircle
        // If quest is not over, add new targetCircle to map and reset map bounds
        if ($scope.currentStepIndex < $scope.steps.length) {
            MapFactory.addTargetCircle($scope.currentStep.targetCircle.center, $scope.currentStep.targetCircle.radius);
            // Set the map bounds to client and targetCircle
            MapFactory.fitBounds($scope.currentStep.targetCircle.center, GeoFactory.position);
        }
    });

    // Gets called on 'locationfound'. 
    function checkRegion () {
        // If there's a targetCircle, check if we're in it, and if so open modal for this step
        if ($scope.currentStep.targetCircle.center.length) {
            var circleCenter = $scope.currentStep.targetCircle.center;
            var circleRadius = $scope.currentStep.targetCircle.radius;
            var distanceFromtargetCircleCenter = QuestFactory.getDistanceFromLatLonInMi(circleCenter[0], circleCenter[1], GeoFactory.position[0], GeoFactory.position[1]) * (1.60934 * 1000);
            if (distanceFromtargetCircleCenter < circleRadius) openModal();
        // If no targetCircle, open modal regarless of location (only instance of this is on map load)
        } else {
            openModal();
        }
    }
 
    function questEnd(){
        $scope.questNotOver = false;
        // Put up modal with quest.closingInfo.title and quest.closingInfo.text
            // modal has option to stay in room or go view quests
        // Maybe make a dynamic modalCreator function
    }

    function goToNextStep() {
        $scope.currentStep = $scope.steps[$scope.currentStepIndex + 1];
        if ($scope.startedQuest) $scope.startedQuest = StartedQuestFactory.nextMapStep($scope.startedQuest._id);
        if (++$scope.currentStepIndex > $scope.steps.length) {
            if ($scope.startedQuest) {
                StartedQuestFactory.deleteStartedQuest($scope.startedQuest._id);
                $scope.startedQuest = null;
            }
            questEnd(); 
        }
    }


    // MODAL

    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal){
        $scope.modal = modal;
    });

    // later will want to pass custom message into the modal
    function openModal() {
      // will be undefined if the modal hasn't had time to load
      $scope.modal.show();    
      // UserNotificationFactory.notifyUser("new region entered!");
    }

    $scope.closeModal = function(){
      $scope.modal.hide();
    };


    // helper funcs
    function convertToArr(object) {
        var arr = [];
        for (var key in object) {
            if(object.hasOwnProperty(key)) {
                arr.push(object[key]);
            }
        }
        return arr;
    }







});





