'use strict';

app.config(function($stateProvider) {
	$stateProvider
	.state('Transition', {
	cache: false,
        url: '/transition',
        controller: 'TransitionCtrl',
        templateUrl: 'templates/transition.html',
        params: {
	        room: null,
	        questId: null,
	        quest: null
        },
        resolve: {
        	resolvedQuest: function(QuestFactory, $stateParams) {
                        console.log("$stateParams in transitionstate resolve", $stateParams);
        		if ($stateParams.questId) {
	        		return QuestFactory.getOneQuest($stateParams.questId);
        		}
        	}
        }
	});
});

