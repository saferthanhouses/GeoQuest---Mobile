'use strict'

app.config(function($stateProvider){
	$stateProvider
		.state('Auth', {
			url:'/auth',
			controller: 'AuthCtrl',
			// abstract: 'true';
		}
	)
})